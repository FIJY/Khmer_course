import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Путь к единственному файлу
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

      // 1. Получаем прогресс пользователя для галочек и Гемов
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      const doneIds = progressData ? progressData.map(item => Number(item.lesson_id)) : [];
      setCompletedLessons(doneIds);

      // 2. Получаем все уроки, которые ты загрузила через скрипты
      const { data: lessons, error } = await supabase
        .from('lessons')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      // 3. Динамическая группировка: 1xx -> Chapter 1, 2xx -> Chapter 2
      const grouped = lessons.reduce((acc, lesson) => {
        const chapterId = Math.floor(lesson.id / 100);

        // Убираем "Chapter 0" (тестовые уроки с ID меньше 100)
        if (chapterId === 0) return acc;

        if (!acc[chapterId]) {
          acc[chapterId] = {
            id: chapterId,
            title: `Chapter ${chapterId}`,
            // Названия можно вынести в базу, но пока задаем логикой продукта [cite: 2026-01-11]
            desc: chapterId === 1 ? 'Foundations & Greetings' : 'Survival & Navigation',
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
      console.error("Map load error:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center text-cyan-400 font-black italic tracking-widest">
      GENERATING PATH...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-40 font-sans selection:bg-cyan-500/30">
      {/* Header: Считаем Гемы (количество пройденных уроков * 50) */}
      <div className="p-6 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-30">
        <h1 className="text-3xl font-black tracking-tighter uppercase italic">
          Khmer <span className="text-cyan-400">Mastery</span>
        </h1>
        <div className="bg-gray-900 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 shadow-lg shadow-emerald-500/10">
          <Gem size={18} className="text-emerald-500 fill-emerald-500/20" />
          <span className="font-black text-sm text-gray-200">{completedLessons.length * 50}</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-12 mt-6">
        {chapters.map((chapter) => {
          const subLessonIds = chapter.subLessons.map(sub => Number(sub.id));
          const isChapterFullDone = subLessonIds.length > 0 && subLessonIds.every(id => completedLessons.includes(id));

          return (
            <div key={chapter.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className={`bg-gray-900/40 border rounded-[3rem] p-8 transition-all duration-500 relative overflow-hidden
                ${isChapterFullDone ? 'border-emerald-500/30 bg-emerald-950/5' : 'border-white/5'}`}>

                {/* Декоративный фон для завершенных глав */}
                {isChapterFullDone && (
                  <div className="absolute -right-4 -top-4 opacity-10">
                    <Check size={120} className="text-emerald-500" />
                  </div>
                )}

                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="max-w-[75%]">
                    <h3 className={`text-3xl font-black uppercase tracking-tighter mb-2 ${isChapterFullDone ? 'text-emerald-400' : 'text-white'}`}>
                      {chapter.title}
                    </h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-widest opacity-60 leading-relaxed italic">
                      {chapter.desc}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/lesson/${chapter.subLessons[0]?.id}/preview`)}
                    className={`p-5 rounded-[1.5rem] border transition-all duration-300 shadow-2xl active:scale-90
                      ${isChapterFullDone
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-500/20'
                        : 'bg-cyan-500/5 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500 hover:text-black'}`}
                  >
                    {isChapterFullDone ? <Check size={24} strokeWidth={3} /> : <BookOpen size={24} />}
                  </button>
                </div>

                {/* Список подуроков: Теперь берется из базы */}
                <div className="grid grid-cols-1 gap-3 mt-6 pt-6 border-t border-white/5 relative z-10">
                  {chapter.subLessons.map((sub) => {
                    const isDone = completedLessons.includes(Number(sub.id));
                    return (
                      <button
                        key={sub.id}
                        onClick={() => navigate(`/lesson/${sub.id}`)}
                        className={`flex items-center justify-between p-5 rounded-2xl transition-all border group active:scale-[0.98]
                          ${isDone
                            ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'
                            : 'bg-black/40 border-white/5 text-gray-500 hover:border-cyan-500/30 hover:text-gray-300'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                            ${isDone ? 'border-emerald-400 bg-emerald-500 text-white shadow-lg' : 'border-gray-800 bg-gray-900'}`}>
                            {isDone ? <Check size={16} strokeWidth={4} /> : <Play size={14} fill="currentColor" className="ml-0.5 text-cyan-500" />}
                          </div>
                          <span className="text-xs font-black uppercase tracking-widest">{sub.title}</span>
                        </div>
                        <ChevronRight size={18} className={`transition-transform group-hover:translate-x-1 ${isDone ? 'text-emerald-500' : 'opacity-20'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation Bar: Фикс для Safari (pb-10) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/5 px-10 pt-5 pb-10 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <button onClick={() => navigate('/map')} className="text-cyan-400 flex flex-col items-center gap-2 outline-none group">
          <MapIcon size={26} className="group-active:scale-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Explore</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="text-gray-600 flex flex-col items-center gap-2 outline-none group hover:text-gray-300 transition-colors">
          <BookText size={26} className="group-active:scale-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Words</span>
        </button>
        <button onClick={() => navigate('/profile')} className="text-gray-600 flex flex-col items-center gap-2 outline-none group hover:text-gray-300 transition-colors">
          <User size={26} className="group-active:scale-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Me</span>
        </button>
      </div>
    </div>
  );
}