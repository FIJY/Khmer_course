import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import CourseMap from './pages/CourseMap';
import LessonPlayer from './pages/LessonPlayer';
import Welcome from './pages/Welcome';
import Vocab from './pages/Vocab'; // Импортируем новый словарь

const Profile = () => <div className="p-10 text-center text-gray-500">User Profile Coming Soon...</div>;

export default function App() {
  return (
    <Router>
      <div className="bg-black min-h-screen text-white font-sans">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/map" element={<CourseMap />} />
          <Route path="/vocab" element={<Vocab />} /> {/* Реальный маршрут */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/lesson/:id" element={<LessonPlayer />} />
        </Routes>
      </div>
    </Router>
  );
}