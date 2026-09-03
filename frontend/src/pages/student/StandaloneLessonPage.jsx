import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import {
  BookOpen,
  Check,
  CheckCircle,
  Code2,
  Layers3,
  ListChecks,
  Loader,
  MousePointerClick,
  PlayCircle,
  Share2,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const blockLabels = {
  text: 'Reading', video: 'Video', image: 'Visual', pdf: 'PDF', embed: 'Embed',
  quiz: 'Quiz', cloze: 'Practice check', sequence: 'Ordering task', flashcard: 'Flashcards',
  code: 'Code note', snippet: 'Code snippet', coding: 'Code lab', 'data-lab': 'Data lab',
  essay: 'Essay', checkpoint: 'Checkpoint', illustration: 'Illustration',
};

const interactiveTypes = new Set(['quiz', 'cloze', 'sequence', 'flashcard', 'checkpoint', 'essay']);
const codingTypes = new Set(['code', 'snippet', 'coding', 'data-lab']);
const getLessonBlocks = (lesson) => (lesson.pages || []).flatMap((page) => page.blocks || []);

export const StandaloneLessonPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessing, setAccessing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchLesson = useCallback(async () => {
    try {
      const res = await api.get(`/api/lessons/${id}/`);
      setLesson(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  const handleAccess = async () => {
    if (!user) {
      navigate(`/learn/${id}`);
      return;
    }

    setAccessing(true);
    try {
      await api.post(`/api/lessons/${id}/purchase/`);
      await fetchLesson();
    } catch {
      alert('Unable to access lesson');
    } finally {
      setAccessing(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: lesson.title, text: lesson.description, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      setCopied(false);
    }
  };

  const summary = useMemo(() => {
    if (!lesson) return null;
    const pages = lesson.pages || [];
    const blocks = getLessonBlocks(lesson);
    const fallbackTypes = lesson.content_types || [];
    const types = blocks.length ? blocks.map((b) => b.type) : fallbackTypes;
    const contentCounts = types.reduce((acc, t) => { acc[t] = (acc[t] || 0) + 1; return acc; }, {});
    return {
      pages,
      totalPages: pages.length || (types.length ? 1 : 0),
      totalBlocks: blocks.length || types.length,
      interactiveCount: types.filter((t) => interactiveTypes.has(t)).length,
      codingCount: types.filter((t) => codingTypes.has(t)).length,
      contentCounts,
    };
  }, [lesson]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader className="animate-spin text-[var(--color-muted-foreground)]" size={18} /></div>;
  if (!lesson) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--color-muted-foreground)]">Lesson not found</div>;

  const topContent = Object.entries(summary.contentCounts).slice(0, 4);

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Hero */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <div className="mb-3 inline-flex items-center gap-1.5 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              Standalone lesson
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)] sm:text-4xl">{lesson.title}</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--color-muted-foreground)]">
              {lesson.description || 'A focused interactive lesson that opens directly in the student player.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1.5">
                <UserRound size={13} /> {lesson.author_name || 'Instructor'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1.5">
                <BookOpen size={13} /> {summary.totalPages || 1} page{summary.totalPages === 1 ? '' : 's'}
              </span>
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 transition-colors hover:bg-[var(--color-muted)]"
              >
                {copied ? <Check size={13} /> : <Share2 size={13} />}
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>

          {/* Access card */}
          <div className="rounded-lg border border-[var(--color-border)] p-5">
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Access</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">Free</p>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {user
                ? 'Open the player, move page by page, and complete the interactive blocks.'
                : 'Preview the lesson now. Sign in when you interact or continue.'}
            </p>
            {lesson.can_view_content ? (
              <button
                onClick={() => navigate(`/learn/${lesson.id}`)}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-foreground)] py-2.5 text-sm font-medium text-[var(--color-background)] transition-colors hover:opacity-90"
              >
                <PlayCircle size={15} /> Start lesson
              </button>
            ) : (
              <button
                onClick={handleAccess}
                disabled={accessing}
                className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-foreground)] py-2.5 text-sm font-medium text-[var(--color-background)] transition-colors hover:opacity-90 disabled:opacity-60"
              >
                {accessing ? <Loader className="animate-spin" size={15} /> : <PlayCircle size={15} />}
                {user ? 'Get access' : 'Preview lesson'}
              </button>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
          <div className="rounded-lg border border-[var(--color-border)] p-5">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Lesson overview</h2>

            {/* Quick stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { icon: BookOpen, label: 'Pages', value: summary.totalPages || 1 },
                { icon: MousePointerClick, label: 'Interactive', value: summary.interactiveCount },
                { icon: Code2, label: 'Code labs', value: summary.codingCount },
              ].map((s) => (
                <div key={s.label} className="rounded-lg bg-[var(--color-muted)] p-3">
                  <s.icon size={15} className="text-[var(--color-muted-foreground)]" />
                  <p className="mt-2 text-xl font-semibold text-[var(--color-foreground)]">{s.value}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Learning flow */}
            {summary.pages.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-medium text-[var(--color-foreground)]">Learning flow</h3>
                <div className="mt-2 space-y-1.5">
                  {summary.pages.slice(0, 5).map((page, i) => (
                    <div key={page.id} className="flex items-center gap-2.5 rounded-lg bg-[var(--color-muted)] p-2.5 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-indigo-50 text-xs font-semibold text-indigo-600">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-[var(--color-foreground)]">{page.title}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{page.blocks?.length || 0} blocks</p>
                      </div>
                    </div>
                  ))}
                  {summary.pages.length > 5 && (
                    <p className="pl-9 text-xs text-[var(--color-muted-foreground)]">
                      + {summary.pages.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="h-fit rounded-lg border border-[var(--color-border)] p-5">
            <h3 className="text-sm font-medium text-[var(--color-foreground)]">What to expect</h3>
            <div className="mt-3 space-y-2.5">
              {[
                { icon: ListChecks, label: 'Focused player', text: 'No editing controls — just the lesson path.' },
                { icon: Layers3, label: 'Mixed content', text: topContent.length ? topContent.map(([t, c]) => `${c} ${blockLabels[t] || t}`).join(', ') : 'Interactive blocks.' },
                { icon: CheckCircle, label: 'Progress tracking', text: 'Completion feeds lesson insights.' },
              ].map((item) => (
                <div key={item.label} className="flex gap-2.5 rounded-lg bg-[var(--color-muted)] p-2.5">
                  <item.icon size={15} className="mt-0.5 shrink-0 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-foreground)]">{item.label}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
