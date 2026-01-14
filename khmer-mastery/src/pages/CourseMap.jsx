import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Check, Play, Gem, RefreshCw, Lock, Layers } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';

const COURSE_LEVELS = [
  {
    title: "LEVEL 1: SURVIVAL MODE",
    description: "The absolute basics to survive in Cambodia.",
    range: [1, 4],
    color: "text-cyan-400",
    bg: "from-cyan-500/10 to-transparent",
    border: "border-cyan-500/20"
  },
  {
    title: "LEVEL 2: DAILY LIFE",
    description: "Handle real-world situations like a local.",
    range: [5, 9],
    color: "text-emerald-400",
    bg: "from-emerald-500/10 to-transparent",
    border: "border-emerald-500/20"
  }
];

export default function CourseMap() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userProgress, setUserProgress] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { data: lessonsData } = await supabase
        .from('lessons')
        .select('*')
        .order('id', { ascending: true });

      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      const progressMap = {};
      progressData?.forEach(p => {
        progressMap[p.lesson_id] = p.is_completed;
      });

      setLessons(lessonsData || []);
      setUserProgress(progressMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <RefreshCw className="text-cyan-500 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <MobileLayout withNav={true}>
      {/* HEADER - Фиксированный сверху внутри Layout */}
      <header className="p-6 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-30">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white">
          Course <span className="text-cyan-400">Map</span>
        </h1>
      </header>

      {/* MAP CONTENT - Прокручиваемая область */}
      <div className="p-6 space-y-12">
        {COURSE_LEVELS.map((level, idx) => {
          const levelLessons = lessons.filter(l => l.id >= level.range[0] && l.id <= level.range[1]);
          if (levelLessons.length === 0) return null;

          return (
            <section key={idx} className="space-y-6">
              <div className={`p-6 rounded-[2rem] border ${level.border} bg-gradient-to-b ${level.bg}`}>
                <div className="flex items-center gap-3 mb-2">
                   <Layers size={18} className={level.color} />
                   <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${level.color}`}>
                    {level.title}
                  </h2>
                </div>
                <p className="text-gray-400 text-sm italic leading-tight">{level.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {levelLessons.map((lesson) => {
                  const isCompleted = userProgress[lesson.id];
                  // Простая логика блокировки: урок 1 открыт всегда, остальные — если пройден предыдущий
                  const isLocked = lesson.id > 1 && !userProgress[lesson.id - 1];

                  return (
                    <button
                      key={lesson.id}
                      disabled={isLocked}
                      onClick={() => navigate(`/lesson/${lesson.id}/preview`)}
                      className={`group relative flex items-center gap-5 p-5 rounded-3xl border transition-all active:scale-95
                        ${isCompleted
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : isLocked
                            ? 'bg-gray-900/20 border-white/5 opacity-50'
                            : 'bg-gray-900/40 border-white/10 hover:border-cyan-500/50'}`}
                    >
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110
                        ${isCompleted ? 'bg-emerald-500 text-black' : isLocked ? 'bg-gray-800 text-gray-600' : 'bg-white text-black'}`}>
                        {isCompleted ? <Check size={28} strokeWidth={3} /> : isLocked ? <Lock size={24} /> : <Play size={24} fill="currentColor" />}
                      </div>

                      <div className="text-left">
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest block mb-1">Lesson {lesson.id}</span>
                        <h3 className="text-lg font-black text-white leading-tight uppercase italic">{lesson.title}</h3>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </MobileLayout>
  );
}