import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

// --- ИМПОРТ СТРАНИЦ ---
import Login from './pages/Login';
import CourseMap from './pages/CourseMap';
import LessonPreview from './pages/LessonPreview';
import LessonPlayer from './pages/LessonPlayer';
import Vocab from './pages/Vocab';
import Profile from './pages/Profile';
import KhmerGlyphLab from './pages/KhmerGlyphLab';
import Paywall from './pages/Paywall';

// 👇 ВОТ ЭТИ ДВА ФАЙЛА МЫ ДОБАВИЛИ, ПРОВЕРЬ ЧТО ОНИ ТУТ ЕСТЬ
import ReviewHub from './pages/ReviewHub';
import ReviewPlayer from './pages/ReviewPlayer';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const showGlyphLab = import.meta.env.DEV || import.meta.env.VITE_ENABLE_KHMER_DEBUG === 'true';

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
        {/* ЛОГИН */}
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/map" />} />

        {/* ГЛАВНЫЕ СТРАНИЦЫ */}
        <Route path="/map" element={session ? <CourseMap /> : <Navigate to="/login" />} />
        <Route path="/vocab" element={session ? <Vocab /> : <Navigate to="/login" />} />
        <Route path="/profile" element={session ? <Profile /> : <Navigate to="/login" />} />

        {/* УРОКИ */}
        <Route path="/lesson/:id/preview" element={session ? <LessonPreview /> : <Navigate to="/login" />} />
        <Route path="/lesson/:id" element={session ? <LessonPlayer /> : <Navigate to="/login" />} />
        <Route path="/paywall" element={session ? <Paywall /> : <Navigate to="/login" />} />

        {/* 👇 НОВЫЕ МАРШРУТЫ ДЛЯ REVIEW (БЕЗ НИХ БУДЕТ ЧЕРНЫЙ ЭКРАН) */}
        <Route path="/review" element={session ? <ReviewHub /> : <Navigate to="/login" />} />
        <Route path="/review/session" element={session ? <ReviewPlayer /> : <Navigate to="/login" />} />

        {showGlyphLab && (
          <Route path="/debug/khmer-glyphs" element={<KhmerGlyphLab />} />
        )}

        {/* Если адрес не найден — отправляем на карту */}
        <Route path="*" element={<Navigate to={session ? "/map" : "/login"} />} />
      </Routes>
    </Router>
  );
}
