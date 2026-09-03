import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, PlayCircle, Search } from 'lucide-react';
import api from '../../lib/api';
import AlcherisLoader from '../../components/AlcherisLoader';

export const StudentDashboard = ({ explorePath = '/explore' }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get('/api/dashboard/student_progress/');
        const validData = Array.isArray(res.data) ? res.data : (res.data?.results || []);
        setCourses(validData);
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const stats = useMemo(() => {
    const completed = courses.filter(c => c.progress_percent === 100).length;
    const lessons = courses.reduce((sum, c) => sum + (c.total_lessons || 0), 0);
    return { active: courses.length, completed, lessons };
  }, [courses]);

  if (loading) {
    return <AlcherisLoader label="loading your learning" />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">My learning</h1>
            <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
              {courses.length > 0
                ? `${stats.active} active, ${stats.completed} completed`
                : 'Start by exploring the catalog.'}
            </p>
          </div>
          <Link
            to={explorePath}
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            <Search size={15} /> Explore
          </Link>
        </div>

        {/* Stats */}
        {courses.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              [stats.active, 'In progress'],
              [stats.completed, 'Completed'],
              [stats.lessons, 'Total lessons'],
            ].map(([value, label]) => (
              <div key={label} className="rounded-lg border border-[var(--color-border)] p-4">
                <p className="text-2xl font-semibold text-[var(--color-foreground)]">{value}</p>
                <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {courses.length === 0 ? (
          <div className="rounded-lg border border-[var(--color-border)] px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
              <BookOpen size={22} />
            </div>
            <h3 className="mt-4 text-sm font-semibold text-[var(--color-foreground)]">No lessons in progress</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--color-muted-foreground)]">
              Explore the catalog, enroll in a course, or open a standalone lesson.
            </p>
            <Link
              to={explorePath}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-foreground)] px-3.5 text-sm font-medium text-[var(--color-background)]"
            >
              Browse catalog <ArrowRight size={15} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Link
                key={course.type === 'lesson' ? course.lesson_id : course.course_id}
                to={course.next_lesson_id ? `/learn/${course.next_lesson_id}` : `/course/${course.course_id}`}
                className="group overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] transition-all hover:border-[var(--color-muted-foreground)]/30 hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="relative h-36 overflow-hidden bg-[var(--color-muted)]">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--color-muted-foreground)]">
                      <BookOpen size={28} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/5">
                    <PlayCircle size={36} className="scale-75 text-white opacity-0 drop-shadow-md transition-all group-hover:scale-100 group-hover:opacity-80" />
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="rounded bg-[var(--color-muted)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-muted-foreground)]">
                      {course.type === 'lesson' ? 'Lesson' : 'Course'}
                    </span>
                    {course.progress_percent === 100 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <CheckCircle2 size={12} /> Done
                      </span>
                    )}
                  </div>

                  <h3 className="truncate text-sm font-semibold text-[var(--color-foreground)] group-hover:text-indigo-600">
                    {course.title}
                  </h3>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)]">
                      <span>{course.completed_lessons}/{course.total_lessons} lessons</span>
                      <span className={course.progress_percent === 100 ? 'text-emerald-600' : 'font-medium text-[var(--color-foreground)]'}>
                        {course.progress_percent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
                      <div
                        className={`h-full rounded-full transition-all ${course.progress_percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                        style={{ width: `${course.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
