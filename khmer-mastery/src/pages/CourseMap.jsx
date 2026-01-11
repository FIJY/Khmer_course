import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, Play } from 'lucide-react';

const CourseMap = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-emerald-400 mb-2">Карта Уроков</h1>
        <p className="text-gray-400">Если вы это видите — бесконечный цикл остановлен!</p>
      </div>

      {/* Кнопка запуска урока */}
      <button
        onClick={() => navigate('/lesson/1')}
        className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg"
      >
        <Play fill="currentColor" />
        Начать Урок 1
      </button>

      {/* Кнопка выхода (на случай если надо сбросить) */}
      <button
        onClick={handleLogout}
        className="text-gray-500 hover:text-white flex items-center gap-2 mt-8"
      >
        <LogOut size={20} />
        Выйти из аккаунта
      </button>

      <div className="text-xs text-gray-700 font-mono absolute bottom-20">
        Debug Version: Map v2.0
      </div>
    </div>
  );
};

export default CourseMap;