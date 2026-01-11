import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, Check, Lock, Play } from 'lucide-react';

export default function CourseMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);

  // Список уроков (пока жестко задан, потом можно перенести в базу)
  const lessons = [
    { id: 1, title: 'Приветствия', position: 'top-20 left-10' },
    { id: 2, title: 'Числа 1-10', position: 'top-40 right-10' },
    { id: 3, title: 'Еда и Рынок', position: 'top-60 left-20' },
    { id: 4, title: 'Семья', position: 'top-80 right-20' },
  ];

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Получаем список пройденных уроков
      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (error) throw error;

      // Превращаем массив объектов в простой список ID: ['1', '3']
      setCompletedLessons(data.map(item => Number(item.lesson_id)));
    } catch (error) {
      console.error('Ошибка загрузки карты:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-emerald-400">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20 relative overflow-hidden">
      {/* Шапка */}
      <div className="p-4 flex justify-between items-center bg-gray-800 shadow-lg z-10 relative">
        <h1 className="font-bold text-xl text-emerald-400">Карта Камбоджи</h1>
        <button onClick={handleLogout} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
          <LogOut size={18} />
        </button>
      </div>

      {/* Извилистая дорожка (SVG) */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20" xmlns="http://www.w3.org/2000/svg">
        <path d="M 50 80 Q 200 150 300 250 T 100 450 T 300 650" stroke="white" strokeWidth="4" fill="none" />
      </svg>

      {/* Сетка уроков */}
      <div className="flex flex-col items-center gap-12 mt-10 relative z-0">
        {lessons.map((lesson, index) => {
          // Логика доступа: Урок 1 открыт всегда. Остальные - если пройден предыдущий.
          const isCompleted = completedLessons.includes(lesson.id);
          const isUnlocked = index === 0 || completedLessons.includes(lessons[index - 1].id);

          return (
            <div key={lesson.id} className="relative flex flex-col items-center">
              <button
                disabled={!isUnlocked}
                onClick={() => navigate(`/lesson/${lesson.id}`)}
                className={`w-20 h-20 rounded-full flex items-center justify-center border-4 shadow-xl transition-all transform active:scale-95
                  ${isCompleted
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : isUnlocked
                      ? 'bg-yellow-500 border-yellow-300 text-white animate-pulse'
                      : 'bg-gray-700 border-gray-600 text-gray-500'
                  }`}
              >
                {isCompleted ? <Check size={32} /> : isUnlocked ? <Play size={32} fill="currentColor" /> : <Lock size={24} />}
              </button>

              {/* Подпись урока */}
              <div className="mt-2 bg-gray-800 px-3 py-1 rounded text-sm font-bold shadow border border-gray-700">
                {lesson.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}