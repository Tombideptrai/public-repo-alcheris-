import React from 'react';
import { HelpCircle, Image, Type, Video } from 'lucide-react';

const BlockButton = ({ icon, label, onClick }) => (
  <button onClick={onClick} title={`Add ${label}`} className="p-2 rounded-md text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition-colors">
    {icon}
  </button>
);

export const AddBlockToolbar = ({ onAdd, panelType }) => (
  <div className="group relative mt-4 mb-16">
    <div className="flex items-center justify-center gap-2 p-3 border border-dashed border-[var(--color-border)] rounded-lg">
      <span className="text-xs font-medium text-[var(--color-muted-foreground)]">Add basic block</span>
    </div>
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 bg-[var(--color-popover)] rounded-lg transition-all shadow-md border border-[var(--color-border)] z-10 p-2">
      <BlockButton onClick={() => onAdd(panelType, 'text')} icon={<Type size={15} />} label="Text" />
      <BlockButton onClick={() => onAdd(panelType, 'image')} icon={<Image size={15} />} label="Image" />
      <BlockButton onClick={() => onAdd(panelType, 'video')} icon={<Video size={15} />} label="Video" />
      <BlockButton onClick={() => onAdd(panelType, 'quiz')} icon={<HelpCircle size={15} />} label="Practice" />
    </div>
  </div>
);
