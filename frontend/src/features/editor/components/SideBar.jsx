import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLessonStore } from '../../../store/useLessonStore';
import {
  ChevronRight,
  ChevronDown,
  ArrowDown,
  ArrowUp,
  FileText,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  Heading1,
  Heading2,
  Heading3
} from 'lucide-react';
import { isSlashCommandDraft } from '../../../utils/pageTitles';

const EditableInput = ({ value, onCommit, onFinish, className, placeholder, ...props }) => {
  const [localValue, setLocalValue] = useState(value);
  const skipCommitRef = useRef(false);

  useEffect(() => { setLocalValue(value); }, [value]);

  const handleBlur = () => {
    if (!skipCommitRef.current && localValue !== value) onCommit(localValue);
    skipCommitRef.current = false;
    onFinish?.();
  };

  return (
    <input
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          skipCommitRef.current = true;
          setLocalValue(value);
          e.currentTarget.blur();
        }
      }}
      className={className}
      placeholder={placeholder}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      {...props}
    />
  );
};

const HEADING_ICONS = { h1: Heading1, h2: Heading2, h3: Heading3 };

const getHeadingText = (block) => {
  const domEl = document.querySelector(`[data-block-id="${block.id}"]`);
  if (domEl) {
    const text = domEl.textContent?.trim();
    if (text) return text;
  }
  if (typeof block.content === 'string') return block.content.trim();
  const html = block.content?.html || '';
  const stripped = html.replace(/<[^>]*>/g, '').trim();
  return stripped || block.content?.text?.trim() || '';
};

const extractHeadings = (blocks) => {
  if (!blocks) return [];
  return blocks
    .map((block, index) => ({ block, index }))
    .filter(({ block, index }) => (
      index > 0 && (block.type === 'h1' || block.type === 'h2' || block.type === 'h3')
    ))
    .map(({ block }) => ({ id: block.id, type: block.type, text: getHeadingText(block) }))
    .filter(heading => heading.text && !isSlashCommandDraft(heading.text));
};

const HeadingOutline = ({ headings, onScrollTo }) => {
  if (headings.length === 0) return null;

  return (
    <div className="ml-5 mt-0.5 mb-1 border-l border-[var(--color-border)]">
      {headings.map(h => {
        const indent = h.type === 'h1' ? 'pl-2' : h.type === 'h2' ? 'pl-4' : 'pl-6';
        const Icon = HEADING_ICONS[h.type];
        return (
          <button
            key={h.id}
            onClick={(e) => { e.stopPropagation(); onScrollTo(h.id); }}
            className={`${indent} flex items-center gap-1.5 w-full text-left py-0.5 text-[11px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors truncate`}
          >
            <Icon size={10} className="shrink-0 opacity-50" />
            <span className="truncate">{h.text}</span>
          </button>
        );
      })}
    </div>
  );
};

