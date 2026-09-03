import React from 'react';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { useLessonStore } from '../../../../store/useLessonStore';
import { CanvasPanel } from '../canvas/CanvasPanel';
import { Inspector } from '../inspector/Inspector';
import { EditorSidebarContent } from '../SideBar';

export const EditorWorkspace = ({ blockEditable = true, previewMode = false }) => {
  const lesson = useLessonStore((state) => state.lesson);
  const reorderBlocks = useLessonStore((state) => state.reorderBlocks);
  const isInspectorOpen = useLessonStore((state) => state.isInspectorOpen);
  const isSidebarOpen = useLessonStore((state) => state.isSidebarOpen);
  const setSidebarOpen = useLessonStore((state) => state.setSidebarOpen);
  const page = lesson.pages[lesson.currentPageIndex];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = ({ active, over }) => {
    if (previewMode || !over || active.id === over.id) return;
    const panel = page.leftPanel.some((block) => block.id === active.id) ? 'leftPanel' : 'rightPanel';
    reorderBlocks(panel, active.id, over.id);
  };

  return <div className="flex flex-1 overflow-hidden">
    <DndContext sensors={previewMode ? [] : sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-12'} shrink-0 overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-background)] transition-[width]`}>
        <EditorSidebarContent onClose={() => setSidebarOpen(false)} readOnly={previewMode} />
      </aside>
      <main className="grid min-w-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
        <CanvasPanel id="leftPanel" title="Content" theme="light" blockEditable={blockEditable && !previewMode} readOnly={previewMode} />
        <CanvasPanel id="rightPanel" title="Practice" theme="light" blockEditable={blockEditable && !previewMode} readOnly={previewMode} />
      </main>
      {isInspectorOpen && !previewMode && <aside className="w-80 shrink-0 overflow-y-auto border-l border-[var(--color-border)]"><Inspector /></aside>}
    </DndContext>
  </div>;
};
