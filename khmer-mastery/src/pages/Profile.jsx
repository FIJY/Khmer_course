import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Gem, Target, BookOpen, Info, Trophy, Zap, Mail,
  X, Award, TrendingUp, Edit3, BookText, ChevronRight
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [stats, setStats] = useState({
    totalSeen: 0, mastered: 0, gems: 0, lessonsDone: 0, reviewCount: 0
  });

  useEffect(() => { fetchFullProfile(); }, []);

  const fetchFullProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      setUserEmail(user.email); // Почта из системы авторизации

      // 1. Получаем никнейм из нашей таблицы
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) setNickname(profile.username);

      // 2. Получаем статистику прогресса
      const { data: srsData } = await supabase.from('user_srs_items').select('interval').eq('user_id', user.id);
      const { data: progressData } = await supabase.from('user_progress').select('lesson_id').eq('user_id', user.id).eq('is_completed', true);
      const { data: dueData } = await supabase.from('user_srs_items').select('id').lte('next_review', new Date().toISOString()).eq('user_id', user.id);

      if (srsData) {
        setStats({
          totalSeen: srsData.length,
          mastered: srsData.filter(i => i.interval > 7).length,
          lessonsDone: progressData?.length || 0,
          gems: (progressData?.length || 0) * 50,
          reviewCount: dueData?.length || 0
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic">SYNCING DATA...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-36 font-sans">

      {/* HEADER: NICKNAME & EMAIL */}
      <header className="mb-10 mt-4 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/20">
            <User size={32} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{nickname || 'Anonymous'}</h1>
            <div className="flex items-center gap-2 mt-2 text-gray-500">
              <Mail size={12} />
              <span className="text-[10px] font-bold tracking-widest uppercase">{userEmail}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active Student</span>
           <span className="px-3 py-1 bg-gray-900 border border-white/5 rounded-full text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Rank #1</span>
        </div>
      </header>

      {/* STATS: GEMS & WORDS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/40 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden group">
          <Gem className="text-emerald-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black mb-1">{stats.gems}</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gems</div>
        </div>
        <div className="bg-gray-900/40 border border-cyan-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Target className="text-cyan-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black mb-1">{stats.mastered}</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Mastered</div>
        </div>
      </div>

      {/* PROGRESS TRACKER */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold italic uppercase tracking-tight">Overall Progress</h3>
            <p className="text-[10px] text-gray-700 font-black uppercase mt-1">Goal: B1 Proficiency (3k words)</p>
          </div>
          <BookOpen className="text-gray-800" size={24} />
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <span className="text-4xl font-black italic tracking-tighter">{stats.totalSeen} <span className="text-sm text-gray-800 not-italic font-bold">/ 3000</span></span>
            <span className="text-[10px] font-black text-cyan-500 uppercase">{Math.round((stats.totalSeen / 3000) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-white/5">
             <div className="h-full bg-cyan-500" style={{ width: `${(stats.totalSeen / 3000) * 100}%` }}></div>
          </div>
        </div>
      </div>

      {/* FOOTER NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1 text-gray-500"><BookOpen size={24} /><span className="text-[10px] font-black uppercase">Map</span></button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1 text-gray-500"><BookText size={24} /><span className="text-[10px] font-black uppercase">Vocab</span></button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-cyan-400"><User size={24} /><span className="text-[10px] font-black uppercase">Profile</span></button>
      </div>
    </div>
  );
}