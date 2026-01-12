import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Path to your unified client
import {
  LogOut,
  User,
  Gem,
  Award,
  BookOpen,
  TrendingUp,
  Settings
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    learnedWords: 0,
    totalWordsInApp: 0,
    completedLessons: 0,
    gems: 0
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUser(user);

      // 1. Count REAL total vocabulary cards in the database
      const { count: totalCount } = await supabase
        .from('lesson_items')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'vocab_card');

      // 2. Count words the user has started learning (SRS entries)
      const { count: userLearnedCount } = await supabase
        .from('user_srs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // 3. Get completed lessons for Gem calculation
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      const completedCount = progressData ? progressData.length : 0;

      setStats({
        learnedWords: userLearnedCount || 0,
        totalWordsInApp: totalCount || 0,
        completedLessons: completedCount,
        gems: completedCount * 50
      });

    } catch (e) {
      console.error("Profile fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return (
    <div className="h-[100dvh] bg-black flex items-center justify-center text-cyan-400 font-black italic uppercase tracking-widest">
      Loading Profile...
    </div>
  );

  const b1Progress = Math.min(Math.round((stats.learnedWords / 3000) * 100), 100);

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans selection:bg-cyan-500/30">
      {/* Header */}
      <div className="p-8 pt-12 flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">
            Explorer <span className="text-cyan-400">Profile</span>
          </h1>
          <p className="text-gray-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
            <User size={12} /> {user?.email}
          </p>
        </div>
        <button onClick={handleLogout} className="p-4 bg-gray-900 rounded-2xl border border-white/5 text-gray-500 hover:text-red-400 transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      <div className="px-8 space-y-8">
        {/* Real-time Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/40 p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-3xl font-black italic text-cyan-400 mb-1 leading-none">{stats.learnedWords}</div>
              <div className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Words Learned</div>
            </div>
            <TrendingUp className="absolute -right-2 -bottom-2 text-white/5 group-hover:text-cyan-500/10 transition-colors" size={80} />
          </div>

          <div className="bg-gray-900/40 p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-3xl font-black italic text-white mb-1 leading-none">{stats.totalWordsInApp}</div>
              <div className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Words In App</div>
            </div>
            <BookOpen className="absolute -right-2 -bottom-2 text-white/5 group-hover:text-white/10 transition-colors" size={80} />
          </div>
        </div>

        {/* B1 Proficiency Progress Bar */}
        <div className="bg-gray-900/40 border border-white/5 p-8 rounded-[3rem]">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-cyan-500 mb-1">B1 Proficiency</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase italic">Goal: 3,000 words</p>
            </div>
            <span className="text-2xl font-black italic text-white">{b1Progress}%</span>
          </div>
          <div className="h-3 bg-black rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div
              className="h-full bg-cyan-500 transition-all duration-1000 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              style={{ width: `${b1Progress}%` }}
            />
          </div>
        </div>

        {/* Achievements / Rewards */}
        <div className="bg-gray-900/40 border border-white/5 p-8 rounded-[3rem] flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <Gem className="text-emerald-500 fill-emerald-500/20" size={32} />
            </div>
            <div>
              <div className="text-2xl font-black italic leading-none mb-1">{stats.gems}</div>
              <div className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Total Gems Earned</div>
            </div>
          </div>
          <Award className="text-emerald-500 opacity-20" size={40} />
        </div>
      </div>

      {/* Navigation Bar: Matching CourseMap */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/5 px-10 pt-5 pb-10 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[3rem]">
        <button onClick={() => navigate('/map')} className="text-gray-600 flex flex-col items-center gap-2 group">
          <MapIcon size={26} className="group-active:scale-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Explore</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="text-gray-600 flex flex-col items-center gap-2 group hover:text-gray-300">
          <BookText size={26} className="group-active:scale-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Words</span>
        </button>
        <button onClick={() => navigate('/profile')} className="text-cyan-400 flex flex-col items-center gap-2 outline-none">
          <User size={26} />
          <span className="text-[10px] font-black uppercase tracking-widest">Me</span>
        </button>
      </div>
    </div>
  );
}