const SortablePageRow = ({
  page,
  currentPageIndex,
  goToPage,
  updatePage,
  deletePage,
  movePage,
  totalPages,
  readOnly,
  onScrollTo
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTitleHovered, setIsTitleHovered] = useState(false);
  const [titleOverflow, setTitleOverflow] = useState(0);
  const menuRef = useRef(null);
  const titleViewportRef = useRef(null);
  const titleTextRef = useRef(null);
  const isCurrent = page.originalIndex === currentPageIndex;
  const headings = extractHeadings(page.leftPanel);
  const {
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: page.id, disabled: readOnly });

  useEffect(() => {
    const viewport = titleViewportRef.current;
    const text = titleTextRef.current;
    if (!viewport || !text || isEditing) return undefined;

    const measureOverflow = () => {
      setTitleOverflow(Math.max(0, text.scrollWidth - viewport.clientWidth));
    };
    measureOverflow();
    const observer = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(measureOverflow)
      : null;
    observer?.observe(viewport);
    return () => observer?.disconnect();
  }, [page.title, isEditing]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeMenu, true);
    return () => document.removeEventListener('pointerdown', closeMenu, true);
  }, [isMenuOpen]);

  const confirmDelete = () => {
    setIsMenuOpen(false);
    if (totalPages <= 1) return;
    if (window.confirm(`Delete page "${page.title}"? This cannot be undone.`)) {
      deletePage(page.originalIndex);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.55 : 1,
        zIndex: isDragging ? 30 : 'auto'
      }}
      onPointerDown={readOnly ? undefined : listeners?.onPointerDown}
      className={`group/page relative ${readOnly ? '' : 'touch-none cursor-grab active:cursor-grabbing'}`}
    >
      <div
        className={`flex min-h-9 items-center gap-1 rounded-md px-1 py-1 text-sm transition-colors ${
          isCurrent
            ? 'bg-[var(--color-muted)] font-medium text-[var(--color-foreground)]'
            : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]'
        } ${isDragging ? 'shadow-sm ring-1 ring-[var(--color-border)]' : ''}`}
      >
        <FileText size={14} className="shrink-0 opacity-60" />

        {isEditing && !readOnly ? (
          <EditableInput
            autoFocus
            className="min-w-0 flex-1 rounded bg-[var(--color-background)] px-1 text-sm outline-none ring-1 ring-[var(--color-ring)]"
            value={page.title}
            onCommit={(value) => updatePage(page.originalIndex, { title: value.trim() || 'Untitled page' })}
            onFinish={() => setIsEditing(false)}
            aria-label={`Rename ${page.title}`}
          />
        ) : (
          <button
            type="button"
            onClick={() => goToPage(page.originalIndex)}
            onMouseEnter={() => setIsTitleHovered(true)}
            onMouseLeave={() => setIsTitleHovered(false)}
            className="min-w-0 flex-1 overflow-hidden rounded px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            title={page.title}
          >
            <span ref={titleViewportRef} className="block overflow-hidden">
              <span
                ref={titleTextRef}
                className="block w-max whitespace-nowrap will-change-transform"
                style={{
                  transform: isTitleHovered && titleOverflow > 0
                    ? `translateX(-${titleOverflow}px)`
                    : 'translateX(0)',
                  transition: isTitleHovered && titleOverflow > 0
                    ? `transform ${Math.max(1.6, titleOverflow / 32)}s linear 300ms`
                    : 'transform 180ms ease-out'
                }}
              >
                {page.title}
              </span>
            </span>
          </button>
        )}

        {!readOnly && (
          <div ref={menuRef} className="relative shrink-0" onPointerDown={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsMenuOpen((open) => !open)}
              className={`flex h-7 w-7 items-center justify-center rounded text-[var(--color-muted-foreground)] transition-opacity hover:bg-[var(--color-background)] hover:text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] ${
                isCurrent || isMenuOpen ? 'opacity-70' : 'opacity-0 group-hover/page:opacity-60 focus-visible:opacity-100'
              }`}
              aria-label={`Page actions for ${page.title}`}
              aria-expanded={isMenuOpen}
              title="Page actions"
            >
              <MoreHorizontal size={14} />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-8 z-50 w-36 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsEditing(true);
                  }}
                  className="flex min-h-9 w-full items-center gap-2 rounded px-2 text-left text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  <Pencil size={13} /> Rename
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    movePage(page.id, -1);
                  }}
                  disabled={page.originalIndex === 0}
                  className="flex min-h-9 w-full items-center gap-2 rounded px-2 text-left text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowUp size={13} /> Move up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    movePage(page.id, 1);
                  }}
                  disabled={page.originalIndex === totalPages - 1}
                  className="flex min-h-9 w-full items-center gap-2 rounded px-2 text-left text-xs text-[var(--color-foreground)] hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowDown size={13} /> Move down
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={totalPages <= 1}
                  className="flex min-h-9 w-full items-center gap-2 rounded px-2 text-left text-xs text-red-600 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-40 dark:text-red-400 dark:hover:bg-red-950/40"
                  title={totalPages <= 1 ? 'A lesson needs at least one page' : undefined}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isCurrent && <HeadingOutline headings={headings} onScrollTo={onScrollTo} />}
    </div>
  );
};

