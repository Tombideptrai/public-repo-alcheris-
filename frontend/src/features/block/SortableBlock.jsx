import React from 'react';
import { useSortable, defaultAnimateLayoutChanges } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockFactory } from './BlockFactory';
import { BlockRenderer } from './BlockRenderer';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useLessonStore } from '../../store/useLessonStore';

const animateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return false;
};

const TEXT_EDITABLE_BLOCKS = new Set(['text', 'paragraph', 'h1', 'h2', 'h3']);
const SELF_FRAMED_BLOCKS = new Set([]);
const INTERACTIVE_CHILD_SELECTOR = [
  'button',
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[data-no-select]',
  '[data-code-editor]',
  '.monaco-editor',
  '.cm-editor',
].join(', ');

function SortableBlockBase({ block, isSelected, isMultiSelected, isEditing, onClick, onDelete, onEdit, isEditable, readOnly = false }) {
  const usesDirectWysiwyg = block.type === 'quiz';
  const hasEditorSurfaceBorder = !readOnly && !TEXT_EDITABLE_BLOCKS.has(block.type) && !SELF_FRAMED_BLOCKS.has(block.type);
  const insertBlockAfter = useLessonStore((state) => state.insertBlockAfter);
  const setSelectedBlock = useLessonStore((state) => state.setSelectedBlock);
  const toggleBlockSelection = useLessonStore((state) => state.toggleBlockSelection);
  const selectBlockRange = useLessonStore((state) => state.selectBlockRange);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: block.id,
    animateLayoutChanges,
    disabled: readOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : 'auto',
    opacity: isDragging ? 0.4 : 1,
    animation: isDragging ? 'none' : undefined,
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;
    if (!isSelected) return;

    const activeTag = document.activeElement?.tagName;
    const isTyping = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable;

    if ((e.key === 'Backspace' || e.key === 'Delete') && !isTyping && !TEXT_EDITABLE_BLOCKS.has(block.type)) {
      e.preventDefault();
      e.stopPropagation();
      onDelete();
      return;
    }

    if (e.key === 'Enter') {
      if (TEXT_EDITABLE_BLOCKS.has(block.type)) return;
      if (!isTyping || e.metaKey || e.ctrlKey || e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        insertBlockAfter(block.id, 'text');
      }
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (isTyping && activeTag === 'TEXTAREA') return;
      e.preventDefault();

      const state = useLessonStore.getState();
      const pages = state.lesson.pages;
      const pageIndex = state.lesson.currentPageIndex;
      const currentPage = pages[pageIndex];

      if (!currentPage) return;

      const allBlocks = [...(currentPage.leftPanel || []), ...(currentPage.rightPanel || [])];
      const currentIndex = allBlocks.findIndex(b => b.id === block.id);

      let nextIndex = e.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1;

      if (allBlocks[nextIndex]) {
        setSelectedBlock(allBlocks[nextIndex].id);
      }
    }
  };

  const handleBlockMouseDownCapture = (e) => {
    if (readOnly) return;
    if (e.button !== 0) return;

    const interactiveTarget = e.target.closest(INTERACTIVE_CHILD_SELECTOR);
    if (interactiveTarget) return;

    e.currentTarget.closest('[data-block-id]')?.focus({ preventScroll: true });

    if (e.ctrlKey || e.metaKey) return;
    if (e.shiftKey) return;
    if (!isSelected) onClick();
  };

  const bottomSpacing = block.type === 'text' ? 'mb-0' : 'mb-[var(--block-gap-y)]';

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-block-id={block.id}
      tabIndex={readOnly ? undefined : -1}
      className={`relative group/block outline-none ${bottomSpacing}`}
      onKeyDown={!readOnly && isSelected ? handleKeyDown : undefined}
    >
      {/* Keep the rail in the canvas gutter while anchoring it visually to this block. */}
      {!readOnly && <div
        className={`absolute right-full top-0.5 z-30 mr-2 flex items-center gap-0 rounded-md border bg-[var(--color-background)]/95 p-0 shadow-sm transition-[opacity,border-color] duration-150 ${
          isSelected ? 'border-[var(--color-primary)]/30' : 'border-transparent'
        } ${
          isDragging ? 'opacity-0' : isSelected ? 'opacity-100' : 'opacity-0 group-hover/block:opacity-100 focus-within:opacity-100'
        }`}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); insertBlockAfter(block.id, 'text'); }}
          className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          title="Add block below"
          aria-label="Add block below"
        >
          <Plus size={14} />
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex h-5 w-5 touch-none cursor-grab items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] active:cursor-grabbing"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        {isEditable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          className="flex h-5 w-5 items-center justify-center rounded-md text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-error)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            title="Delete block"
            aria-label="Delete block"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>}

      {/* Block content */}
      <div
        onMouseDownCapture={readOnly ? undefined : handleBlockMouseDownCapture}
        onClick={readOnly ? undefined : (e) => {
          const interactiveTarget = e.target.closest(INTERACTIVE_CHILD_SELECTOR);
          if (interactiveTarget) {
            e.stopPropagation();
            return;
          }

          e.stopPropagation();
          e.currentTarget.closest('[data-block-id]')?.focus({ preventScroll: true });
          if (e.ctrlKey || e.metaKey) {
            toggleBlockSelection(block.id);
          } else if (e.shiftKey) {
            selectBlockRange(block.id);
          } else {
            onClick();
          }
        }}
        className={`relative rounded-xl transition-colors duration-200 ${
          !readOnly && isMultiSelected
            ? 'ring-1 ring-[var(--color-primary)]/40 bg-[var(--color-primary)]/5'
            : !readOnly && !isSelected && block.type !== 'text' ? 'hover:bg-[var(--color-muted)]/50' : ''
        } ${hasEditorSurfaceBorder ? 'overflow-hidden border border-[var(--color-border)]' : ''}`}
      >
        {isEditable && usesDirectWysiwyg ? (
          <BlockFactory block={block} isEditable={isEditing} isSelected={isSelected} />
        ) : (!isEditable || isEditing) ? (
          <BlockFactory block={block} isEditable={isEditable} isSelected={isSelected} />
        ) : (
          <BlockRenderer block={block} showEmptyPrompt={false} />
        )}
      </div>
    </div>
  );
}

function arePropsEqual(prev, next) {
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isMultiSelected !== next.isMultiSelected) return false;
  if (prev.isEditing !== next.isEditing) return false;
  if (prev.isEditable !== next.isEditable) return false;
  if (prev.readOnly !== next.readOnly) return false;
  if (prev.block.id !== next.block.id) return false;
  if (prev.block.content === next.block.content) return true;
  return false;
}

export const SortableBlock = React.memo(SortableBlockBase, arePropsEqual);
