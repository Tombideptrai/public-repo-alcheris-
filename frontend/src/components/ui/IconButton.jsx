import React, { forwardRef } from 'react';

const SIZE_CLASSES = {
  sm: 'h-7 w-7 rounded-md',
  md: 'h-9 w-9 rounded-md',
  lg: 'min-h-11 min-w-11 rounded-md',
};

const SIZE_ICON = { sm: 14, md: 16, lg: 18 };

const NEUTRAL_HOVER = 'text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] hover:[filter:drop-shadow(0_0_6px_var(--color-primary))]';

const VARIANT_CLASSES = {
  nav: NEUTRAL_HOVER,
  neutral: NEUTRAL_HOVER,
  danger: 'text-[var(--color-muted-foreground)] hover:text-[var(--color-error)] hover:[filter:drop-shadow(0_0_5px_var(--color-error))]',
  primary: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90',
};

const ACTIVE_CLASSES = {
  nav: 'text-[var(--color-primary)] [filter:drop-shadow(0_0_6px_var(--color-primary))]',
  neutral: 'text-[var(--color-primary)] [filter:drop-shadow(0_0_6px_var(--color-primary))]',
  danger: 'text-[var(--color-error)]',
  primary: '',
};

const BASE =
  'inline-flex items-center justify-center transition-all duration-200 ease-out ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/50 focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-background)] ' +
  'active:scale-95 disabled:opacity-40 disabled:pointer-events-none';

export const IconButton = forwardRef(function IconButton(
  {
    icon: Icon,
    iconSize,
    variant = 'neutral',
    size = 'md',
    active = false,
    label,
    className = '',
    children,
    ...rest
  },
  ref,
) {
  const resolvedIconSize = iconSize ?? SIZE_ICON[size];
  const variantClass = active ? ACTIVE_CLASSES[variant] : VARIANT_CLASSES[variant];
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      title={rest.title ?? label}
      className={`${BASE} ${SIZE_CLASSES[size]} ${variantClass} ${className}`}
      {...rest}
    >
      {Icon ? <Icon size={resolvedIconSize} /> : children}
    </button>
  );
});

export default IconButton;