const SectionGroup = ({ groupName, pages, currentPageIndex, goToPage, updatePage, deletePage, movePage, addPage, totalPages, readOnly = false, showHeader = true }) => {
  const [isOpen, setIsOpen] = useState(true);

  const scrollToBlock = (blockId) => {
    const el = document.querySelector(`[data-block-id="${blockId}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="mb-1">
      {showHeader && (
        <div
          className="group/section flex min-h-8 cursor-pointer items-center gap-1 rounded-md px-2 py-1 transition-colors hover:bg-[var(--color-muted)]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown size={12} className="text-[var(--color-muted-foreground)] shrink-0" /> : <ChevronRight size={12} className="text-[var(--color-muted-foreground)] shrink-0" />}
          {readOnly ? (
            <span className="min-w-0 flex-1 truncate px-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">{groupName}</span>
          ) : (
            <>
              <EditableInput
                className="bg-transparent text-xs font-medium text-[var(--color-muted-foreground)] outline-none flex-1 min-w-0 focus:bg-[var(--color-muted)] focus:text-[var(--color-foreground)] rounded px-1 truncate uppercase tracking-wide"
                value={groupName}
                onCommit={(val) => pages.forEach(p => updatePage(p.originalIndex, { group: val }))}
                aria-label={`Rename section ${groupName}`}
              />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); addPage(groupName); }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-[var(--color-muted-foreground)] opacity-0 transition-opacity hover:text-[var(--color-primary)] hover:[filter:drop-shadow(0_0_6px_var(--color-primary))] focus-visible:opacity-100 group-hover/section:opacity-100"
                aria-label={`Add page to ${groupName}`}
                title="Add page to section"
              >
                <Plus size={12} />
              </button>
            </>
          )}
        </div>
      )}

      {(isOpen || !showHeader) && (
        <div className={showHeader ? 'ml-3 border-l border-[var(--color-border)] pl-2' : ''}>
          <SortableContext items={pages.map((page) => page.id)} strategy={verticalListSortingStrategy}>
            {pages.map((page) => (
              <SortablePageRow
                key={page.id}
                page={page}
                currentPageIndex={currentPageIndex}
                goToPage={goToPage}
                updatePage={updatePage}
                deletePage={deletePage}
                movePage={movePage}
                totalPages={totalPages}
                readOnly={readOnly}
                onScrollTo={scrollToBlock}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
};

export const EditorSidebarContent = ({ onClose, readOnly = false }) => {
  const { lesson, goToPage, addPage, updatePage, deletePage, reorderPage } = useLessonStore();
  const currentPageIndex = lesson.currentPageIndex;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const structure = useMemo(() => {
    const groups = {};
    lesson.pages.forEach((page, index) => {
      const groupName = page.group || 'Ungrouped';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push({ ...page, originalIndex: index });
    });
    return groups;
  }, [lesson.pages]);

  const sectionEntries = Object.entries(structure);
  const showSectionGroups = sectionEntries.length > 1;
  const createSection = () => {
    const existingNames = new Set(Object.keys(structure));
    let sectionNumber = existingNames.size + 1;
    while (existingNames.has(`Section ${sectionNumber}`)) sectionNumber += 1;
    addPage(`Section ${sectionNumber}`);
  };
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const targetPage = lesson.pages.find((page) => page.id === over.id);
    reorderPage(active.id, over.id, targetPage?.group);
  };
  const movePage = (pageId, offset) => {
    const currentIndex = lesson.pages.findIndex((page) => page.id === pageId);
    const targetPage = lesson.pages[currentIndex + offset];
    if (currentIndex === -1 || !targetPage) return;
    reorderPage(pageId, targetPage.id, targetPage.group);
  };

  return (
    <div className="h-full w-56 flex flex-col">
      <div className="h-11 flex items-center gap-2 px-3 border-b border-[var(--color-border)] shrink-0">
        <span className="text-xs font-medium text-[var(--color-muted-foreground)] tracking-wide">Pages</span>
        {!readOnly && (
          <button
            type="button"
            onClick={() => addPage()}
            aria-label="Add new page"
            title="New page"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)] hover:[filter:drop-shadow(0_0_6px_var(--color-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <Plus size={14} />
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Collapse pages panel"
            className={`${readOnly ? 'ml-auto' : ''} inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)] hover:[filter:drop-shadow(0_0_6px_var(--color-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]`}
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar overflow-x-hidden">
          {sectionEntries.map(([groupName, pages]) => (
            <SectionGroup
              key={groupName}
              groupName={groupName}
              pages={pages}
              currentPageIndex={currentPageIndex}
              goToPage={goToPage}
              updatePage={updatePage}
              deletePage={deletePage}
              movePage={movePage}
              addPage={addPage}
              totalPages={lesson.pages.length}
              readOnly={readOnly}
              showHeader={showSectionGroups}
            />
          ))}

          {!readOnly && (
            <button
              type="button"
              onClick={createSection}
              className="mt-3 flex min-h-9 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:[filter:drop-shadow(0_0_6px_var(--color-primary))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            >
              <FolderPlus size={13} /> New section
            </button>
          )}
        </div>
      </DndContext>
    </div>
  );
};

export const Sidebar = ({ initialCollapsed = true, toggleInteractive = false }) => {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

  useEffect(() => {
    const timer = setTimeout(() => setIsCollapsed(initialCollapsed), 100);
    return () => clearTimeout(timer);
  }, [initialCollapsed]);

  return (
    <div className="relative h-full flex flex-col shrink-0 z-20">
      <div
        className={`h-full bg-[var(--color-background)] border-r border-[var(--color-border)] transition-all duration-200 ease-out overflow-hidden ${
          isCollapsed ? 'w-0 border-none' : 'w-56'
        }`}
      >
        <EditorSidebarContent />
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? 'Open pages sidebar' : 'Close pages sidebar'}
        className={`absolute top-2 z-50 rounded-md bg-[var(--color-background)] p-1 text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-foreground)] active:scale-95 ${toggleInteractive ? 'pointer-events-auto' : ''}`}
        style={{ right: '-16px' }}
      >
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </button>
    </div>
  );
};
