import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export const PlatformLayout = ({ role }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const home = role === 'teacher' ? '/teacher' : '/student';
  return <div className="min-h-screen bg-[var(--color-background)]"><header className="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4 sm:px-7"><Link to={home} className="text-sm font-semibold">Alcheris</Link><nav className="flex items-center gap-4 text-sm"><Link to={home}>Home</Link><Link to={role === 'teacher' ? '/teacher/explore' : '/student/explore'}>Catalogue</Link><button onClick={() => { logout(); navigate('/'); }} className="text-[var(--color-muted-foreground)]">Sign out</button></nav></header><main><Outlet /></main></div>;
};
