import React, { useEffect, useRef } from 'react';
import { useLessonStore } from '../../../store/useLessonStore';
import { TextRenderer } from './TextRenderer';

const tagFor = (type) => ['h1', 'h2', 'h3'].includes(type) ? type : 'div';
const classFor = (type) => ({ h1: 'text-3xl font-semibold tracking-tight', h2: 'text-2xl font-semibold', h3: 'text-xl font-semibold' }[type] || 'text-base leading-7');

// Direct WYSIWYG editing: text stays in-place while the user types and the
// store receives the same HTML on input for the normal lesson autosave path.
export const TextEditor = ({ block, isEditable }) => {
  const updateBlockContent = useLessonStore((state) => state.updateBlockContent);
  const editorRef = useRef(null);
  const tag = tagFor(block.type);
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== (block.content?.html || '')) editorRef.current.innerHTML = block.content?.html || '';
  }, [block.id]);
  if (!isEditable) return <TextRenderer block={block} showEmptyPrompt />;
  const Element = tag;
  return <Element ref={editorRef} contentEditable suppressContentEditableWarning onInput={(event) => updateBlockContent(block.id, { html: event.currentTarget.innerHTML })} className={classFor(block.type) + ' min-h-8 outline-none empty:before:text-[var(--color-muted-foreground)] empty:before:content-[attr(data-placeholder)]'} data-placeholder={block.type === 'h1' ? 'Page title' : 'Start writing'} />;
};
