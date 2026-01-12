import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  LogOut, User, Gem, Award, BookOpen, TrendingUp,
  Map as MapIcon, BookText, Trophy, Flame, Target,
  ChevronRight, Crown, Zap, PlayCircle
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ learned: 0, total: 0, gems: 0, streak: 3 });
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return navigate('/login');

      const { count: totalInApp } = await supabase.from('lesson_items').select('*', { count: 'exact', head: true }).eq('type', 'vocab_card');
      const { count: userLearned } = await supabase.from('user_srs_items').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
      const { data: prog } = await supabase.from('user_progress').select('lesson_id').eq('user_id', user.id).eq('is_completed', true);
      const { data: leaders } = await supabase.rpc('get_leaderboard');

      setStats({
        learned: userLearned || 0,
        total: totalInApp || 0,
        gems: (prog?.length || 0) * 50,
        streak: 3 // В будущем добавим расчет из БД
      });
      setLeaderboard(leaders || []);
    } finally { setLoading(false); }
  };

  const progressPercent = stats.total > 0 ? Math.round((stats.learned / stats.total) * 100) : 0;

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 italic font-black">SYNCING...</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-40 font-sans selection:bg-cyan-500/30">
      {/* Согласованная ширина контейнера (max-w-xl) */}
      <div className="max-w-xl mx-auto px-6">

        {/* HERO SECTION: Streak & Daily Goal */}
        <div className="pt-12 mb-10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="text-6xl animate-bounce-subtle select-none">🔥</div>
              <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full w-8 h-8 flex items-center justify-center font-black text-lg shadow-lg shadow-orange-500/40">
                {stats.streak}
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none mb-1">STREAK</h1>
              <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Don't break the chain!</p>
            </div>
          </div>
          <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} className="p-3 bg-gray-900/50 rounded-xl border border-white/5 text-gray-600"><LogOut size={18} /></button>
        </div>

        {/* OVERALL MASTERY: С микро-целью */}
        <div className="bg-gray-900/40 border border-white/5 p-8 rounded-[2.5rem] mb-8 relative overflow-hidden">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-500 mb-1 leading-none">Overall Mastery</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase italic">
                {stats.learned < 5 ? `Complete ${5 - stats.learned} more words to reach 5%` : 'Keep it up!'}
              </p>
            </div>
            <span className="text-4xl font-black italic leading-none">{progressPercent}%</span>
          </div>
          <div className="relative h-3 bg-black rounded-full overflow-hidden border border-white/5">
            <div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${Math.max(progressPercent, 2)}%` }}
            />
          </div>
          <button onClick={() => navigate('/map')} className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all">
            <PlayCircle size={18} /> Continue Learning
          </button>
        </div>

        {/* STATS GRID: Gems & Categories */}
        <div className="grid grid-cols-1 gap-6 mb-10">
          {/* GEMS & SHOP TEASER */}
          <div className="bg-gradient-to-br from-emerald-900/20 to-cyan-900/20 p-8 rounded-[2.5rem] border border-emerald-500/20">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-5xl font-black italic leading-none">{stats.gems}</div>
                <div className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mt-1">Gems Balance</div>
              </div>
              <div className="text-6xl opacity-30 select-none">💎</div>
            </div>
            <div className="bg-black/40 p-4 rounded-2xl border border-emerald-500/10">
              <p className="text-[10px] text-gray-500 uppercase font-black mb-2 tracking-widest">Next unlock:</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-200 italic">Skip Waiting Time</span>
                <span className="text-emerald-400 font-black flex items-center gap-1">50 <Gem size={12} fill="currentColor" /></span>
              </div>
            </div>
          </div>

          {/* WORDS BY CATEGORY */}
          <div className="bg-gray-900/30 border border-white/5 p-8 rounded-[2.5rem]">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-6">Progress by category</h4>
            <div className="space-y-6">
              {[
                {name: 'Greetings', done: stats.learned > 10 ? 10 : stats.learned, total: 15, color: 'cyan', icon: '🙏'},
                {name: 'Survival', done: 0, total: 25, color: 'orange', icon: '📍'},
                {name: 'Food', done: 0, total: 20, color: 'purple', icon: '🍲'},
              ].map(cat => (
                <div key={cat.name} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black/40 rounded-2xl flex items-center justify-center text-xl border border-white/5">{cat.icon}</div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-black italic uppercase text-[10px] tracking-wider">{cat.name}</span>
                      <span className="text-[10px] text-gray-600 font-black">{cat.done}/{cat.total}</span>
                    </div>
                    <div className="h-1.5 bg-black rounded-full overflow-hidden">
                      <div className={`h-full bg-${cat.color}-500 transition-all duration-700`} style={{width: `${(cat.done/cat.total)*100}%`}} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LEADERBOARD & CHALLENGE */}
        <div className="bg-gradient-to-br from-purple-900/10 to-pink-900/10 p-8 rounded-[3rem] border border-purple-500/10 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="text-yellow-500" size={24} />
            <h3 className="font-black uppercase tracking-tighter text-xl italic">Leaderboard</h3>
          </div>
          <div className="space-y-3">
            {leaderboard.slice(0, 3).map((u, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-black/30 rounded-2xl border border-white/5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${i === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-800 text-gray-500'}`}>{i+1}</div>
                <div className="flex-1 text-xs font-bold text-gray-400">{u.username.split('@')[0]}</div>
                <div className="text-xs font-black italic text-cyan-400">{u.words_count} XP</div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/20 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Your Rank:</span>
            <span className="font-black text-2xl text-cyan-400 italic">#147</span>
          </div>
        </div>

        {/* PREMIUM TEASER (Commercial Strategy) */}
        <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 p-8 rounded-[3rem] border-2 border-yellow-500/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-yellow-500/20 rounded-2xl"><Crown className="text-yellow-500" size={32} /></div>
            <div>
              <h3 className="font-black text-xl italic uppercase tracking-tighter">Go Premium</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Unlimited hearts & ad-free</p>
            </div>
          </div>
          <button className="w-full py-5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-500/20 active:scale-95 transition-all">
            Try 7 Days Free
          </button>
        </div>

      </div>

      {/* Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/5 px-10 pt-5 pb-10 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[3rem]">
        <button onClick={() => navigate('/map')} className="text-gray-600 flex flex-col items-center gap-2 group"><MapIcon size={24} /><span className="text-[10px] font-black uppercase">Explore</span></button>
        <button onClick={() => navigate('/vocab')} className="text-gray-600 flex flex-col items-center gap-2 group"><BookText size={24} /><span className="text-[10px] font-black uppercase">Words</span></button>
        <button onClick={() => navigate('/profile')} className="text-cyan-400 flex flex-col items-center gap-2 outline-none"><User size={24} /><span className="text-[10px] font-black uppercase">Me</span></button>
      </div>
    </div>
  );
}