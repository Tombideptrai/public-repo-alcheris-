import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlatformLayout } from './components/layout/PlatformLayout';
import AlcherisLoader from './components/AlcherisLoader';

const named = (load, exportName) => lazy(() => load().then((module) => ({ default: module[exportName] })));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = named(() => import('./pages/auth/Login'), 'Login');
const Dashboard = named(() => import('./pages/teacher/Dashboard'), 'Dashboard');
const CourseManager = named(() => import('./pages/teacher/CourseManager'), 'CourseManager');
const StudentDashboard = named(() => import('./pages/student/StudentDashboard'), 'StudentDashboard');
const ExploreCourses = named(() => import('./pages/student/ExploreCourses'), 'ExploreCourses');
const CourseLandingPage = named(() => import('./pages/student/CourseLandingPage'), 'CourseLandingPage');
const StandaloneLessonPage = named(() => import('./pages/student/StandaloneLessonPage'), 'StandaloneLessonPage');
const LessonEditor = named(() => import('./features/editor/LessonEditor'), 'LessonEditor');
const LessonPlayer = named(() => import('./features/player/LessonPlayer'), 'LessonPlayer');

const Loading = () => <AlcherisLoader />;
const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  return user ? children : <Navigate to="/login" replace />;
};
const Home = () => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <LandingPage />;
  return <Navigate to={user.role === 'teacher' ? '/teacher' : '/student'} replace />;
};

export default function App() {
  return <BrowserRouter><AuthProvider><Suspense fallback={<Loading />}><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Login initialMode="signup" />} />
    <Route path="/explore" element={<ExploreCourses />} />
    <Route path="/course/:id" element={<CourseLandingPage />} />
    <Route path="/lesson/:id" element={<StandaloneLessonPage />} />
    <Route element={<Protected><PlatformLayout role="teacher" /></Protected>}>
      <Route path="/teacher" element={<Dashboard />} />
      <Route path="/teacher/course/:id" element={<CourseManager />} />
      <Route path="/teacher/explore" element={<ExploreCourses />} />
    </Route>
    <Route path="/teacher/editor/:lessonId" element={<Protected><LessonEditor /></Protected>} />
    <Route element={<Protected><PlatformLayout role="student" /></Protected>}>
      <Route path="/student" element={<StudentDashboard />} />
      <Route path="/student/explore" element={<ExploreCourses />} />
    </Route>
    <Route path="/learn/:lessonId" element={<LessonPlayer />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></Suspense></AuthProvider></BrowserRouter>;
}
