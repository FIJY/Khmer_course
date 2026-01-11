import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Gem, Target, BookOpen, Info, Trophy, Zap,
  ChevronRight, X, Award, TrendingUp
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSeen: 0,
    mastered: 0,
    gems: 0,
    lessonsDone: 0,
    reviewCount: 0
  });
  const [showLegend, setShowLegend] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // 1. Считаем УНИКАЛЬНЫЕ слова из твоего словаря SRS
      const { data: srsData } = await supabase
        .from('user_srs_items')
        .select('interval')
        .eq('user_id', user.id);

      // 2. Считаем пройденные уроки для начисления Гемов
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('is_completed')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      // 3. Считаем слова, которые пора повторить сегодня
      const { data: dueData } = await supabase
        .from('user_srs_items')
        .select('id')
        .lte('next_review', new Date().toISOString())
        .eq('user_id', user.id);

      if (srsData) {
        setStats({
          totalSeen: srsData.length, // Тот самый счетчик из 3000
          mastered: srsData.filter(i => i.interval > 7).length, // Выученные (интервал > 7 дней)
          lessonsDone: progressData?.length || 0,
          gems: (progressData?.length || 0) * 50, // Базовые гемы за уроки
          reviewCount: dueData?.length || 0
        });
      }
    } catch (error) {
      console.error('Stats error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic tracking-widest uppercase">Loading Stats...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-36 font-sans">

      {/* ЛЕГЕНДА: ЭКОНОМИКА ГЕМОВ (Модальное окно) */}
      {showLegend && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] p-8 flex items-center justify-center animate-in fade-in duration-300"
          onClick={() => setShowLegend(false)}
        >
          <div
            className="bg-gray-900 border border-white/10 p-8 rounded-[3rem] max-w-sm w-full relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowLegend(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black mb-6 italic uppercase tracking-tighter text-cyan-400">Gem Economy</h2>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">How to earn:</p>
                <ul className="space-y-3">
                  <li className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-300">New Lesson</span>
                    <span className="text-emerald-400">+50 💎</span>
                  </li>
                  <li className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-300">Perfect Quiz</span>
                    <span className="text-emerald-400">+20 💎</span>
                  </li>
                  <li className="flex justify-between items-center text-sm font-bold">
                    <span className="text-gray-300">Smart Review</span>
                    <span className="text-emerald-400">+1 💎 / word</span>
                  </li>
                </ul>
              </div>
              <p className="text-[10px] text-gray-600 leading-relaxed italic border-t border-white/5 pt-4">
                Note: Re-taking a finished lesson only gives +5 💎 to prevent farming.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex justify-between items-start mb-10 mt-4">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Your <span className="text-cyan-400">Stats</span></h1>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest mt-2 italic">Level: Bronze Explorer</p>
        </div>
        <button
          onClick={() => setShowLegend(true)}
          className="p-4 bg-gray-900 rounded-[1.5rem] border border-white/5 text-gray-500 hover:text-cyan-400 transition-colors shadow-lg"
        >
          <Info size={22} />
        </button>
      </header>

      {/* SMART REVIEW BUTTON */}
      {stats.reviewCount > 0 && (
        <button
          onClick={() => navigate('/review')}
          className="w-full mb-8 py-6 bg-emerald-500 text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Zap size={18} fill="currentColor" />
          Review Needed ({stats.reviewCount})
        </button>
      )}

      {/* MAIN STATS GRID */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/40 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden group">
          <Gem className="text-emerald-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black text-white mb-1 leading-none">{stats.gems}</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Gems</div>
        </div>

        <div className="bg-gray-900/40 border border-cyan-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Target className="text-cyan-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black text-white mb-1 leading-none">{stats.mastered}</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Mastered</div>
        </div>
      </div>

      {/* LEADERBOARD */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold flex items-center gap-2 italic uppercase tracking-tight">
            <Trophy size={20} className="text-yellow-500" /> Leaderboard
          </h3>
          <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Global Rank</span>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20">
            <div className="flex items-center gap-4">
              <span className="font-black italic text-cyan-400 text-lg">#1</span>
              <span className="font-bold text-sm tracking-tight">You (Master)</span>
            </div>
            <span className="font-black text-emerald-400">{stats.gems} 💎</span>
          </div>
          <div className="flex justify-between items-center p-4 opacity-30 px-6">
            <div className="flex items-center gap-4">
              <span className="font-black italic text-gray-500">#2</span>
              <span className="text-sm font-medium">Dara_PNH</span>
            </div>
            <span className="font-black text-xs">150 💎</span>
          </div>
        </div>
      </div>

      {/* VOCABULARY ENGINE */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold italic uppercase tracking-tight">Vocabulary Progress</h3>
            <p className="text-[10px] text-gray-700 font-black uppercase tracking-[0.2em] mt-1">Goal: 3000 Words (B1 Level)</p>
          </div>
          <BookOpen className="text-gray-800" size={24} />
        </div>

        <div className="space-y-5">
          <div className="flex justify-between items-end">
            <span className="text-4xl font-black italic tracking-tighter">
              {stats.totalSeen} <span className="text-sm text-gray-800 not-italic font-bold">/ 3000</span>
            </span>
            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">
              {Math.round((stats.totalSeen / 3000) * 100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-white/5">
             <div
               className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-1000 ease-out"
               style={{ width: `${(stats.totalSeen / 3000) * 100}%` }}
             ></div>
          </div>
        </div>
      </div>

      {/* FOOTER NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <BookOpen size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
          <BookText size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Vocab</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-cyan-400">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
}