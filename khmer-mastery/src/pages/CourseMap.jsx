import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, Check, Lock, Play, Gem, Map as MapIcon, BookText, User } from 'lucide-react';

export default function CourseMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);

  const lessons = [
    { id: 1, title: 'Lesson 1: Greetings & Politeness', desc: 'Etiquette basics and first phrases.' },
    { id: 2, title: 'Lesson 2: I Want... (Essential Needs)', desc: 'Desire verbs and basic products (no chicken!).' },
    { id: 3, title: 'Lesson 3: Money & Numbers (Ultimate)', desc: 'Master numbers 0-99,999 and currency.' },
    { id: 4, title: 'Lesson 4: Survival Requests & Navigation', desc: 'Transport and emergency help.' },
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
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans">
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-3xl font-bold tracking-tight">Course Map</h1>
        <div className="flex items-center gap-4">
          <div className="bg-gray-900 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10 shadow-lg">
            <Gem size={18} className="text-cyan-400 fill-cyan-400/20" />
            <span className="font-bold text-sm">0</span>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => navigate('/login'))}>
            <LogOut size={20} className="text-gray-500 hover:text-white" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto p-6 space-y-8 mt-4">
        <h2 className="text-xs font-black uppercase tracking-[0.3em] text-gray-600 mb-6">Survival</h2>

        <div className="space-y-4">
          {lessons.map((lesson, index) => {
            const isCompleted = completedLessons.includes(lesson.id);
            const isUnlocked = index === 0 || completedLessons.includes(lessons[index - 1].id);

            return (
              <div
                key={lesson.id}
                onClick={() => isUnlocked && navigate(`/lesson/${lesson.id}`)}
                className={`flex items-center gap-5 p-1 rounded-3xl transition-all cursor-pointer group
                  ${isUnlocked ? 'hover:translate-x-1' : 'opacity-50 cursor-not-allowed'}`}
              >
                {/* Play Button Icon */}
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shrink-0 shadow-lg transition-transform group-active:scale-90
                  ${isCompleted
                    ? 'bg-cyan-500 border-cyan-300 text-white'
                    : isUnlocked
                      ? 'bg-black border-cyan-500 text-cyan-500 shadow-cyan-500/20'
                      : 'bg-gray-900 border-gray-800 text-gray-700'}`}>
                  {isCompleted ? <Check size={32} strokeWidth={3} /> : <Play size={28} fill={isUnlocked ? "currentColor" : "none"} className="ml-1" />}
                </div>

                {/* Text Content */}
                <div className={`flex-1 py-4 px-6 rounded-[2rem] border transition-colors
                  ${isUnlocked
                    ? 'bg-gray-900/40 border-white/5 group-hover:bg-gray-900/60'
                    : 'bg-transparent border-white/5'}`}>
                  <h3 className="text-xl font-bold mb-1">{lesson.title}</h3>
                  <p className="text-gray-500 text-sm font-medium">{lesson.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-cyan-400">
          <MapIcon size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors">
          <BookText size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Vocab</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
}