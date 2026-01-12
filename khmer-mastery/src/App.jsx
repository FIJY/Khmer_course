import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// Импортируем страницы
import Login from './pages/Login';
import CourseMap from './pages/CourseMap';
import LessonPreview from './pages/LessonPreview'; // Конспект
import LessonPlayer from './pages/LessonPlayer';   // Урок
import Vocab from './pages/Vocab';
import Profile from './pages/Profile';
import ReviewHub from './pages/ReviewHub';     // <--- НОВОЕ
import ReviewPlayer from './pages/ReviewPlayer'; // <--- НОВОЕ

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="bg-black h-screen text-white flex items-center justify-center">Loading App...</div>;

  return (
    <Router>
      <Routes>
        {/* Если не залогинен -> Login */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/map" />} />

        {/* Основные маршруты (Только для залогиненных) */}
        <Route path="/map" element={session ? <CourseMap /> : <Navigate to="/login" />} />
        <Route path="/vocab" element={session ? <Vocab /> : <Navigate to="/login" />} />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" />} />

        {/* Уроки */}
        <Route path="/lesson/:id/preview" element={session ? <LessonPreview /> : <Navigate to="/login" />} />
        <Route path="/lesson/:id" element={session ? <LessonPlayer /> : <Navigate to="/login" />} />

        {/* Повторение (Review) */}
        <Route path="/review" element={session ? <ReviewHub /> : <Navigate to="/login" />} />
        <Route path="/review/session" element={session ? <ReviewPlayer /> : <Navigate to="/login" />} />

        {/* По умолчанию -> на карту */}
        <Route path="*" element={<Navigate to={session ? "/map" : "/login"} />} />
      </Routes>
    </Router>
  );
}