import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { LogOut, Check, Play, Gem, Map as MapIcon, BookText, User, ChevronRight, BookOpen } from 'lucide-react';

export default function CourseMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);

  // Группированная структура уроков
  const chapters = [
    {
      id: 1,
      title: 'Lesson 1: Greetings',
      desc: 'Etiquette and basic phrases',
      subLessons: [
        { id: 101, title: '1.1 Greetings' },
        { id: 102, title: '1.2 Politeness' }
      ]
    },
    { id: 2, title: 'Lesson 2: Essential Needs', desc: 'Survival food and desire verbs', subLessons: [] },
    { id: 3, title: 'Lesson 3: Money & Numbers', desc: 'Market Khmer and currency', subLessons: [] },
    { id: 4, title: 'Lesson 4: Survival Requests', desc: 'Transport and emergency', subLessons: [] },
  ];

  useEffect(() => { fetchProgress(); }, []);

  const fetchProgress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    const { data } = await supabase.from('user_progress').select('lesson_id').eq('user_id', user.id).eq('is_completed', true);
    if (data) setCompletedLessons(data.map(item => Number(item.lesson_id)));
    setLoading(false);
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400">⏳</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans">
      {/* Header */}
      <div className="p-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-3xl font-bold tracking-tight uppercase italic">Course <span className="text-cyan-400">Map</span></h1>
        <div className="bg-gray-900 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
          <Gem size={18} className="text-emerald-500 fill-emerald-500/20" />
          <span className="font-black text-sm">{completedLessons.length * 10}</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-10 mt-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">Survival Block</h2>

        {chapters.map((chapter) => {
          const isMainUnlocked = true; // Здесь можно добавить логику разблокировки глав

          return (
            <div key={chapter.id} className="space-y-4">
              {/* ОСНОВНАЯ КАРТОЧКА УРОКА */}
              <div className="bg-gray-900/40 border border-white/5 rounded-[2.5rem] p-6 relative overflow-hidden group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">{chapter.title}</h3>
                    <p className="text-gray-500 text-xs font-medium mt-1">{chapter.desc}</p>
                  </div>
                  {/* Кнопка ПРЕВЬЮ (Словарь и теория на весь урок) */}
                  <button
                    onClick={() => navigate(`/lesson/${chapter.id}/preview`)}
                    className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all shadow-lg shadow-cyan-500/5"
                  >
                    <BookOpen size={20} />
                  </button>
                </div>

                {/* ПОДУРОКИ (Квизы и практика) */}
                {chapter.subLessons.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-white/5">
                    {chapter.subLessons.map((sub) => {
                      const isDone = completedLessons.includes(sub.id);
                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigate(`/lesson/${sub.id}`)}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all border
                            ${isDone
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                              : 'bg-black/40 border-white/5 text-gray-400 hover:border-cyan-500/30'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2
                              ${isDone ? 'border-emerald-400 bg-emerald-500/20' : 'border-gray-800'}`}>
                              {isDone ? <Check size={14} strokeWidth={4} /> : <Play size={12} fill="currentColor" />}
                            </div>
                            <span className="text-xs font-black uppercase tracking-widest">{sub.title}</span>
                          </div>
                          <ChevronRight size={16} className="opacity-30" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="text-cyan-400 flex flex-col items-center gap-1"><MapIcon size={24} /><span className="text-[10px] font-black uppercase">Map</span></button>
        <button onClick={() => navigate('/vocab')} className="text-gray-500 flex flex-col items-center gap-1"><BookText size={24} /><span className="text-[10px] font-black uppercase">Vocab</span></button>
        <button onClick={() => navigate('/profile')} className="text-gray-500 flex flex-col items-center gap-1"><User size={24} /><span className="text-[10px] font-black uppercase">Profile</span></button>
      </div>
    </div>
  );
}