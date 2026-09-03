import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  ArrowRight,
  BookOpen,
  CheckCircle,
  FileText,
  Info,
  Layers3,
  Loader,
  PlayCircle,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ExploreCourses = () => {
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => { fetchMarketplace(); }, []);

  const fetchMarketplace = async () => {
    try {
      const [res, lessonRes] = await Promise.all([
        api.get('/api/courses/'),
        api.get('/api/lessons/', { params: { standalone: true } }),
      ]);
      setCourses((Array.isArray(res.data) ? res.data : []).filter((course) => !course.is_owner));
      setLessons((Array.isArray(lessonRes.data) ? lessonRes.data : []).filter((lesson) => !lesson.is_owner));
    } catch (err) {
      console.error("Failed to load discovery", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickEnroll = async (courseId) => {
    const course = courses.find((item) => item.id === courseId);
    const firstLessonId = course?.lessons?.[0]?.id;
    if (!user) {
      if (firstLessonId) navigate(`/learn/${firstLessonId}`);
      else navigate(`/course/${courseId}`);
      return;
    }

    setEnrollingId(courseId);
    try {
      await api.post(`/api/courses/${courseId}/enroll/`);
      setCourses(courses.map(c => c.id === courseId ? { ...c, is_enrolled: true } : c));
    } catch (err) {
      if (err.response?.data?.status === 'already_owned') {
        setCourses(courses.map(c => c.id === courseId ? { ...c, is_enrolled: true } : c));
      } else {
        alert("Enrollment failed.");
      }
    } finally {
      setEnrollingId(null);
    }
  };

  const handleQuickLessonAccess = async (lesson) => {
    if (!user) {
      navigate(`/learn/${lesson.id}`);
      return;
    }

    setEnrollingId(lesson.id);
    try {
      await api.post(`/api/lessons/${lesson.id}/purchase/`);
      setLessons(lessons.map(l => l.id === lesson.id ? { ...l, is_purchased: true, can_view_content: true } : l));
      navigate(`/learn/${lesson.id}`);
    } catch {
      alert("Lesson access failed.");
    } finally {
      setEnrollingId(null);
    }
  };

  const totalItems = courses.length + lessons.length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-[var(--color-muted-foreground)]">
        <Loader className="mr-2 animate-spin" size={16} />
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Explore</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {totalItems > 0 ? `${courses.length} courses, ${lessons.length} standalone lessons` : 'No courses to join yet.'}
          </p>
        </div>

        {totalItems === 0 ? (
          <div className="rounded-lg border border-[var(--color-border)] px-6 py-16 text-center">
            <BookOpen size={28} className="mx-auto text-[var(--color-muted-foreground)]" />
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-foreground)]">No published content yet</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-muted-foreground)]">
              Courses from other teachers will appear here when they are available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Courses */}
            {courses.map(course => {
              const firstLessonId = course.lessons?.[0]?.id;
              return (
                <article key={course.id} className="group overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] transition-all hover:border-[var(--color-muted-foreground)]/30 hover:shadow-md">
                  <button className="block h-40 w-full overflow-hidden bg-[var(--color-muted)] text-left transition-colors hover:bg-[var(--color-border)]" onClick={() => navigate(`/course/${course.id}`)}>
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[var(--color-muted-foreground)]">
                        <Layers3 size={28} />
                      </div>
                    )}
                  </button>

                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[11px] font-medium text-indigo-700">Course</span>
                      <span className="text-[11px] font-medium text-emerald-600">Free</span>
                    </div>
                    <h3 className="truncate text-sm font-semibold text-[var(--color-foreground)]" title={course.title}>{course.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                      {course.description || "A structured lesson path with interactive activities."}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
                      <span>{course.lessons?.length || 0} lessons</span>
                      <span>{course.author_name || 'Instructor'}</span>
                    </div>

                    <div className="mt-3">
                      {course.is_enrolled ? (
                        <button
                          onClick={() => firstLessonId ? navigate(`/learn/${firstLessonId}`) : navigate(`/course/${course.id}`)}
                          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          <CheckCircle size={14} /> Continue
                        </button>
                      ) : (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <button
                            onClick={() => navigate(`/course/${course.id}`)}
                            className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 text-[13px] font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                          >
                            <Info size={13} /> Details
                          </button>
                          <button
                            onClick={() => handleQuickEnroll(course.id)}
                            disabled={enrollingId === course.id}
                            className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-foreground)] px-2 text-[13px] font-medium text-[var(--color-background)] transition-colors hover:opacity-90 disabled:opacity-60"
                          >
                            {enrollingId === course.id ? <Loader size={13} className="animate-spin" /> : <Zap size={13} />}
                            Enroll
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}

            {/* Standalone lessons */}
            {lessons.map(lesson => (
              <article key={lesson.id} className="group overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] transition-all hover:border-[var(--color-muted-foreground)]/30 hover:shadow-md">
                <button className="flex h-40 w-full items-center justify-center bg-amber-50 text-amber-600" onClick={() => navigate(`/lesson/${lesson.id}`)}>
                  <FileText size={28} />
                </button>

                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700">Lesson</span>
                    <span className="text-[11px] font-medium text-emerald-600">Free</span>
                  </div>
                  <h3 className="truncate text-sm font-semibold text-[var(--color-foreground)]" title={lesson.title}>{lesson.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[var(--color-muted-foreground)]">
                    {lesson.description || "A standalone interactive lesson."}
                  </p>
                  <div className="mt-3 text-xs text-[var(--color-muted-foreground)]">Standalone</div>

                  <div className="mt-3">
                    {lesson.can_view_content ? (
                      <button
                        onClick={() => navigate(`/learn/${lesson.id}`)}
                        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 text-[13px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <PlayCircle size={14} /> Open
                      </button>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => navigate(`/lesson/${lesson.id}`)}
                          className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-2 text-[13px] font-medium text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                        >
                          <Info size={13} /> Details
                        </button>
                        <button
                          onClick={() => handleQuickLessonAccess(lesson)}
                          disabled={enrollingId === lesson.id}
                          className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-foreground)] px-2 text-[13px] font-medium text-[var(--color-background)] transition-colors hover:opacity-90 disabled:opacity-60"
                        >
                          {enrollingId === lesson.id ? <Loader size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                          Start
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
