import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import CourseMap from './pages/CourseMap';
import LessonPlayer from './pages/LessonPlayer';
import Welcome from './pages/Welcome';

export default function App() {
  return (
    <Router>
      <div className="bg-gray-900 min-h-screen text-white">
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/map" element={<CourseMap />} />
          <Route path="/lesson/:id" element={<LessonPlayer />} />
        </Routes>
      </div>
    </Router>
  );
}