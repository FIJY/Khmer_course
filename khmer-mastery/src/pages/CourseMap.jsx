import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Путь к единственному файлу клиента
import {
  Check,
  Play,
  Gem,
  Map as MapIcon,
  BookText,
  User,
  ChevronRight,
  BookOpen,
  Lock
} from 'lucide-react';

export default function CourseMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [chapters, setChapters] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // 1. Получаем прогресс пользователя
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      const doneIds = progressData ? progressData.map(item => Number(item.lesson_id)) : [];
      setCompletedLessons(doneIds);

      // 2. Получаем все уроки из базы данных
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      // 3. Динамическая группировка уроков по Главам
      const grouped = lessons.reduce((acc, lesson) => {
        const chapterId = Math.floor(lesson.id / 100);
        if (!acc[chapterId]) {
          acc[chapterId] = {
            id: chapterId,
            title: `Chapter ${chapterId}`,
            // Названия глав можно расширить позже через отдельную таблицу в БД
            desc: chapterId === 1 ? 'Foundations & Etiquette' : 'Survival & Navigation',
            subLessons: []
          };
        }
        acc[chapterId].subLessons.push({
          id: lesson.id,
          title: lesson.title
        });
        return acc;
      }, {});

      setChapters(Object.values(grouped));
    } catch (e) {
      console.error("Map data fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center text-cyan-400 font-black italic tracking-widest">
      SYNCING MAP...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-cyan-500/30">
      {/* Header: Липкий и с актуальными Гемами */}
      <div className="p-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-20">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">
          Course <span className="text-cyan-400">Map</span>
        </h1>
        <div className="bg-gray-900 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 shadow-lg shadow-emerald-500/5">
          <Gem size={18} className="text-emerald-500 fill-emerald-500/20" />
          <span className="font-black text-sm text-gray-300">{completedLessons.length * 50}</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-10 mt-6">
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">Learning Path</h2>

        {chapters.map((chapter) => {
          const subLessonIds = chapter.subLessons.map(sub => Number(sub.id));
          const isChapterFullDone = subLessonIds.length > 0 && subLessonIds.every(id => completedLessons.includes(id));

          return (
            <div key={chapter.id} className="space-y-4">
              <div className={`bg-gray-900/40 border rounded-[2.5rem] p-6 transition-all duration-500
                ${isChapterFullDone ? 'border-emerald-500/30 bg-emerald-950/5' : 'border-white/5'}`}>

                <div className="flex justify-between items-start mb-6">
                  <div className="max-w-[70%]">
                    <h3 className={`text-2xl font-black uppercase tracking-tighter transition-colors ${isChapterFullDone ? 'text-emerald-400' : 'text-white'}`}>
                      {chapter.title}
                    </h3>
                    <p className="text-gray-500 text-xs font-medium mt-1 leading-relaxed italic">{chapter.desc}</p>
                  </div>

                  {/* Кнопка Preview: Теперь работает динамически */}
                  <button
                    onClick={() => navigate(`/lesson/${chapter.subLessons[0]?.id}/preview`)}
                    className={`p-4 rounded-2xl border transition-all duration-300 shadow-xl
                      ${isChapterFullDone
                        ? 'bg-emerald-600 border-emerald-400 text-white'
                        : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black'}`}
                  >
                    {isChapterFullDone ? <Check size={20} strokeWidth={3} /> : <BookOpen size={20} />}
                  </button>
                </div>

                {/* Список подуроков, загруженных из базы */}
                <div className="grid grid-cols-1 gap-2 mt-4 pt-4 border-t border-white/5">
                  {chapter.subLessons.map((sub) => {
                    const isDone = completedLessons.includes(Number(sub.id));
                    return (
                      <button
                        key={sub.id}
                        onClick={() => navigate(`/lesson/${sub.id}`)}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all border group
                          ${isDone
                            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                            : 'bg-black/40 border-white/5 text-gray-500 hover:border-cyan-500/30 hover:text-gray-300'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                            ${isDone ? 'border-emerald-400 bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'border-gray-800'}`}>
                            {isDone ? <Check size={14} strokeWidth={4} /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-[0.15em]">{sub.title}</span>
                        </div>
                        <ChevronRight size={16} className={`transition-transform group-hover:translate-x-1 ${isDone ? 'text-emerald-500' : 'opacity-10'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Bar: Фиксированный для удобства большого пальца */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 pb-10 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="text-cyan-400 flex flex-col items-center gap-1.5 outline-none group">
          <MapIcon size={24} className="group-active:scale-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="text-gray-500 flex flex-col items-center gap-1.5 outline-none group hover:text-gray-300 transition-colors">
          <BookText size={24} className="group-active:scale-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Vocab</span>
        </button>
        <button onClick={() => navigate('/profile')} className="text-gray-500 flex flex-col items-center gap-1.5 outline-none group hover:text-gray-300 transition-colors">
          <User size={24} className="group-active:scale-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
}