import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import CourseMap from './pages/CourseMap';
import LessonPlayer from './pages/LessonPlayer';
import Welcome from './pages/Welcome';
import Vocab from './pages/Vocab';
import LessonPreview from './pages/LessonPreview';
import Profile from './pages/Profile'; // Обязательно импортируем!
import { supabase } from './supabaseClient';
import ReviewHub from './pages/ReviewHub';
import ReviewPlayer from './pages/ReviewPlayer';

export default function App() {
  return (
    <Router>
      <div className="bg-black min-h-screen text-white font-sans">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/map" element={<CourseMap />} />
          <Route path="/vocab" element={<Vocab />} />
          <Route path="/profile" element={<Profile />} /> {/* Теперь профиль будет работать */}
          <Route path="/lesson/:id/preview" element={<LessonPreview />} />
          <Route path="/lesson/:id" element={<LessonPlayer />} />
          <Route path="/review" element={<ReviewHub />} />
          <Route path="/review/session" element={<ReviewPlayer />} />
        </Routes>
      </div>
    </Router>
  );
}