import React from 'react';
import { Trash2, X } from 'lucide-react';
import { useLessonStore } from '../../../../store/useLessonStore';
import { getInspector } from './InspectorRegistry';

export const Inspector = () => {
  const block = useLessonStore((state) => {
    const page = state.lesson.pages[state.lesson.currentPageIndex];
    return page && state.selectedBlockId ? [...page.leftPanel, ...page.rightPanel].find((item) => item.id === state.selectedBlockId) : null;
  });
  const updateBlockContent = useLessonStore((state) => state.updateBlockContent);
  const deleteBlock = useLessonStore((state) => state.deleteBlock);
  const toggleInspector = useLessonStore((state) => state.toggleInspector);
  if (!block) return <div className="p-6 text-sm text-[var(--color-muted-foreground)]">Select a basic block to edit its settings.</div>;
  const BlockInspector = getInspector(block.type);
  return <div className="flex h-full flex-col bg-[var(--color-background)]"><header className="flex h-12 items-center justify-between border-b border-[var(--color-border)] px-3"><div className="flex items-center gap-2"><button onClick={toggleInspector} className="rounded p-1 hover:bg-[var(--color-muted)]"><X size={15} /></button><span className="text-sm font-medium capitalize">{block.type === 'paragraph' ? 'Text' : block.type}</span></div><button onClick={() => deleteBlock(block.id)} className="rounded p-1.5 text-rose-700 hover:bg-rose-50" aria-label="Delete block"><Trash2 size={15} /></button></header><div className="flex-1 overflow-y-auto p-4"><BlockInspector block={block} updateBlockContent={updateBlockContent} /></div></div>;
};
