import React from 'react';

export const ImageRenderer = ({ block }) => {
  const { url, caption, altText } = block.content || {};
  if (!url) return <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">Add an image URL in the inspector.</div>;
  return <figure><img src={url} alt={altText || ''} className="w-full rounded-xl border border-[var(--color-border)] object-cover" />{caption && <figcaption className="mt-2 text-center text-sm text-[var(--color-muted-foreground)]">{caption}</figcaption>}</figure>;
};
