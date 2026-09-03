// src/editor/hooks/useLessonData.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLessonStore } from '../../../store/useLessonStore';
import { getBlockDefaults } from '../../../store/blockDefaults';
import { getEffectiveRightPanelMode } from '../../../utils/pageMode';
import { toast } from '../../../store/useToastStore';
import api from '../../../lib/api';

// Helper: Bulletproof JSON Parsing for Backend Data
const formatBlocksWithParse = (blocks) => {
    return (blocks || []).sort((a, b) => a.order - b.order).map(b => {
        let parsedContent = b.content;
        
        if (typeof parsedContent === 'string') {
            try { 
                parsedContent = JSON.parse(parsedContent); 
                if (typeof parsedContent === 'string') parsedContent = JSON.parse(parsedContent);
            } 
            catch (e) { 
                console.warn("Failed to parse block content:", b.content);
                parsedContent = {}; 
            }
        }
        
        return { ...b, content: { ...getBlockDefaults(b.type), ...(parsedContent || {}) } };
    });
};

// Helper to ignore UI-only state changes (like switching pages) when checking for unsaved changes
const getSavableData = (lessonObj) => {
    if (!lessonObj) return null;
    const { currentPageIndex, ...rest } = lessonObj;
    return rest;
};

export const useLessonData = (lessonId) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [autoSaving, setAutoSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [saveFailed, setSaveFailed] = useState(false);
    const [saveConflict, setSaveConflict] = useState(false);
    const [loadError, setLoadError] = useState(null);
    
    const lesson = useLessonStore(state => state.lesson);
    const deletedBlockIds = useLessonStore(state => state.deletedBlockIds);
    const deletedPageIds = useLessonStore(state => state.deletedPageIds);
    const setLesson = useLessonStore(state => state.setLesson);
    const resetLesson = useLessonStore(state => state.resetLesson);

    const lastSavedLessonRef = useRef(null);
    const lastSavedRevisionRef = useRef(null);
    const saveInFlightRef = useRef(false);
    const pendingSaveRef = useRef(false);
    
    // THE FIX: The Invisible Map to translate UI IDs to Server IDs
    const serverIdsMapRef = useRef({ pages: {}, blocks: {} });

    // --- 1. INITIAL LOAD ---
    useEffect(() => {
        const loadData = async () => {
            if (!lessonId) return;
            resetLesson();
            serverIdsMapRef.current = { pages: {}, blocks: {} };
            setSaveFailed(false);
            setLoadError(null);
            setLoading(true);
            try {
                const res = await api.get(`/api/lessons/${lessonId}/`);
                
                const formattedLesson = formatLessonResponse(res.data);
                
                lastSavedLessonRef.current = formattedLesson;
                lastSavedRevisionRef.current = res.data.content_revision || null;
                setLesson(formattedLesson);
            } catch (err) {
                console.error("Failed to load lesson", err);
                const status = err.response?.status;
                setLoadError({
                    status,
                    message: status === 404
                        ? "This lesson does not exist in the local database. It may belong to another local account or setup."
                        : status === 403
                            ? "Your current account does not have access to this lesson."
                            : "The lesson could not be loaded. Check that the local backend is running, then try again."
                });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [lessonId, resetLesson, setLesson]);

    const checkForRemoteChanges = useCallback(async () => {
        if (loading || saveInFlightRef.current || !lastSavedLessonRef.current) return;

        const storeState = useLessonStore.getState();
        const isDirty =
            JSON.stringify(getSavableData(storeState.lesson)) !== JSON.stringify(getSavableData(lastSavedLessonRef.current)) ||
            (storeState.deletedBlockIds || []).length > 0 ||
            (storeState.deletedPageIds || []).length > 0;
        if (isDirty) return;

        try {
            const res = await api.get(`/api/lessons/${lessonId}/`);
            const remoteRevision = res.data?.content_revision;
            if (lastSavedRevisionRef.current && remoteRevision && remoteRevision !== lastSavedRevisionRef.current) {
                toast.info('This lesson was updated on another computer. Loading the latest version.');
                window.location.reload();
            }
        } catch (err) {
            console.error('Failed to check for lesson updates', err);
        }
    }, [lessonId, loading]);

    useEffect(() => {
        if (loading) return undefined;
        const handleFocus = () => checkForRemoteChanges();
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') checkForRemoteChanges();
        };
        const interval = window.setInterval(checkForRemoteChanges, 15000);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            window.clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [checkForRemoteChanges, loading]);

    // --- 2. AUTOSAVE TRACKER ---
    useEffect(() => {
        if (loading || !lastSavedLessonRef.current) return;

        const isDirty = 
            JSON.stringify(getSavableData(lesson)) !== JSON.stringify(getSavableData(lastSavedLessonRef.current)) ||
            (deletedBlockIds && deletedBlockIds.length > 0) ||
            (deletedPageIds && deletedPageIds.length > 0);

        setHasUnsavedChanges(isDirty);

        if (isDirty) {
            const timer = setTimeout(() => {
                handleSave(true);
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [lesson, deletedBlockIds, deletedPageIds, loading]);

    // --- 3. MASTER SAVE FUNCTION ---
    const handleSave = async (isAutoSave = false) => {
        if (saveInFlightRef.current) {
            pendingSaveRef.current = true;
            return;
        }

        if (!isAutoSave) {
            setSaving(true);
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
        } else {
            setAutoSaving(true);
        }

        // Force local state to sync before we capture the snapshot
        window.dispatchEvent(new CustomEvent('lesson:force-sync'));
        await new Promise(resolve => setTimeout(resolve, 50));

        const storeState = useLessonStore.getState();
        const snapshotLesson = storeState.lesson; 

        const currentDeletedBlockIds = Array.isArray(storeState.deletedBlockIds) ? storeState.deletedBlockIds : [];
        const currentDeletedPageIds = Array.isArray(storeState.deletedPageIds) ? storeState.deletedPageIds : [];

        const blocksToDelete = [...new Set(currentDeletedBlockIds.filter(Boolean).map(item => String(typeof item === 'object' ? item.id : item)))];
        const pagesToDelete = [...new Set(currentDeletedPageIds.filter(Boolean).map(String))];

        const isTempId = (id) => {
            if (!id) return false;
            const strId = String(id);
            return strId.startsWith('block-') || strId.startsWith('temp') || strId.startsWith('page-'); 
        };

        // Access our invisible map helpers
        const serverIds = serverIdsMapRef.current;
        const getRealPageId = (id) => serverIds.pages[id] || id;
        const getRealBlockId = (id) => serverIds.blocks[id] || id;

        try {
            saveInFlightRef.current = true;
            setSaveFailed(false);
            setSaveConflict(false);

            // Map deletions from UI IDs to server IDs and ignore never-saved temp records.
            const realPagesToDelete = pagesToDelete.map(getRealPageId).filter(id => !isTempId(id));
            const realBlocksToDelete = blocksToDelete.map(getRealBlockId).filter(id => !isTempId(id));

            const pagesPayload = snapshotLesson.pages.map((page, pageIndex) => ({
                id: page.id,
                serverId: getRealPageId(page.id),
                title: page.title,
                group: page.group || "Ungrouped",
                layout: page.layout,
                rightPanelMode: getEffectiveRightPanelMode(page),
                order: pageIndex,
                leftPanel: (page.leftPanel || [])
                    .filter(b => !blocksToDelete.includes(String(b.id)))
                    .map((block, order) => ({
                        id: block.id,
                        serverId: getRealBlockId(block.id),
                        type: block.type,
                        content: block.content,
                        order
                    })),
                rightPanel: (page.rightPanel || [])
                    .filter(b => !blocksToDelete.includes(String(b.id)))
                    .map((block, order) => ({
                        id: block.id,
                        serverId: getRealBlockId(block.id),
                        type: block.type,
                        content: block.content,
                        order
                    }))
            }));

            const payload = {
                base_revision: lastSavedRevisionRef.current,
                lesson: {
                    title: snapshotLesson.title,
                    description: snapshotLesson.description || '',
                    module_name: snapshotLesson.module_name || 'Module 1',
                    is_free_preview: !!snapshotLesson.is_free_preview,
                    is_published: !!snapshotLesson.is_published,
                    visibility: snapshotLesson.visibility || 'private',
                    price: snapshotLesson.price || 0,
                }
            };
            payload.pages = pagesPayload;
            payload.deleted_page_ids = realPagesToDelete;
            payload.deleted_block_ids = realBlocksToDelete;

            const res = await api.post(`/api/lessons/${lessonId}/autosave/`, payload);
            const nextMap = res.data?.id_map || {};
            serverIds.pages = { ...serverIds.pages, ...(nextMap.pages || {}) };
            serverIds.blocks = { ...serverIds.blocks, ...(nextMap.blocks || {}) };

            useLessonStore.setState(state => ({
                deletedPageIds: (state.deletedPageIds || []).filter(id => !pagesToDelete.includes(String(id))),
                deletedBlockIds: (state.deletedBlockIds || []).filter(id => !blocksToDelete.includes(String(id)))
            }));
            
            // WE NO LONGER MUTATE THE ZUSTAND STORE IDs! 
            // The frontend is perfectly happy running on its temporary UI IDs.
            // By doing this, React never unmounts your blocks, and typing is completely uninterrupted.
            
            // We set the ref to exactly what we just saved. If you typed "World" during the network
            // request, it wasn't in the snapshot, so the dirty tracker will catch it and trigger another save.
            lastSavedLessonRef.current = snapshotLesson;
            lastSavedRevisionRef.current = res.data?.lesson?.content_revision || lastSavedRevisionRef.current;
            
            // Double check if the user kept typing while the save was running
            const activeStoreLesson = useLessonStore.getState().lesson;
            const stillDirty = JSON.stringify(getSavableData(activeStoreLesson)) !== JSON.stringify(getSavableData(snapshotLesson));
            setHasUnsavedChanges(stillDirty);

            if (!isAutoSave) {
                toast.success("Saved successfully!");
            }
        } catch (err) {
            console.error("Save Error:", err);
            if (err.response?.status === 409 && err.response?.data?.code === 'edit_conflict') {
                pendingSaveRef.current = false;
                setSaveConflict(true);
                setSaveFailed(false);
                setHasUnsavedChanges(true);
                toast.error('This lesson changed on another computer. Load the latest version before continuing.');
                return;
            }
            setSaveFailed(true);
            setHasUnsavedChanges(true);
            if (!isAutoSave) toast.error("Failed to save.");
        } finally {
            saveInFlightRef.current = false;
            if (!isAutoSave) setSaving(false);
            else setAutoSaving(false);

            if (pendingSaveRef.current) {
                pendingSaveRef.current = false;
                setTimeout(() => handleSave(true), 0);
            }
        }
    };

    return { loading, loadError, saving, autoSaving, hasUnsavedChanges, saveFailed, saveConflict, handleSave };
};

const createDefaultHeadingBlock = () => ({
    id: `temp-block-${crypto.randomUUID()}`,
    type: 'h1',
    content: getBlockDefaults('h1')
});
const formatLessonResponse = (apiData) => {
    const formattedLesson = {
        ...apiData,
        pages: (apiData.pages || []).map(page => {
            const leftPanel = formatBlocksWithParse(page.blocks?.filter(b => b.panel === 'leftPanel'));
            const formattedPage = {
                ...page,
                leftPanel: leftPanel.length ? leftPanel : [createDefaultHeadingBlock()],
                rightPanel: formatBlocksWithParse(page.blocks?.filter(b => b.panel === 'rightPanel'))
            };
            return {
                ...formattedPage,
                rightPanelMode: getEffectiveRightPanelMode(formattedPage)
            };
        })
    };

    if (!formattedLesson.pages.length && apiData.can_view_content !== false) {
        formattedLesson.pages = [{
            id: `temp-page-${crypto.randomUUID()}`,
            title: 'Introduction',
            group: 'Module 1',
            layout: 'single',
            rightPanelMode: 'standard',
            leftPanel: [createDefaultHeadingBlock()],
            rightPanel: []
        }];
        formattedLesson.currentPageIndex = 0;
    }

    return formattedLesson;
};
