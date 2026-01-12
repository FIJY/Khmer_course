import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  LogOut, User, Gem, Award, BookOpen,
  TrendingUp, Map as MapIcon, BookText,
  Trophy, Flame, Target, ChevronRight
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    learned: 0, total: 0, gems: 0, streak: 3 // Streak пока захардкодим для теста
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [weakWords, setWeakWords] = useState([]);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      // 1. Статистика слов
      const { count: totalCount } = await supabase.from('lesson_items').select('*', { count: 'exact', head: true }).eq('type', 'vocab_card');
      const { count: learnedCount } = await supabase.from('user_srs').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { data: prog } = await supabase.from('user_progress').select('lesson_id').eq('user_id', user.id).eq('is_completed', true);

      // 2. Слабые слова (SRS < 2.0)
      const { data: weak } = await supabase.from('user_srs')
        .select('lesson_items(data)').eq('user_id', user.id).lt('easiness', 2.0).limit(3);

      // 3. Рейтинг (вызов SQL функции)
      const { data: leaders } = await supabase.rpc('get_leaderboard');

      setStats({
        learned: learnedCount || 0,
        total: totalCount || 0,
        gems: (prog?.length || 0) * 50,
        streak: 3
      });
      setWeakWords(weak?.map(w => w.lesson_items.data.front) || []);
      setLeaderboard(leaders || []);
    } finally { setLoading(false); }
  };

  const progress = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-black text-white pb-40 font-sans max-w-4xl mx-auto px-6">

      {/* Header */}
      <div className="pt-12 mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-5xl font-black italic uppercase tracking-tighter italic">DASHBOARD</h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1 text-orange-500 font-black italic text-sm">
              <Flame size={16} fill="currentColor" /> {stats.streak} DAY STREAK
            </div>
          </div>
        </div>
        <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} className="p-4 bg-gray-900/50 rounded-2xl border border-white/5 text-gray-500"><LogOut size={20} /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Main Progress */}
        <div className="md:col-span-2 bg-gray-900/30 border border-white/5 p-10 rounded-[3rem] relative overflow-hidden">
          <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-cyan-500 mb-2">Overall Mastery</h4>
              <div className="text-5xl font-black italic">{progress}%</div>
            </div>
            <div className="text-right text-[10px] font-black uppercase text-gray-600 tracking-widest">
              {stats.learned} / {stats.total} WORDS
            </div>
          </div>
          <div className="h-4 bg-black rounded-full overflow-hidden border border-white/5"><div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${progress}%` }} /></div>
        </div>

        {/* Gems */}
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-10 rounded-[3rem] flex flex-col items-center justify-center text-center">
          <Gem className="text-emerald-500 mb-2" size={40} fill="currentColor" />
          <div className="text-3xl font-black italic">{stats.gems}</div>
          <div className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Gems Balance</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weakest Words (Retention Idea) */}
        <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-[3rem]">
          <div className="flex items-center gap-3 mb-6">
            <Target className="text-red-500" size={20} />
            <h4 className="text-xs font-black uppercase tracking-widest">Needs Practice</h4>
          </div>
          <div className="space-y-3">
            {weakWords.length > 0 ? weakWords.map(word => (
              <div key={word} className="bg-black/40 p-4 rounded-2xl border border-white/5 flex justify-between items-center group">
                <span className="font-bold text-gray-300 italic">{word}</span>
                <ChevronRight size={16} className="text-red-500 opacity-50 group-hover:translate-x-1 transition-transform" />
              </div>
            )) : <p className="text-gray-600 text-[10px] italic uppercase">You're doing great! No weak words found.</p>}
          </div>
        </div>

        {/* Leaderboard (Competition Idea) */}
        <div className="bg-gray-900/30 border border-white/5 p-8 rounded-[3rem]">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-yellow-500" size={20} />
            <h4 className="text-xs font-black uppercase tracking-widest">Global Top 5</h4>
          </div>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((entry, i) => (
              <div key={i} className="flex justify-between items-center p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500'}`}>{i + 1}</span>
                  <span className="text-xs font-bold text-gray-400 truncate max-w-[100px]">{entry.username.split('@')[0]}</span>
                </div>
                <span className="text-xs font-black italic text-cyan-400">{entry.words_count} words</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/5 px-10 pt-5 pb-10 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[3rem]">
        <button onClick={() => navigate('/map')} className="text-gray-600 flex flex-col items-center gap-2 group"><MapIcon size={26} /><span className="text-[10px] font-black uppercase">Explore</span></button>
        <button onClick={() => navigate('/vocab')} className="text-gray-600 flex flex-col items-center gap-2 group"><BookText size={26} /><span className="text-[10px] font-black uppercase">Words</span></button>
        <button onClick={() => navigate('/profile')} className="text-cyan-400 flex flex-col items-center gap-2 outline-none"><User size={26} /><span className="text-[10px] font-black uppercase">Me</span></button>
      </div>
    </div>
  );
}