import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import CourseMap from './pages/CourseMap';
import LessonPlayer from './pages/LessonPlayer';
import Welcome from './pages/Welcome';
import Vocab from './pages/Vocab';
import LessonPreview from './pages/LessonPreview'; // Импортируем новую страницу

// Заглушка для профиля
const Profile = () => (
  <div className="min-h-screen bg-black flex items-center justify-center text-gray-500">
    Profile Stats Coming Soon...
  </div>
);

export default function App() {
  return (
    <Router>
      <div className="bg-black min-h-screen text-white font-sans">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/map" element={<CourseMap />} />
          <Route path="/vocab" element={<Vocab />} />
          <Route path="/profile" element={<Profile />} />

          {/* Сначала идем на ПРЕВЬЮ (учебник) */}
          <Route path="/lesson/:id/preview" element={<LessonPreview />} />

          {/* Оттуда переходим в ПЛЕЕР (интерактив) */}
          <Route path="/lesson/:id" element={<LessonPlayer />} />
        </Routes>
      </div>
    </Router>
  );
}