import React, { memo, useState, useRef, useEffect, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableBlock } from '../../../block/SortableBlock';
import { useLessonStore } from '../../../../store/useLessonStore';
import { flushPendingBlockEdits } from '../../../../store/createBlockSlice';
import { BottomToolbar } from '../toolbar/BottomToolbar';
import { useShallow } from 'zustand/react/shallow';

const ConnectedBlock = memo(({ blockId, isEditable = true, readOnly = false }) => {
  const block = useLessonStore(useShallow(state => {
    const page = state.lesson.pages[state.lesson.currentPageIndex];
    return page?.leftPanel.find(b => b.id === blockId) ||
      page?.rightPanel.find(b => b.id === blockId);
  }));

  const isSelected = useLessonStore(state => state.selectedBlockId === blockId);
  const isMultiSelected = useLessonStore(state => state.selectedBlockIds.includes(blockId));
  const isEditing = useLessonStore(state => state.editingBlockId === blockId);
  const setSelectedBlock = useLessonStore(state => state.setSelectedBlock);
  const deleteBlock = useLessonStore(state => state.deleteBlock);

  if (!block) return null;

  return (
    <SortableBlock
      block={block}
      isSelected={isSelected}
      isMultiSelected={isMultiSelected}
      isEditing={isEditing}
      onClick={() => setSelectedBlock(block.id)}
      isEditable={isEditable}
      readOnly={readOnly}
      onEdit={() => setSelectedBlock(block.id)}
      onDelete={() => deleteBlock(block.id)}
    />
  );
});

const EmptyCanvasState = ({ onAddBlock }) => (
  <div className="min-h-[50vh] animate-fade-in">
    <button
      type="button"
      className="group flex w-full items-center gap-3 py-4 text-left text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      onClick={(e) => { e.stopPropagation(); onAddBlock('h1'); }}
    >
      <span className="text-3xl font-semibold tracking-tight opacity-60 transition-opacity group-hover:opacity-100">Click to start writing</span>
    </button>
    <p className="text-sm text-[var(--color-muted-foreground)]">Type a heading, or press / for another block type.</p>
  </div>
);

const EmptyReadOnlyCanvasState = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-sm text-[var(--color-muted-foreground)]">
    Nothing on this page yet.
  </div>
);

const SelectionRect = ({ rect }) => {
  if (!rect) return null;
  return (
    <div
      className="absolute pointer-events-none z-40 border border-[var(--color-primary)] bg-[var(--color-primary)]/8 rounded-sm"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.right - rect.left,
        height: rect.bottom - rect.top,
      }}
    />
  );
};

