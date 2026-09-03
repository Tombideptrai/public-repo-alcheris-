import React, { useEffect, useState } from 'react';
import { BookOpen, ChevronRight, FilePlus2, FolderPlus, Loader, Plus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const CreateCard = ({ icon: Icon, title, text, action }) => (
  <button onClick={action} className="flex min-h-40 flex-col items-start rounded-xl border border-dashed border-[var(--color-border)] p-5 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/40">
    <Icon size={20} className="text-indigo-600" />
    <h2 className="mt-4 text-sm font-semibold">{title}</h2>
    <p className="mt-1 text-xs leading-5 text-[var(--color-muted-foreground)]">{text}</p>
  </button>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState('');

  const load = async () => {
    try {
      const [courseResponse, lessonResponse] = await Promise.all([api.get('/api/courses/?mine=true'), api.get('/api/lessons/?mine=true&standalone=true')]);
      setCourses(courseResponse.data);
      setLessons(lessonResponse.data);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const createCourse = async () => {
    setCreating('course');
    try {
      const response = await api.post('/api/courses/', { title: 'Untitled course', description: '' });
      navigate(`/teacher/course/${response.data.id}`);
    } finally { setCreating(''); }
  };
  const createLesson = async () => {
    setCreating('lesson');
    try {
      const response = await api.post('/api/lessons/', { title: 'Untitled lesson', description: '', module_name: 'Standalone' });
      navigate(`/teacher/editor/${response.data.id}`);
    } finally { setCreating(''); }
  };

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><Loader className="animate-spin" size={20} /></div>;
  return <main className="min-h-screen bg-[var(--color-background)] px-4 py-7 sm:px-8"><div className="mx-auto max-w-6xl">
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Teacher workspace</p><h1 className="mt-1 text-2xl font-bold">Your courses and lessons</h1><p className="mt-2 text-sm text-[var(--color-muted-foreground)]">Create a course, build pages in the real editor, then publish when ready.</p></div><Link to="/explore" className="text-sm font-medium text-indigo-700 hover:underline">Open catalogue</Link></div>
    <section className="grid gap-4 sm:grid-cols-2"><CreateCard icon={FolderPlus} title="New course" text="Organise a sequence of lessons into a course." action={createCourse} /><CreateCard icon={FilePlus2} title="New standalone lesson" text="Open the editor directly for a single lesson." action={createLesson} /></section>
    <section className="mt-10"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Courses</h2><span className="text-xs text-[var(--color-muted-foreground)]">{courses.length}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{courses.map((course) => <Link key={course.id} to={`/teacher/course/${course.id}`} className="group rounded-xl border border-[var(--color-border)] p-4 hover:border-indigo-300 hover:shadow-sm"><div className="flex items-center justify-between gap-2"><BookOpen size={18} className="text-indigo-600" /><span className={`rounded px-2 py-0.5 text-[11px] ${course.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{course.is_published ? 'Live' : 'Draft'}</span></div><h3 className="mt-5 truncate text-sm font-semibold">{course.title}</h3><p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-[var(--color-muted-foreground)]">{course.description || 'No description yet.'}</p><div className="mt-4 flex items-center justify-between text-xs text-[var(--color-muted-foreground)]"><span>{course.lessons?.length || 0} lessons</span><ChevronRight size={15} className="text-indigo-600" /></div></Link>)}</div>{!courses.length && <p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-muted-foreground)]">No courses yet.</p>}</section>
    <section className="mt-10"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold">Standalone lessons</h2><span className="text-xs text-[var(--color-muted-foreground)]">{lessons.length}</span></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{lessons.map((lesson) => <Link key={lesson.id} to={`/teacher/editor/${lesson.id}`} className="group flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-4 hover:border-indigo-300"><FilePlus2 size={18} className="text-indigo-600" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{lesson.title}</span><ChevronRight size={15} /></Link>)}</div></section>
    {creating && <div className="fixed inset-0 grid place-items-center bg-black/10"><div className="rounded-lg bg-white px-4 py-3 text-sm shadow-lg"><Loader size={16} className="mr-2 inline animate-spin" />Creating {creating}…</div></div>}
  </div></main>;
};
