import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Gem, Target, BookOpen, Info, Trophy, Zap, ChevronRight
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSeen: 0, mastered: 0, gems: 0, lessonsDone: 0, reviewCount: 0 });
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: srsData } = await supabase.from('user_srs_items').select('interval').eq('user_id', user.id);
    const { data: progressData } = await supabase.from('user_progress').select('is_completed').eq('user_id', user.id).eq('is_completed', true);
    const { data: dueData } = await supabase.from('user_srs_items').select('id').lte('next_review', new Date().toISOString()).eq('user_id', user.id);

    if (srsData) {
      setStats({
        totalSeen: srsData.length, // Уникальные слова из базы
        mastered: srsData.filter(i => i.interval > 7).length, // Интервал > 7 дней
        lessonsDone: progressData?.length || 0,
        gems: (progressData?.length || 0) * 50, // Начисление за уроки
        reviewCount: dueData?.length || 0
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-36 font-sans">
      {/* Legend Modal */}
      {showLegend && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] p-8 flex items-center justify-center">
          <div className="bg-gray-900 border border-white/10 p-8 rounded-[3rem] max-w-sm w-full relative">
            <button onClick={() => setShowLegend(false)} className="absolute top-6 right-6 text-gray-500"><X /></button>
            <h2 className="text-2xl font-black mb-6 italic uppercase tracking-tighter text-cyan-400">Gem Economy</h2>
            <ul className="space-y-4 text-sm text-gray-400">
              <li className="flex justify-between"><span>New Lesson</span> <span className="text-emerald-400 font-bold">+50 💎</span></li>
              <li className="flex justify-between"><span>Smart Review</span> <span className="text-emerald-400 font-bold">+1 💎/word</span></li>
              <li className="flex justify-between"><span>Daily Streak</span> <span className="text-emerald-400 font-bold">+10 💎/day</span></li>
              <li className="flex justify-between"><span>Perfect Quiz</span> <span className="text-emerald-400 font-bold">+20 💎</span></li>
            </ul>
          </div>
        </div>
      )}

      <header className="flex justify-between items-start mb-8">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Your <span className="text-cyan-400">Stats</span></h1>
        <button onClick={() => setShowLegend(true)} className="p-3 bg-gray-900 rounded-2xl border border-white/5 text-gray-500"><Info size={20}/></button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/40 border border-emerald-500/20 p-6 rounded-[2.5rem]">
          <Gem className="text-emerald-500 mb-2" size={24} />
          <div className="text-3xl font-black tracking-tighter">{stats.gems}</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Gems</div>
        </div>
        <div className="bg-gray-900/40 border border-cyan-500/20 p-6 rounded-[2.5rem]">
          <Target className="text-cyan-500 mb-2" size={24} />
          <div className="text-3xl font-black tracking-tighter">{stats.mastered}</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Mastered Words</div>
        </div>
      </div>

      {/* Leaderboard Mockup */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2"><Trophy size={20} className="text-yellow-500"/> Bronze League</h3>
          <span className="text-[10px] font-black text-gray-600 uppercase">Top 10%</span>
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
            <div className="flex items-center gap-3">
              <span className="font-black italic text-cyan-400">#1</span>
              <span className="font-bold">You (Master)</span>
            </div>
            <span className="font-black text-emerald-400">{stats.gems} 💎</span>
          </div>
          <div className="flex justify-between items-center p-3 opacity-40">
            <div className="flex items-center gap-3">
              <span className="font-black italic">#2</span>
              <span>Dara_Khmer</span>
            </div>
            <span className="font-black">150 💎</span>
          </div>
        </div>
      </div>

      {/* Vocabulary Progress */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem]">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700 mb-6 italic">Vocabulary Engine</h3>
        <div className="flex justify-between items-end mb-4">
          <span className="text-4xl font-black italic">{stats.totalSeen} <span className="text-sm text-gray-800 not-italic">/ 3000</span></span>
        </div>
        <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-cyan-500" style={{ width: `${(stats.totalSeen / 3000) * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
}