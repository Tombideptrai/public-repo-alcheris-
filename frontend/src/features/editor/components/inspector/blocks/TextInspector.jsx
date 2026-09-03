import React from 'react';
import { AlignCenter, AlignLeft, AlignRight, Minus, Plus, Type } from 'lucide-react';
import { useLessonStore } from '../../../../../store/useLessonStore';

export const TextInspector = ({ block }) => {
  const updateBlockContent = useLessonStore((state) => state.updateBlockContent);
  const content = block.content || {};
  const fontSize = Number.parseInt(content.fontSize || '16', 10) || 16;
  const update = (key, value) => updateBlockContent(block.id, { [key]: value });

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase text-[var(--color-muted-foreground)]"><Type size={13} /> Typography</p>
        <label className="block text-xs text-[var(--color-muted-foreground)]">Font size</label>
        <div className="flex items-center rounded-md border border-[var(--color-border)]">
          <button type="button" aria-label="Decrease font size" onClick={() => update('fontSize', `${Math.max(12, fontSize - 1)}px`)} className="p-2"><Minus size={14} /></button>
          <input aria-label="Font size" type="number" min="12" max="64" value={fontSize} onChange={(event) => update('fontSize', `${event.target.value || 16}px`)} className="w-full bg-transparent py-1 text-center text-sm outline-none" />
          <button type="button" aria-label="Increase font size" onClick={() => update('fontSize', `${Math.min(64, fontSize + 1)}px`)} className="p-2"><Plus size={14} /></button>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase text-[var(--color-muted-foreground)]">Alignment</p>
        <div className="flex gap-1">
          {[['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]].map(([value, Icon]) => (
            <button key={value} type="button" aria-label={`Align ${value}`} onClick={() => update('textAlign', value)} className={`rounded-md border p-2 ${content.textAlign === value ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-[var(--color-border)]'}`}><Icon size={15} /></button>
          ))}
        </div>
      </div>
    </div>
  );
};
