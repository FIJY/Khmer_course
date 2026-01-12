import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Check, Play, Gem, Map as MapIcon,
  BookText, User, ChevronRight, BookOpen
} from 'lucide-react';

export default function CourseMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [chapters, setChapters] = useState([]);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // 1. Загружаем прогресс
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      const doneIds = progressData ? progressData.map(item => Number(item.lesson_id)) : [];
      setCompletedLessons(doneIds);

      // 2. Загружаем все уроки
      const { data: allLessons, error } = await supabase
        .from('lessons')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      // 3. НОВАЯ ЛОГИКА ГРУППИРОВКИ
      const chaptersMap = {};

      // Сначала находим все заголовки глав (ID < 100)
      allLessons.filter(l => l.id < 100).forEach(l => {
        chaptersMap[l.id] = {
          id: l.id,
          title: l.title,
          desc: l.description,
          subLessons: []
        };
      });

      // Затем распределяем подуроки (ID >= 100) по этим главам
      allLessons.filter(l => l.id >= 100).forEach(l => {
        const chapterId = Math.floor(l.id / 100);
        if (chaptersMap[chapterId]) {
          chaptersMap[chapterId].subLessons.push({
            id: l.id,
            title: l.title
          });
        } else {
          // Если заголовок главы не найден в базе, создаем временный
          chaptersMap[chapterId] = {
            id: chapterId,
            title: `Chapter ${chapterId}`,
            desc: 'Additional Lessons',
            subLessons: [{ id: l.id, title: l.title }]
          };
        }
      });

      setChapters(Object.values(chaptersMap));
    } catch (e) {
      console.error("Map fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center text-cyan-400 font-black italic tracking-widest">
      LOADING MASTER MAP...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-40 font-sans">
      <div className="p-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-30">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">
          Khmer <span className="text-cyan-400">Mastery</span>
        </h1>
        <div className="bg-gray-900 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
          <Gem size={18} className="text-emerald-500 fill-emerald-500/20" />
          <span className="font-black text-sm text-gray-200">{completedLessons.length * 50}</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-10 mt-6">
        {chapters.map((chapter) => {
          const subLessonIds = chapter.subLessons.map(sub => Number(sub.id));
          const isChapterFullDone = subLessonIds.length > 0 && subLessonIds.every(id => completedLessons.includes(id));

          return (
            <div key={chapter.id} className="animate-in fade-in duration-700">
              <div className={`bg-gray-900/40 border rounded-[3rem] p-8 transition-all duration-500
                ${isChapterFullDone ? 'border-emerald-500/30 bg-emerald-950/5' : 'border-white/5'}`}>

                <div className="flex justify-between items-start mb-6">
                  <div className="max-w-[75%]">
                    <h3 className={`text-2xl font-black uppercase tracking-tighter mb-1 ${isChapterFullDone ? 'text-emerald-400' : 'text-white'}`}>
                      {chapter.title}
                    </h3>
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest italic">{chapter.desc}</p>
                  </div>

                  <button
                    onClick={() => navigate(`/lesson/${chapter.id}/preview`)}
                    className={`p-4 rounded-2xl border transition-all duration-300 shadow-xl active:scale-90
                      ${isChapterFullDone ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400'}`}
                  >
                    {isChapterFullDone ? <Check size={20} /> : <BookOpen size={20} />}
                  </button>
                </div>

                {/* Подуроки: Рендерим их только если они есть в базе */}
                {chapter.subLessons.length > 0 && (
                  <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-white/5">
                    {chapter.subLessons.map((sub) => {
                      const isDone = completedLessons.includes(Number(sub.id));
                      return (
                        <button
                          key={sub.id}
                          onClick={() => navigate(`/lesson/${sub.id}`)}
                          className={`flex items-center justify-between p-4 rounded-xl transition-all border
                            ${isDone ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' : 'bg-black/40 border-white/5 text-gray-500'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2
                              ${isDone ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-gray-800'}`}>
                              {isDone ? <Check size={12} strokeWidth={4} /> : <Play size={10} fill="currentColor" className="ml-0.5 text-cyan-500" />}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">{sub.title}</span>
                          </div>
                          <ChevronRight size={16} className={isDone ? 'text-emerald-500' : 'opacity-20'} />
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

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/5 px-10 pt-5 pb-10 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[3rem]">
        <button onClick={() => navigate('/map')} className="text-cyan-400 flex flex-col items-center gap-2">
          <MapIcon size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="text-gray-600 flex flex-col items-center gap-2">
          <BookText size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Vocab</span>
        </button>
        <button onClick={() => navigate('/profile')} className="text-gray-600 flex flex-col items-center gap-2">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Me</span>
        </button>
      </div>
    </div>
  );
}