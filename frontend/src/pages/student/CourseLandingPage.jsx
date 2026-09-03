import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  CheckSquare,
  Clock,
  FileText,
  HelpCircle,
  Layers3,
  Loader,
  Lock,
  PlayCircle,
  Square,
  UserRound,
  Video,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../store/useToastStore';
import { getDefaultTheme } from '../../lib/courseTheme';

export const CourseLandingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const homePath = user?.role === 'teacher' ? '/teacher' : user ? '/student' : '/';
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => { fetchCourse(); }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/api/courses/${id}/`);
      setCourse(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      if (firstPreviewLessonId) {
        navigate(`/learn/${firstPreviewLessonId}`);
      } else {
        navigate('/signup', { state: { from: `/course/${id}`, intent: 'course_access' } });
      }
      return;
    }

    setEnrolling(true);
    try {
      await api.post(`/api/courses/${id}/enroll/`);
      fetchCourse();
    } catch {
      alert("Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  const toggleLesson = async (lessonId) => {
    try {
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map(l => l.id === lessonId ? { ...l, is_completed: !l.is_completed } : l)
      }));
      await api.post(`/api/lessons/${lessonId}/toggle_complete/`);
    } catch {
      fetchCourse();
    }
  };

  const modules = useMemo(() => {
    if (!course?.lessons) return {};
    return course.lessons.reduce((acc, lesson) => {
      const mod = lesson.module_name || "Core lessons";
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(lesson);
      return acc;
    }, {});
  }, [course]);

  const completedCount = course?.lessons?.filter(l => l.is_completed).length || 0;
  const lessonCount = course?.lessons?.length || 0;
  const previewLessons = course?.lessons?.filter(l => l.is_free_preview && l.can_view_content) || [];
  const firstPreviewLessonId = previewLessons[0]?.id;
  const firstLessonId = (course?.lessons?.find(l => !l.is_locked && !l.is_completed) || course?.lessons?.find(l => !l.is_locked) || course?.lessons?.[0])?.id;
  const progressPercent = lessonCount ? Math.round((completedCount / lessonCount) * 100) : 0;
  const theme = { ...getDefaultTheme(), ...(course?.theme || {}) };
  const landing = course?.landing_page || {};
  const instructor = course?.author_profile || {};
  const instructorName = instructor.display_name || course?.author_name || 'Instructor';
  const heroTitle = landing.heroTitle || course?.title;
  const heroSubtitle = landing.heroSubtitle || course?.description || 'A structured path of focused, interactive lessons.';
  const outcomes = landing.outcomes?.length ? landing.outcomes : course?.lessons?.slice(0, 6).map((lesson) => lesson.title) || [];
  const faq = landing.faq || [];
  const themeStyle = {
    '--course-primary': theme.primaryColor,
    '--course-accent': theme.accentColor,
    '--course-bg': theme.bgColor,
    '--course-text': theme.textColor,
    '--color-background': theme.bgColor,
    '--color-foreground': theme.textColor,
    '--color-muted': `${theme.primaryColor}12`,
    '--color-muted-foreground': `${theme.textColor}b3`,
    '--color-border': `${theme.primaryColor}30`,
    '--course-radius': `${theme.borderRadius}px`,
    fontFamily: theme.fontFamily,
    background: theme.bgColor,
    color: theme.textColor,
  };

  const badgeMap = {
    video: { label: 'Video', icon: Video },
    quiz: { label: 'Quiz', icon: HelpCircle },
    text: { label: 'Article', icon: FileText },
    code: { label: 'Exercise', icon: FileText },
  };

  const renderContentBadges = (types) => {
    if (!types?.length) return null;
    return (
      <div className="mt-1.5 flex flex-wrap gap-1">
        {types.map(t => {
          const conf = badgeMap[t] || { label: t, icon: FileText };
          const Icon = conf.icon;
          return (
            <span key={t} className="inline-flex items-center gap-1 rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted-foreground)]">
              <Icon size={9} /> {conf.label}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center"><Loader className="animate-spin text-[var(--color-muted-foreground)]" size={18} /></div>;
  }
  if (!course) {
    return <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--color-muted-foreground)]">Course not found</div>;
  }

  // --- Enrolled view ---
  if (course.is_enrolled) {
    return (
      <div className="min-h-screen bg-[var(--color-background)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <button
            type="button"
            onClick={() => navigate(homePath)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)] hover:[filter:drop-shadow(0_0_6px_var(--color-primary))]"
          >
            <ArrowLeft size={13} /> Back to {user?.role === 'teacher' ? 'dashboard' : user ? 'home' : 'explore'}
          </button>
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CheckCircle size={11} /> Enrolled
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{course.title}</h1>
              <p className="mt-1 max-w-xl text-sm text-[var(--color-muted-foreground)]">
                {course.description || "Continue through the course curriculum."}
              </p>
              <button
                type="button"
                onClick={() => instructor.username && navigate(`/teachers/${instructor.username}`)}
                className="mt-3 inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              >
                {instructor.avatar ? <img src={instructor.avatar} alt="" className="h-5 w-5 rounded-full object-cover" /> : <UserRound size={14} />}
                Created by {instructorName}
              </button>
            </div>
            <div className="w-full sm:w-56">
              <div className="rounded-lg border border-[var(--color-border)] p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-muted-foreground)]">Progress</span>
                  <span className="font-semibold text-[var(--color-foreground)]">{progressPercent}%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
                  <div className="h-full rounded-full bg-indigo-600" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="mt-3 flex gap-3 text-xs text-[var(--color-muted-foreground)]">
                  <span>{completedCount} done</span>
                  <span>{lessonCount} total</span>
                </div>
                <button
                  onClick={() => firstLessonId && navigate(`/learn/${firstLessonId}`)}
                  disabled={!firstLessonId}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--color-foreground)] py-2 text-sm font-medium text-[var(--color-background)] transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  <PlayCircle size={15} /> Continue
                </button>
              </div>
            </div>
          </div>

          {/* Lessons by module */}
          <div className="space-y-5">
            {Object.entries(modules).map(([modName, modLessons]) => (
              <section key={modName} className="overflow-hidden rounded-lg border border-[var(--color-border)]">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-muted)] px-4 py-3">
                  <h2 className="text-sm font-semibold text-[var(--color-foreground)]">{modName}</h2>
                  <span className="text-xs text-[var(--color-muted-foreground)]">{modLessons.length} lessons</span>
                </div>
                <div className="divide-y divide-[var(--color-border)]">
                  {modLessons.map((lesson, idx) => {
                    const locked = lesson.is_locked;
                    const blockedBy = lesson.blocked_by || [];
                    const gateMessage = locked && blockedBy.length
                      ? `Complete "${blockedBy[0].title}"${blockedBy.length > 1 ? ` + ${blockedBy.length - 1} more` : ''} first`
                      : 'Locked';
                    const handleClick = () => {
                      if (locked) { toast.info(gateMessage); return; }
                      navigate(`/learn/${lesson.id}`);
                    };
                    return (
                      <div
                        key={lesson.id}
                        onClick={handleClick}
                        className={`group flex items-start gap-3 px-4 py-3 transition-colors ${
                          locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-[var(--color-muted)]'
                        }`}
                        title={locked ? gateMessage : undefined}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); if (!locked) toggleLesson(lesson.id); }}
                          disabled={locked}
                          className={`mt-0.5 shrink-0 transition-colors ${
                            locked ? 'text-[var(--color-muted-foreground)]'
                              : lesson.is_completed ? 'text-emerald-600' : 'text-gray-300 hover:text-indigo-500'
                          }`}
                        >
                          {locked ? <Lock size={16} /> : lesson.is_completed ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <h3 className={`text-sm font-medium ${!locked && 'group-hover:text-indigo-600'} ${lesson.is_completed ? 'text-[var(--color-muted-foreground)] line-through' : 'text-[var(--color-foreground)]'}`}>
                            {idx + 1}. {lesson.title}
                          </h3>
                          {locked
                            ? <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">{gateMessage}</p>
                            : renderContentBadges(lesson.content_types)}
                        </div>
                        {!locked && <PlayCircle size={16} className="mt-0.5 shrink-0 text-[var(--color-muted-foreground)] opacity-0 group-hover:opacity-100" />}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- Pre-enrollment view ---
  const updatedDate = course.created_at ? new Date(course.created_at).toLocaleDateString() : 'recently';

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8" style={themeStyle}>
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          type="button"
          onClick={() => navigate(homePath)}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)] hover:[filter:drop-shadow(0_0_6px_var(--color-primary))]"
        >
          <ArrowLeft size={13} /> Back to {user?.role === 'teacher' ? 'dashboard' : user ? 'home' : 'explore'}
        </button>
        {/* Hero */}
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div
            className="rounded-xl border p-6"
            style={{
              borderColor: `${theme.primaryColor}33`,
              borderRadius: `${theme.borderRadius}px`,
              background: theme.heroStyle === 'gradient'
                ? `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})`
                : theme.heroStyle === 'solid'
                  ? theme.primaryColor
                  : theme.bgColor,
              color: theme.heroStyle === 'image' ? theme.textColor : '#fff',
            }}
          >
            <div className="mb-3 inline-flex items-center gap-1.5 rounded bg-white/15 px-2 py-0.5 text-[11px] font-medium text-current">
              <BookOpen size={11} /> Course
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{heroTitle}</h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed opacity-90">
              {heroSubtitle}
            </p>
            {landing.targetStudent && (
              <p className="mt-4 max-w-xl rounded-lg bg-white/12 px-3 py-2 text-sm font-medium text-current">
                Best for: {landing.targetStudent}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-[var(--color-muted-foreground)]">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-current">
                <UserRound size={13} /> {instructorName}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-current">
                <Layers3 size={13} /> {lessonCount} lessons
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2.5 py-1.5 text-current">
                <Clock size={13} /> Updated {updatedDate}
              </span>
            </div>
          </div>

          {/* Enroll card */}
          <div className="rounded-lg border p-5" style={{ borderColor: `${theme.primaryColor}33`, borderRadius: `${theme.borderRadius}px`, background: theme.bgColor }}>
            <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Access</p>
            <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">Free</p>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              {user
                ? 'Enroll to unlock the student player and track your progress.'
                : previewLessons.length
                  ? `${previewLessons.length} demo lesson${previewLessons.length === 1 ? '' : 's'} available before enrollment.`
                  : 'No public preview lessons are available. Sign up to enroll and open the lessons.'}
            </p>
            <button
              onClick={handleEnroll}
              disabled={enrolling}
              className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-60"
              style={{ background: theme.primaryColor, borderRadius: `${theme.borderRadius}px` }}
            >
              {enrolling ? <Loader className="animate-spin" size={15} /> : <PlayCircle size={15} />}
              {user ? 'Enroll for free' : previewLessons.length ? 'Preview demo lesson' : 'Sign up to access'}
            </button>
          </div>
        </div>

        {/* Lessons preview */}
        <div className="rounded-lg border border-[var(--color-border)] p-5" style={{ borderRadius: `${theme.borderRadius}px` }}>
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">What you'll learn</h2>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {outcomes.map((outcome, index) => (
              <div key={`${outcome}-${index}`} className="flex items-start gap-2.5 rounded-lg bg-[var(--color-muted)] p-3 text-sm text-[var(--color-foreground)]">
                <CheckCircle size={15} className="mt-0.5 shrink-0" style={{ color: theme.primaryColor }} />
                <span>{outcome}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="rounded-lg border border-[var(--color-border)] p-5" style={{ borderRadius: `${theme.borderRadius}px` }}>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Course outline</h2>
            <div className="mt-4 space-y-2">
              {course.lessons.map((lesson, index) => {
                const canPreview = lesson.is_free_preview && lesson.can_view_content;
                const openLesson = () => {
                  if (canPreview) navigate(`/learn/${lesson.id}`);
                  else handleEnroll();
                };
                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={openLesson}
                    className="flex w-full items-start gap-3 rounded-lg bg-[var(--color-muted)] p-3 text-left transition-colors hover:bg-[var(--color-muted-foreground)]/10"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: theme.primaryColor }}>
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-[var(--color-foreground)]">{lesson.title}</span>
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${canPreview ? 'bg-sky-50 text-sky-700' : 'bg-[var(--color-background)] text-[var(--color-muted-foreground)]'}`}>
                          {canPreview ? 'Preview' : 'Locked'}
                        </span>
                      </span>
                      {lesson.description && <span className="mt-0.5 block text-xs text-[var(--color-muted-foreground)]">{lesson.description}</span>}
                    </span>
                    {canPreview ? <PlayCircle size={15} className="mt-0.5 shrink-0 text-sky-600" /> : <Lock size={15} className="mt-0.5 shrink-0 text-[var(--color-muted-foreground)]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <aside className="rounded-lg border border-[var(--color-border)] p-5" style={{ borderRadius: `${theme.borderRadius}px` }}>
            <div className="flex items-center gap-3">
              {instructor.avatar ? (
                <img src={instructor.avatar} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                  <UserRound size={22} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-medium text-[var(--color-muted-foreground)]">Created by</p>
                <h2 className="truncate text-sm font-semibold text-[var(--color-foreground)]">{instructorName}</h2>
              </div>
            </div>
            {instructor.headline && <p className="mt-3 text-sm font-medium text-[var(--color-foreground)]">{instructor.headline}</p>}
            {instructor.bio && <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">{instructor.bio}</p>}
            {instructor.credentials && <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">{instructor.credentials}</p>}
            {instructor.username && (
              <button
                type="button"
                onClick={() => navigate(`/teachers/${instructor.username}`)}
                className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
              >
                View profile <ExternalLink size={13} />
              </button>
            )}
          </aside>
        </div>

        {faq.length > 0 && (
          <div className="rounded-lg border border-[var(--color-border)] p-5" style={{ borderRadius: `${theme.borderRadius}px` }}>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Questions</h2>
            <div className="mt-4 divide-y divide-[var(--color-border)]">
              {faq.map((item, index) => (
                <div key={`${item.question}-${index}`} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">{item.question}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
