import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, Check, Lock, Play } from 'lucide-react';

export default function CourseMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);

  // Официальный план Survival Block (ID 1-4)
  const lessons = [
    { id: 1, title: 'Greetings & Politeness' },
    { id: 2, title: 'I Want... (Essential Needs)' },
    { id: 3, title: 'Money & Numbers' },
    { id: 4, title: 'Survival Requests' },
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

      const { data, error } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (error) throw error;
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
      <div className="p-4 flex justify-between items-center bg-gray-800 shadow-lg z-10 relative border-b border-gray-700">
        <h1 className="font-bold text-xl text-emerald-400 uppercase tracking-wider">Survival Block</h1>
        <button onClick={handleLogout} className="p-2 bg-gray-700 rounded-full hover:bg-gray-600">
          <LogOut size={18} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-16 mt-12 relative z-0">
        {lessons.map((lesson, index) => {
          const isCompleted = completedLessons.includes(lesson.id);
          const isUnlocked = index === 0 || completedLessons.includes(lessons[index - 1].id);

          return (
            <div key={lesson.id} className="relative flex flex-col items-center w-full px-4">
              <button
                disabled={!isUnlocked}
                onClick={() => navigate(`/lesson/${lesson.id}`)}
                className={`w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all transform active:scale-90
                  ${isCompleted
                    ? 'bg-emerald-600 border-emerald-400 text-white'
                    : isUnlocked
                      ? 'bg-yellow-500 border-yellow-300 text-white shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                      : 'bg-gray-800 border-gray-700 text-gray-600'
                  }`}
              >
                {isCompleted ? <Check size={40} /> : isUnlocked ? <Play size={40} fill="currentColor" /> : <Lock size={32} />}
              </button>

              <div className={`mt-4 px-6 py-2 rounded-full text-sm font-bold shadow-md border
                ${isUnlocked ? 'bg-gray-800 border-emerald-500/30 text-emerald-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                {index + 1}. {lesson.title}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}