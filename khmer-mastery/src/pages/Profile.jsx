import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Gem, Target, BookOpen, Info, Trophy, Zap, Mail,
  LogOut, BookText, X, Globe
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [profile, setProfile] = useState(null);
  // Добавили rank и totalUsers в стейт
  const [stats, setStats] = useState({ uniqueWords: 0, mastered: 0, gems: 0, rank: 0, totalUsers: 0 });

  useEffect(() => { initProfile(); }, []);

  const initProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      setProfile(profileData);

      // 1. Загружаем статистику SRS
      const { data: srsData } = await supabase
        .from('user_srs_items')
        .select('interval, dictionary:dictionary_id(item_type)');

      const { count: lessonsCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('is_completed', true);

      const currentGems = (lessonsCount || 0) * 50;

      // 2. Считаем рейтинг (сколько людей имеют больше Гемов)
      const { count: usersAbove } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gt('total_gems', currentGems);

      const { count: allUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (srsData) {
        const validWords = srsData.filter(i => i.dictionary?.item_type === 'word' || i.dictionary?.item_type === 'phrase');
        setStats({
          uniqueWords: validWords.length,
          mastered: validWords.filter(i => i.interval > 7).length,
          gems: currentGems,
          rank: (usersAbove || 0) + 1,
          totalUsers: allUsers || 1
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-40 font-sans">
      {/* HEADER */}
      <header className="flex justify-between items-start mb-12 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
            <User size={32} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{profile?.username || 'Explorer'}</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">{profile?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLegend(true)} className="p-4 bg-gray-900 rounded-2xl border border-white/5 text-gray-500 hover:text-cyan-400"><Info size={22} /></button>
          <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500"><LogOut size={22} /></button>
        </div>
      </header>

      {/* STATS GRID: Гемы и Рейтинг */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-gray-900/40 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Gem className="text-emerald-500/10 absolute -top-4 -right-4" size={90} />
          <div className="text-3xl font-black mb-1">{stats.gems}</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Gems</div>
        </div>

        <div className="bg-gray-900/40 border border-cyan-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Globe className="text-cyan-500/10 absolute -top-4 -right-4" size={90} />
          <div className="text-3xl font-black mb-1">#{stats.rank}</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Global Rank</div>
        </div>
      </div>

      {/* B1 PROGRESS */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-4">
        <h3 className="text-lg font-bold italic uppercase mb-8 flex items-center gap-2">
           <Trophy size={18} className="text-yellow-500" /> B1 Vocab Progress
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between items-end font-black italic">
            <span className="text-4xl tracking-tighter">{stats.uniqueWords} <span className="text-sm text-gray-800 not-italic">/ 3000</span></span>
            <span className="text-[10px] text-cyan-500 uppercase">{Math.round((stats.uniqueWords / 3000) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
             <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-1000" style={{ width: `${(stats.uniqueWords / 3000) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] font-bold text-gray-700 uppercase tracking-[0.2em]">
        You are in the top {Math.round((stats.rank / stats.totalUsers) * 100)}% of students
      </p>

      {/* NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[3rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-gray-500"><BookOpen size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Map</span></button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-gray-500"><BookText size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Vocab</span></button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-cyan-400"><User size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Profile</span></button>
      </div>
    </div>
  );
}