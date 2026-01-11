import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, Check, Lock, Play, Gem, Map as MapIcon, BookText, User } from 'lucide-react';

export default function CourseMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);

  const lessons = [
    { id: 1, title: 'Greetings & Politeness', desc: 'Etiquette basics and first phrases.' },
    { id: 2, title: 'I Want... (Essential Needs)', desc: 'Desire verbs and food basics.' },
    { id: 3, title: 'Money & Numbers (Ultimate)', desc: 'Master numbers 0-99,999 and currency.' },
    { id: 4, title: 'Survival Requests & Navigation', desc: 'Transport and emergency help.' },
  ];

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (data) setCompletedLessons(data.map(item => Number(item.lesson_id)));
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header Bar */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 p-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter uppercase">Course <span className="text-emerald-400">Map</span></h1>
        <div className="flex items-center gap-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-2">
            <Gem size={16} className="text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">0</span>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}>
            <LogOut size={20} className="text-gray-500 hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      {/* Lesson Path */}
      <div className="max-w-md mx-auto px-6 pt-12">
        <div className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] mb-10 text-center">Survival Block</div>

        <div className="space-y-12">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const isUnlocked = index === 0 || completedLessons.includes(lessons[index - 1].id);

            return (
              <div key={lesson.id} className="flex items-center gap-6 group">
                {/* Circle Icon */}
                <button
                  disabled={!isUnlocked}
                  onClick={() => navigate(`/lesson/${lesson.id}`)}
                  className={`relative shrink-0 w-20 h-20 rounded-full flex items-center justify-center border-4 transition-all transform active:scale-90
                    ${isCompleted
                      ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : isUnlocked
                        ? 'bg-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-gray-900 border-gray-800 opacity-50'}`}
                >
                  {isCompleted ? <Check size={32} strokeWidth={3} /> : isUnlocked ? <Play size={32} fill="currentColor" className="ml-1" /> : <Lock size={28} className="text-gray-600" />}

                  {/* Connecting Line */}
                  {index !== lessons.length - 1 && (
                    <div className={`absolute top-20 left-1/2 -translate-x-1/2 w-1 h-12 ${isCompleted ? 'bg-emerald-500/50' : 'bg-gray-800'}`} />
                  )}
                </button>

                {/* Info Card - ЗДЕСЬ БЫЛА ОШИБКА */}
                <div className={`flex-1 p-5 rounded-2xl border transition-all
                  ${isUnlocked
                    ? 'bg-gray-900/50 border-white/10 group-hover:border-emerald-500/50'
                    : 'bg-transparent border-white/5 opacity-40'}`}>
                  <h3 className={`font-bold text-lg ${isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                    {lesson.title}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1 leading-tight font-medium">
                    {lesson.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex justify-between items-center max-w-lg mx-auto rounded-t-[2.5rem]">
        <button className="flex flex-col items-center gap-1 text-emerald-400">
          <MapIcon size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-400 transition-colors">
          <BookText size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Vocab</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-400 transition-colors">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
}