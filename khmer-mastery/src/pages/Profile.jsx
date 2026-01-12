import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Map as MapIcon, BookText, LogOut,
  BrainCircuit, Trash2, Trophy, Flame, Zap, Target
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ email: '', joined: '' });
  const [stats, setStats] = useState({ lessons: 0, words: 0, gems: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // 1. Считаем уроки
      const { data: progress } = await supabase
        .from('user_progress').select('id').eq('user_id', user.id).eq('is_completed', true);

      // 2. Считаем слова
      const { data: words } = await supabase
        .from('user_srs').select('id').eq('user_id', user.id);

      const lessonsCount = progress?.length || 0;

      setProfile({
        email: user.email,
        joined: new Date(user.created_at).toLocaleDateString()
      });

      setStats({
        lessons: lessonsCount,
        words: words?.length || 0,
        gems: lessonsCount * 50 // 50 гемов за урок
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleResetProgress = async () => {
    if (confirm("⚠️ ARE YOU SURE? This will wipe all your progress permanently!")) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('user_progress').delete().eq('user_id', user.id);
      await supabase.from('user_srs').delete().eq('user_id', user.id);

      alert("Account reset to Level 0.");
      navigate('/map');
    }
  };

  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading Profile...</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans">

      {/* HEADER: Карточка пользователя */}
      <div className="p-6 pt-10 bg-gradient-to-b from-gray-900 to-black border-b border-white/5">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-500 p-[2px]">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <User size={32} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tight text-white">Student</h1>
            <p className="text-gray-500 text-xs font-bold tracking-widest mb-2">{profile.email}</p>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              {stats.gems > 500 ? 'Intermediate' : 'Beginner'} Level
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          {/* Gems */}
          <div className="bg-gray-900/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-2">
            <Trophy className="text-yellow-500" size={24} />
            <span className="text-2xl font-black text-white">{stats.gems}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Total Gems</span>
          </div>

          {/* Words */}
          <div className="bg-gray-900/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-2">
            <Zap className="text-cyan-500" size={24} />
            <span className="text-2xl font-black text-white">{stats.words}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Words Known</span>
          </div>

          {/* Lessons */}
          <div className="bg-gray-900/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-2">
            <Target className="text-emerald-500" size={24} />
            <span className="text-2xl font-black text-white">{stats.lessons}</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lessons Done</span>
          </div>

          {/* Streak (Пока фейковый, можно подключить позже) */}
          <div className="bg-gray-900/40 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-2">
            <Flame className="text-orange-500" size={24} />
            <span className="text-2xl font-black text-white">1</span>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Day Streak</span>
          </div>
        </div>

        {/* WEEKLY ACTIVITY (Визуализация) */}
        <div className="bg-gray-900/20 border border-white/5 p-6 rounded-3xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide">Weekly Focus</h3>
            <span className="text-xs text-gray-600 font-bold">Last 7 Days</span>
          </div>
          <div className="flex justify-between items-end h-24 px-2">
            {/* Столбики графика */}
            {[20, 45, 10, 80, 50, 30, 60].map((h, i) => (
              <div key={i} className="w-2 bg-gray-800 rounded-full relative group">
                <div
                  className="absolute bottom-0 w-full bg-cyan-500 rounded-full transition-all duration-1000 group-hover:bg-emerald-400"
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* SETTINGS AREA */}
        <div className="pt-4 space-y-3">
          <button onClick={handleResetProgress} className="w-full bg-red-900/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-4 group active:scale-95 transition-all">
            <div className="p-2 bg-red-500/10 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
              <Trash2 size={18} />
            </div>
            <span className="font-bold text-red-500 text-sm">Reset All Progress</span>
          </button>

          <button onClick={handleLogout} className="w-full bg-gray-900 border border-white/10 p-4 rounded-xl flex items-center gap-4 group active:scale-95 transition-all">
            <div className="p-2 bg-gray-800 rounded-lg text-gray-400 group-hover:text-white transition-colors">
              <LogOut size={18} />
            </div>
            <span className="font-bold text-gray-400 group-hover:text-white text-sm">Sign Out</span>
          </button>
        </div>

        <div className="pt-8 text-center pb-4">
          <p className="text-[9px] text-gray-800 font-black uppercase tracking-[0.3em]">Khmer Mastery 2026</p>
        </div>
      </div>

      {/* НИЖНЕЕ МЕНЮ (4 Кнопки) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/5 px-6 pt-4 pb-8 flex justify-between items-center z-50 max-w-lg mx-auto">
        <button onClick={() => navigate('/map')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <MapIcon size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Map</span>
        </button>

        <button onClick={() => navigate('/review')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <BrainCircuit size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Review</span>
        </button>

        <button onClick={() => navigate('/vocab')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <BookText size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Vocab</span>
        </button>

        {/* ACTIVE TAB */}
        <button onClick={() => navigate('/profile')} className="text-cyan-400 flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <User size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Me</span>
        </button>
      </div>
    </div>
  );
}