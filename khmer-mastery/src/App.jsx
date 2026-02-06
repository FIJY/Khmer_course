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
import AudioGuessDebug from './pages/AudioGuessDebug';

// 👇 ВОТ ЭТИ ДВА ФАЙЛА МЫ ДОБАВИЛИ, ПРОВЕРЬ ЧТО ОНИ ТУТ ЕСТЬ
import ReviewHub from './pages/ReviewHub';
import ReviewPlayer from './pages/ReviewPlayer';

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const showGlyphLab = import.meta.env.DEV || import.meta.env.VITE_ENABLE_KHMER_DEBUG === 'true';
  const showAudioGuessDebug = import.meta.env.DEV;
  const bypassAuth = import.meta.env.DEV && import.meta.env.VITE_BYPASS_AUTH === 'true';

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

  if (loading && !bypassAuth) return <div className="bg-black h-screen text-white flex items-center justify-center">Loading App...</div>;

  const isAuthed = Boolean(session) || bypassAuth;

  return (
    <Router>
      <Routes>
        {/* ЛОГИН */}
        <Route path="/login" element={!isAuthed ? <Login /> : <Navigate to="/map" />} />

        {/* ГЛАВНЫЕ СТРАНИЦЫ */}
        <Route path="/map" element={isAuthed ? <CourseMap /> : <Navigate to="/login" />} />
        <Route path="/vocab" element={isAuthed ? <Vocab /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isAuthed ? <Profile /> : <Navigate to="/login" />} />

        {/* УРОКИ */}
        <Route path="/lesson/:id/preview" element={isAuthed ? <LessonPreview /> : <Navigate to="/login" />} />
        <Route path="/lesson/:id" element={isAuthed ? <LessonPlayer /> : <Navigate to="/login" />} />

        {/* 👇 НОВЫЕ МАРШРУТЫ ДЛЯ REVIEW (БЕЗ НИХ БУДЕТ ЧЕРНЫЙ ЭКРАН) */}
        <Route path="/review" element={isAuthed ? <ReviewHub /> : <Navigate to="/login" />} />
        <Route path="/review/session" element={isAuthed ? <ReviewPlayer /> : <Navigate to="/login" />} />

        {showGlyphLab && (
          <Route path="/debug/khmer-glyphs" element={<KhmerGlyphLab />} />
        )}
        {showAudioGuessDebug && (
          <Route path="/debug/audio-guess" element={<AudioGuessDebug />} />
        )}

        {/* Если адрес не найден — отправляем на карту */}
        <Route path="*" element={<Navigate to={isAuthed ? "/map" : "/login"} />} />
      </Routes>
    </Router>
  );
}
