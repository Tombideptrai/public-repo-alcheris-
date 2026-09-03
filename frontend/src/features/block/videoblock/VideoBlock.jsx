import React from 'react';

const youtubeEmbed = (url) => {
  const match = String(url || '').match(/(?:youtu\.be\/|watch\?v=|embed\/)([^?&/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

export const VideoBlock = ({ block }) => {
  const url = block.content?.url || '';
  if (!url) return <div className="rounded-lg border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-muted-foreground)]">Add a video URL in the inspector.</div>;
  const embed = youtubeEmbed(url);
  return <div className="aspect-video overflow-hidden rounded-xl border border-[var(--color-border)] bg-black">{embed ? <iframe title="Lesson video" src={embed} className="h-full w-full" allowFullScreen /> : <video src={url} controls className="h-full w-full" />}</div>;
};
