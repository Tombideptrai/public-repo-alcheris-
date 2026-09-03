import React from 'react';
import { HelpCircle, Image, Type, Video } from 'lucide-react';

const tools = [
  ['text', 'Text', Type], ['image', 'Image', Image], ['video', 'Video', Video], ['quiz', 'Practice', HelpCircle],
];

export const BottomToolbar = ({ onAddBlock }) => (
  <div className="sticky bottom-3 z-20 mt-5 flex justify-center">
    <div className="flex items-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1.5 shadow-lg">
      {tools.map(([type, label, Icon]) => <button key={type} type="button" onClick={() => onAddBlock(type)} title={`Add ${label}`} className="flex min-h-10 min-w-12 flex-col items-center justify-center rounded-lg px-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-indigo-600"><Icon size={16} /><span className="mt-0.5 text-[10px] font-medium">{label}</span></button>)}
    </div>
  </div>
);
