import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Map as MapIcon, Book, User } from 'lucide-react';
// import { supabase } from './lib/supabase'; <--- Убрали, чтобы не ломало сборку
import Login from './pages/Login';

import Home from './pages/Home'; // Убедитесь, что этот файл существует, или замените на Welcome
// Если Home не существует, раскомментируйте строку ниже и используйте Welcome:
import Welcome from './pages/Welcome';

import CourseMap from './pages/CourseMap';
import LessonPlayer from './pages/LessonPlayer';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Скрываем меню на главной и на странице входа
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname.startsWith('/lesson')) return null;

  const tabs = [
    { id: 'map', icon: <MapIcon size={24} />, label: 'Map', path: '/map' },
    { id: 'vocab', icon: <Book size={24} />, label: 'Vocab', path: '/vocab' },
    { id: 'profile', icon: <User size={24} />, label: 'Profile', path: '/profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 px-6 py-3 z-50">
      <div className="flex justify-around items-center max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-1 transition-all ${
              location.pathname === tab.path ? 'text-cyan-400 scale-110' : 'text-gray-500'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-bold uppercase">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="h-screen w-screen bg-black text-white flex justify-center overflow-hidden">
        <div className="w-full max-w-md h-full border-x border-gray-800 flex flex-col relative overflow-hidden">
          <div className="flex-1 overflow-y-auto pb-24">
            <Routes>
              {/* Если Home нет, используйте Welcome */}
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/map" element={<CourseMap />} />
              <Route path="/lesson/:id" element={<LessonPlayer />} />
              <Route path="/vocab" element={<div className="p-10 text-center text-gray-500 italic">3,000+ Words Dictionary Indexing...</div>} />
              <Route path="/profile" element={<div className="p-10 text-center text-gray-500 italic">Level B1 Tracker</div>} />
            </Routes>
          </div>
          <Navigation />
        </div>
      </div>
    </Router>
  );
}

export default App;