export const CanvasPanel = ({ id, title, theme, isResizing, toolbarForceVisible = false, blockEditable = true, readOnly = false, surface = 'background' }) => {
  const blockIds = useLessonStore(useShallow(state => {
    const page = state.lesson.pages[state.lesson.currentPageIndex];
    return page ? page[id].map(b => b.id) : [];
  }));

  const addBlock = useLessonStore(state => state.addBlock);
  const setSelectedBlock = useLessonStore(state => state.setSelectedBlock);
  const { setNodeRef } = useDroppable({ id, disabled: readOnly });

  const scrollRef = useRef(null);
  const dragState = useRef({ start: null, isDragging: false, didDrag: false });
  const [selectionRect, setSelectionRect] = useState(null);

  const handleAddBlock = (type) => {
    if (!readOnly) addBlock(id, type);
    if (!readOnly && typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        scrollRef.current?.querySelector('[contenteditable="true"]')?.focus();
      });
    }
  };

  const handleEmptySpaceClick = (e) => {
    if (readOnly) return;
    if (dragState.current.didDrag) {
      dragState.current.didDrag = false;
      return;
    }

    e.stopPropagation();
    if (blockIds.length === 0) {
      handleAddBlock('h1');
      return;
    }
    const state = useLessonStore.getState();
    const page = state.lesson.pages[state.lesson.currentPageIndex];
    const blocks = page[id];
    const lastBlock = blocks[blocks.length - 1];

    if (lastBlock.type === 'text') {
      setSelectedBlock(lastBlock.id);
      return;
    }
    handleAddBlock('text');
  };

  useEffect(() => {
    if (readOnly) return undefined;
    const container = scrollRef.current;
    if (!container) return;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('[data-block-id]')) return;
      if (e.target.closest('button')) return;
      if (e.target.closest('[data-no-select]')) return;

      const rect = container.getBoundingClientRect();
      dragState.current.start = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top + container.scrollTop,
        clientX: e.clientX,
        clientY: e.clientY,
      };
      dragState.current.isDragging = false;
    };

    const onMouseMove = (e) => {
      const ds = dragState.current;
      if (!ds.start) return;

      const dx = e.clientX - ds.start.clientX;
      const dy = e.clientY - ds.start.clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (!ds.isDragging && dist < 5) return;

      if (!ds.isDragging) {
        ds.isDragging = true;
        ds.didDrag = true;
        useLessonStore.getState().clearMultiSelection();
        document.body.style.userSelect = 'none';
      }

      const containerRect = container.getBoundingClientRect();
      const currentX = e.clientX - containerRect.left;
      const currentY = e.clientY - containerRect.top + container.scrollTop;

      const selRect = {
        left: Math.min(ds.start.x, currentX),
        top: Math.min(ds.start.y, currentY),
        right: Math.max(ds.start.x, currentX),
        bottom: Math.max(ds.start.y, currentY),
      };

      setSelectionRect(selRect);

      const blockEls = container.querySelectorAll('[data-block-id]');
      const ids = [];

      blockEls.forEach(el => {
        const elRect = el.getBoundingClientRect();
        const elTop = elRect.top - containerRect.top + container.scrollTop;
        const elBottom = elRect.bottom - containerRect.top + container.scrollTop;
        const elLeft = elRect.left - containerRect.left;
        const elRight = elRect.right - containerRect.left;

        if (selRect.left <= elRight && selRect.right >= elLeft &&
            selRect.top <= elBottom && selRect.bottom >= elTop) {
          ids.push(el.getAttribute('data-block-id'));
        }
      });

      const store = useLessonStore.getState();
      const currentIds = store.selectedBlockIds;
      if (ids.length !== currentIds.length || !ids.every((v, i) => v === currentIds[i])) {
        flushPendingBlockEdits();
        useLessonStore.setState({
          selectedBlockIds: ids,
          selectedBlockId: ids[ids.length - 1] || null,
          editingBlockId: null,
        });
      }
    };

    const onMouseUp = () => {
      if (dragState.current.start) {
        dragState.current.start = null;
        dragState.current.isDragging = false;
        setSelectionRect(null);
        document.body.style.userSelect = '';
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [readOnly]);

  const isFloating = surface === 'floating';
  const surfaceClass = isFloating ? 'surface-floating' : 'app-canvas-surface';
  // Narrow floating panel gets tighter, consistent horizontal padding so its
  // blocks aren't cramped by the wide left-canvas gutters.
  const paddingClass = isFloating
    ? 'py-6 px-5 md:px-6 pb-24'
    : 'py-8 px-6 md:px-16 lg:px-20 pb-32';

  return (
    <div ref={setNodeRef} className={`flex flex-col h-full overflow-hidden relative ${surfaceClass}`}>

      {isResizing && <div className="absolute inset-0 z-50 cursor-col-resize" />}

      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto custom-scrollbar cursor-text relative ${paddingClass}`}
        onClick={readOnly ? undefined : handleEmptySpaceClick}
      >
        {!readOnly && <SelectionRect rect={selectionRect} />}
        <SortableContext items={blockIds} strategy={verticalListSortingStrategy}>
          <div className="max-w-3xl mx-auto min-h-[50vh]">
            {blockIds.length === 0 ? (
              readOnly ? <EmptyReadOnlyCanvasState /> : <EmptyCanvasState onAddBlock={handleAddBlock} />
            ) : (
              <>
                {blockIds.map(blockId => (
                  <ConnectedBlock key={blockId} blockId={blockId} isEditable={blockEditable} readOnly={readOnly} />
                ))}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={(event) => { event.stopPropagation(); handleAddBlock('text'); }}
                    aria-label="Add text block below"
                    className="block min-h-14 w-full cursor-text rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                  >
                  </button>
                )}
              </>
            )}
          </div>
        </SortableContext>
      </div>

      {!readOnly && <BottomToolbar onAddBlock={handleAddBlock} forceVisible={toolbarForceVisible} />}
    </div>
  );
};
