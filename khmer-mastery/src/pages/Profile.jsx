import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User,
  Award,
  BookOpen,
  Target,
  Map as MapIcon,
  BookText,
  TrendingUp,
  Zap
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSeen: 0, mastered: 0, gems: 0, lessonsDone: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // 1. Получаем данные из SRS (выученные слова)
      const { data: srsData } = await supabase
        .from('user_srs_items')
        .select('interval')
        .eq('user_id', user.id);

      // 2. Получаем прогресс по урокам
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('is_completed')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (srsData) {
        setStats({
          totalSeen: srsData.length,
          // Считаем слово "выученным", если интервал повторения больше 7 дней
          mastered: srsData.filter(i => i.interval > 7).length,
          lessonsDone: progressData?.length || 0,
          gems: (progressData?.length || 0) * 50 // Даем 50 гемов за каждый пройденный урок
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 pb-32">
      {/* Header */}
      <header className="mb-10 mt-4">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
          Your <span className="text-cyan-400">Profile</span>
        </h1>
        <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Personal Achievement Dashboard</p>
      </header>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/40 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Zap className="text-emerald-400" size={40} />
          </div>
          <div className="text-3xl font-black text-white mb-1">{stats.gems}</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gems Earned</div>
        </div>

        <div className="bg-gray-900/40 border border-white/5 p-6 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Target className="text-cyan-400" size={40} />
          </div>
          <div className="text-3xl font-black text-white mb-1">{stats.mastered}</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Words Mastered</div>
        </div>
      </div>

      {/* Vocabulary Progress Card */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold">Vocabulary Goal</h3>
            <p className="text-xs text-gray-500 font-medium">Progress towards B1 Level</p>
          </div>
          <BookOpen className="text-gray-700" size={24} />
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end">
            <span className="text-3xl font-black italic">{stats.totalSeen} <span className="text-sm text-gray-700 not-italic">/ 3000</span></span>
            <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">
              {Math.round((stats.totalSeen / 3000) * 100)}% Complete
            </span>
          </div>

          <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-white/5">
             <div
               className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-1000"
               style={{ width: `${(stats.totalSeen / 3000) * 100}%` }}
             ></div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-5 bg-gray-900/40 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <Award size={20} />
            </div>
            <span className="text-sm font-bold text-gray-300">Lessons Completed</span>
          </div>
          <span className="font-black text-xl">{stats.lessonsDone}</span>
        </div>

        <div className="flex items-center justify-between p-5 bg-gray-900/40 border border-white/5 rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm font-bold text-gray-300">Current Streak</span>
          </div>
          <span className="font-black text-xl">1 Day</span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors">
          <MapIcon size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-colors">
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