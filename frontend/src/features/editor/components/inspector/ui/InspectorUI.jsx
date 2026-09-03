import React from 'react';

export const PropertySection = ({ children, title }) => (
  <div className="space-y-2.5">
    {title && <PropertyLabel>{title}</PropertyLabel>}
    <div className="space-y-2.5">{children}</div>
  </div>
);

export const PropertyLabel = ({ children }) => (
  <label className="text-[11px] font-medium text-[var(--color-muted-foreground)] block">
    {children}
  </label>
);

export const PropertyRow = ({ children, label }) => (
  <div className="space-y-1">
    {label && <span className="text-xs font-medium text-[var(--color-foreground)]">{label}</span>}
    <div className="flex gap-2 items-center">{children}</div>
  </div>
);

export const InspectorInput = (props) => (
  <input
    {...props}
    className={`w-full px-2.5 py-1.5 text-sm border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] rounded-md outline-none focus:border-[var(--color-primary)]/50 transition-colors placeholder:text-[var(--color-muted-foreground)] ${props.className || ''}`}
  />
);

export const InspectorSelect = ({ options, ...props }) => (
  <select
    {...props}
    className="w-full px-2.5 py-1.5 text-sm border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] rounded-md outline-none focus:border-[var(--color-primary)]/50 transition-colors"
  >
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export const InspectorTextArea = (props) => (
  <textarea
    {...props}
    className={`w-full px-2.5 py-1.5 text-sm border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] rounded-md outline-none focus:border-[var(--color-primary)]/50 transition-colors placeholder:text-[var(--color-muted-foreground)] resize-none ${props.className || ''}`}
  />
);

export const IconButton = ({ icon, active, onClick, title }) => (
  <button
    onClick={onClick}
    title={title}
    className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
      active
        ? 'bg-[var(--color-muted)] text-[var(--color-foreground)]'
        : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:[filter:drop-shadow(0_0_6px_var(--color-primary))]'
    }`}
  >
    {icon}
  </button>
);

export const CommonLayoutControls = ({ block, updateBlockContent }) => {
  const content = block.content || {};
  const update = (patch) => updateBlockContent(block.id, patch);

  return (
    <PropertySection title="Layout">
      <PropertyRow label="Width">
        <InspectorInput
          value={content.width ?? '100%'}
          onChange={(e) => update({ width: e.target.value })}
          placeholder="100%"
        />
      </PropertyRow>
      <PropertyRow label="Alignment">
        <InspectorSelect
          value={content.align ?? 'center'}
          onChange={(e) => update({ align: e.target.value })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Center' },
            { value: 'right', label: 'Right' },
          ]}
        />
      </PropertyRow>
      <div className="grid grid-cols-2 gap-2">
        <PropertyRow label="Padding">
          <InspectorInput
            type="number"
            min="0"
            value={content.padding ?? 0}
            onChange={(e) => update({ padding: Number(e.target.value) })}
          />
        </PropertyRow>
        <PropertyRow label="Margin">
          <InspectorInput
            type="number"
            min="0"
            value={content.margin ?? 0}
            onChange={(e) => update({ margin: Number(e.target.value) })}
          />
        </PropertyRow>
      </div>
    </PropertySection>
  );
};
