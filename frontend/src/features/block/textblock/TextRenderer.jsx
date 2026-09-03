import React from 'react';
import DOMPurify from 'dompurify';

const classFor = (type) => ({ h1: 'mb-3 text-3xl font-semibold tracking-tight', h2: 'mb-3 text-2xl font-semibold', h3: 'mb-2 text-xl font-semibold' }[type] || 'mb-3 text-base leading-7');

export const TextRenderer = ({ block, showEmptyPrompt = false }) => {
  const html = block.content?.html || '';
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (!text && showEmptyPrompt) return <p className={classFor(block.type) + ' text-[var(--color-muted-foreground)]'}>{block.type === 'h1' ? 'Page title' : 'Start writing'}</p>;
  return <div className={classFor(block.type) + ' text-[var(--color-foreground)]'} style={{ textAlign: block.content?.textAlign || 'left', color: block.content?.textColor || undefined }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
};
