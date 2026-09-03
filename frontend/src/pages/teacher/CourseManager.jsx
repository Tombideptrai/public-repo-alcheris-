import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Eye, FilePlus2, Loader, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';

export const CourseManager = ({ courseId: explicitCourseId }) => {
  const { id } = useParams();
  const courseId = explicitCourseId || id;
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [courseResponse, lessonsResponse] = await Promise.all([api.get(`/api/courses/${courseId}/`), api.get('/api/lessons/', { params: { course: courseId } })]);
      setCourse(courseResponse.data); setLessons(lessonsResponse.data);
    } finally { setLoading(false); }
  }, [courseId]);
  useEffect(() => { load(); }, [load]);

  const saveCourse = async () => {
    setSaving(true);
    try { const response = await api.patch(`/api/courses/${courseId}/`, { title: course.title, description: course.description }); setCourse(response.data); } finally { setSaving(false); }
  };
  const togglePublish = async () => {
    const response = await api.patch(`/api/courses/${courseId}/`, { is_published: !course.is_published, visibility: 'public' });
    setCourse(response.data);
  };
  const addLesson = async () => {
    setAdding(true);
    try { const response = await api.post('/api/lessons/', { course: courseId, title: 'Untitled lesson', description: '', module_name: 'Module 1', order: lessons.length }); navigate(`/teacher/editor/${response.data.id}`); } finally { setAdding(false); }
  };
  const deleteLesson = async (lesson) => {
    if (!window.confirm(`Delete “${lesson.title}”?`)) return;
    await api.delete(`/api/lessons/${lesson.id}/`); setLessons((current) => current.filter((item) => item.id !== lesson.id));
  };
  const deleteCourse = async () => {
    if (!window.confirm(`Delete “${course.title}” and all its lessons?`)) return;
    await api.delete(`/api/courses/${courseId}/`); navigate('/teacher');
  };

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><Loader className="animate-spin" size={20} /></div>;
  if (!course) return <div className="p-8 text-center text-sm">Course not found.</div>;
  return <main className="min-h-screen bg-[var(--color-background)] px-4 py-7 sm:px-8"><div className="mx-auto max-w-4xl">
    <Link to="/teacher" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted-foreground)] hover:text-indigo-700"><ArrowLeft size={14} /> Dashboard</Link>
    <section className="mt-5 rounded-xl border border-[var(--color-border)] p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0 flex-1"><input value={course.title} onChange={(event) => setCourse({ ...course, title: event.target.value })} className="w-full bg-transparent text-xl font-bold outline-none" aria-label="Course title" /><textarea value={course.description || ''} onChange={(event) => setCourse({ ...course, description: event.target.value })} placeholder="Describe this course" className="mt-3 min-h-20 w-full resize-none bg-transparent text-sm text-[var(--color-muted-foreground)] outline-none" /></div><span className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${course.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{course.is_published ? 'Live' : 'Draft'}</span></div><div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--color-border)] pt-4"><button onClick={saveCourse} disabled={saving} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-[var(--color-foreground)] px-3 text-sm font-medium text-[var(--color-background)]"><Save size={15} />{saving ? 'Saving…' : 'Save details'}</button><button onClick={togglePublish} className="inline-flex min-h-10 items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 text-sm"><Eye size={15} />{course.is_published ? 'Unpublish' : 'Publish'}</button><button onClick={deleteCourse} className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-md px-2 text-sm text-rose-700 hover:bg-rose-50"><Trash2 size={15} />Delete</button></div></section>
    <section className="mt-8"><div className="flex items-center justify-between"><div><h2 className="text-base font-semibold">Lessons</h2><p className="mt-1 text-sm text-[var(--color-muted-foreground)]">Open a lesson to use the page editor and two-panel canvas.</p></div><button onClick={addLesson} disabled={adding} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-indigo-600 px-3 text-sm font-medium text-white"><Plus size={16} />{adding ? 'Creating…' : 'Add lesson'}</button></div><div className="mt-4 divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]">{lessons.map((lesson) => <div key={lesson.id} className="flex items-center gap-3 p-4"><FilePlus2 size={18} className="shrink-0 text-indigo-600" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{lesson.title}</p><p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{lesson.module_name || 'Module 1'} · {lesson.is_published ? 'Published' : 'Draft'}</p></div><button onClick={() => navigate(`/teacher/editor/${lesson.id}`)} className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--color-border)] px-2 text-xs"><Pencil size={13} />Edit</button><button onClick={() => deleteLesson(lesson)} className="inline-flex h-9 w-9 items-center justify-center rounded-md text-rose-700 hover:bg-rose-50" aria-label="Delete lesson"><Trash2 size={15} /></button></div>)}{!lessons.length && <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">Add your first lesson to begin.</div>}</div></section>
  </div></main>;
};
