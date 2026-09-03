import React from 'react';

const AlcherisLoader = ({ label = 'loading' }) => <div className="grid min-h-[50vh] place-items-center text-sm text-[var(--color-muted-foreground)]"><span className="inline-flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />{label}</span></div>;
export default AlcherisLoader;
