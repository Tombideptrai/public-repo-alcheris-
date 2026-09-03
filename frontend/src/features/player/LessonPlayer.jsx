import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import { getBlockDefaults } from '../../store/blockDefaults';
import { useLessonStore } from '../../store/useLessonStore';
import { BlockRenderer } from '../block/BlockRenderer';
import { RuntimeCanvasPanel } from './RuntimeCanvasPanel';
import { StudentSidebar } from './StudentSidebar';
import AlcherisLoader from '../../components/AlcherisLoader';

const parseBlock = (block) => {
  let content = block.content;
  if (typeof content === 'string') {
    try { content = JSON.parse(content); } catch { content = {}; }
  }
  return { ...block, content: { ...getBlockDefaults(block.type), ...(content || {}) } };
};

const formatLesson = (lesson) => ({
  ...lesson,
  currentPageIndex: 0,
  pages: (lesson.pages || []).map((page) => ({
    ...page,
    leftPanel: (page.blocks || []).filter((block) => block.panel === 'leftPanel').sort((a, b) => a.order - b.order).map(parseBlock),
    rightPanel: (page.blocks || []).filter((block) => block.panel === 'rightPanel').sort((a, b) => a.order - b.order).map(parseBlock),
  })),
});

// This is the lesson-maker runtime stripped to its essential public learning
// experience: pages, the two-panel canvas, basic blocks, and completion.
export const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = useLessonStore((state) => state.lesson);
  const setLesson = useLessonStore((state) => state.setLesson);
  const goToPage = useLessonStore((state) => state.goToPage);
  const resetLesson = useLessonStore((state) => state.resetLesson);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      resetLesson();
      setLoading(true);
      try {
        const response = await api.get(`/api/lessons/${lessonId}/`);
        if (!active) return;
        const formatted = formatLesson(response.data);
        setLesson(formatted);
        setCompleted(Boolean(response.data.is_completed));
      } catch (requestError) {
        if (active) setError(requestError.response?.status === 404 ? 'This lesson is not available.' : 'The lesson could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [lessonId, resetLesson, setLesson]);

  const activePage = lesson.pages?.[lesson.currentPageIndex] || null;
  const pageCount = lesson.pages?.length || 0;
  const atLastPage = lesson.currentPageIndex === pageCount - 1;
  const canGoBack = lesson.currentPageIndex > 0;
  const backPath = lesson.course ? `/course/${lesson.course}` : '/explore';
  const progress = pageCount ? Math.round(((lesson.currentPageIndex + 1) / pageCount) * 100) : 0;

  const panels = useMemo(() => ({
    left: activePage?.leftPanel || [],
    right: activePage?.rightPanel || [],
  }), [activePage]);

  const finish = async () => {
    setFinishing(true);
    try {
      await api.post(`/api/lessons/${lessonId}/toggle_complete/`, { is_completed: true });
      setCompleted(true);
    } catch {
      setError('Could not record completion. Please try again.');
    } finally {
      setFinishing(false);
    }
  };

  if (loading) return <AlcherisLoader label="loading lesson" />;
  if (error && !activePage) return <main className="grid min-h-dvh place-items-center p-6 text-center"><div><p className="text-lg font-semibold">{error}</p><button onClick={() => navigate('/explore')} className="mt-4 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm">Back to catalogue</button></div></main>;

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header className="flex h-13 shrink-0 items-center gap-2 border-b border-[var(--color-border)] px-3 sm:px-4">
        <button onClick={() => navigate(backPath)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]" aria-label="Back"><ArrowLeft size={17} /></button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{lesson.title}</p>
          <p className="text-[11px] text-[var(--color-muted-foreground)]">Page {lesson.currentPageIndex + 1} of {pageCount}</p>
        </div>
        <div className="hidden w-28 sm:block"><div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]"><div className="h-full bg-[var(--color-primary)]" style={{ width: `${progress}%` }} /></div></div>
        <button onClick={() => setSidebarOpen((open) => !open)} className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-[var(--color-muted)] md:hidden" aria-label="Open pages">{sidebarOpen ? <X size={17} /> : <Menu size={17} />}</button>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <StudentSidebar isOpen={sidebarOpen} showToggle={false} onToggle={() => setSidebarOpen((open) => !open)} onNavigate={() => setSidebarOpen(false)} />
        <div className="grid min-w-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
          <RuntimeCanvasPanel blocks={panels.left} emptyMessage="No content on this page yet." renderBlock={(block) => <div key={block.id} className="mb-5"><BlockRenderer block={block} /></div>} />
          <RuntimeCanvasPanel blocks={panels.right} emptyMessage="No practice on this page yet." renderBlock={(block) => <div key={block.id} className="mb-5"><BlockRenderer block={block} /></div>} />
        </div>
      </div>

      <footer className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-t border-[var(--color-border)] bg-[var(--color-background)] px-3 sm:px-5">
        <button disabled={!canGoBack} onClick={() => goToPage(lesson.currentPageIndex - 1)} className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] disabled:opacity-35"><ChevronLeft size={16} /> Previous</button>
        {atLastPage ? (
          <button disabled={finishing || completed} onClick={finish} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[var(--color-foreground)] px-3 text-sm font-medium text-[var(--color-background)] disabled:opacity-60">
            <CheckCircle2 size={16} /> {completed ? 'Completed' : finishing ? 'Saving…' : 'Complete lesson'}
          </button>
        ) : (
          <button onClick={() => goToPage(lesson.currentPageIndex + 1)} className="inline-flex min-h-10 items-center gap-1 rounded-md bg-[var(--color-foreground)] px-3 text-sm font-medium text-[var(--color-background)]">Next <ChevronRight size={16} /></button>
        )}
      </footer>
    </main>
  );
};
