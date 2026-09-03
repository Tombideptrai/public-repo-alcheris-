import React from 'react';
import { ArrowLeft, Eye, Save } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useLessonStore } from '../../store/useLessonStore';
import { useLessonData } from './hooks/useLessonData';
import { PageBar } from './components/PageBar';
import { EditorWorkspace } from './components/layout/EditorWorkspace';
import AlcherisLoader from '../../components/AlcherisLoader';

export const LessonEditor = () => {
  const { lessonId } = useParams();
  const { loading, loadError, saving, autoSaving, hasUnsavedChanges, saveFailed, handleSave } = useLessonData(lessonId);
  const lesson = useLessonStore((state) => state.lesson);
  const setLesson = useLessonStore((state) => state.setLesson);
  const preview = useLessonStore((state) => state.isPreviewMode);
  const togglePreview = useLessonStore((state) => state.togglePreview);

  if (loading) return <AlcherisLoader />;
  if (loadError) return <main className="p-10 text-center"><h1 className="text-xl font-semibold">Lesson unavailable</h1><p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{loadError.message}</p></main>;

  return <div className="flex h-dvh flex-col bg-[var(--color-background)] text-[var(--color-foreground)]">
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[var(--color-border)] px-3">
      <Link to={lesson.course ? `/teacher/course/${lesson.course}` : '/teacher'} className="rounded p-2 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"><ArrowLeft size={16} /></Link>
      <input value={lesson.title || ''} onChange={(event) => setLesson({ ...lesson, title: event.target.value })} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" aria-label="Lesson title" />
      <PageBar />
      <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline">{saveFailed ? 'Save failed' : saving || autoSaving ? 'Saving…' : hasUnsavedChanges ? 'Unsaved' : 'Saved'}</span>
      <button onClick={() => handleSave(false)} className="inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs hover:bg-[var(--color-muted)]"><Save size={14} /> Save</button>
      <button onClick={togglePreview} className={`inline-flex items-center gap-1 rounded px-2 py-1.5 text-xs ${preview ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'hover:bg-[var(--color-muted)]'}`}><Eye size={14} /> {preview ? 'Edit' : 'Preview'}</button>
    </header>
    <EditorWorkspace blockEditable={!preview} previewMode={preview} />
  </div>;
};
