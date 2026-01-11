import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Award, BookOpen, Target, Map as MapIcon, BookText } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalSeen: 0, mastered: 0, gems: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Считаем слова из SRS
    const { data: srsData } = await supabase
      .from('user_srs_items')
      .select('interval')
      .eq('user_id', user.id);

    // 2. Считаем пройденные уроки для очков
    const { data: progressData } = await supabase
      .from('user_progress')
      .select('is_completed')
      .eq('user_id', user.id)
      .eq('is_completed', true);

    if (srsData) {
      setStats({
        totalSeen: srsData.length,
        mastered: srsData.filter(i => i.interval > 7).length, // Мастер — интервал > 7 дней
        gems: (progressData?.length || 0) * 50 // Например, 50 камней за урок
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-6 pb-32">
      <h1 className="text-4xl font-black mb-10 tracking-tighter uppercase italic">Your <span className="text-cyan-400">Progress</span></h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/40 border border-white/5 p-6 rounded-[2.5rem]">
          <Award className="text-emerald-400 mb-4" size={32} />
          <div className="text-3xl font-black">{stats.gems}</div>
          <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Gems Earned</div>
        </div>
        <div className="bg-gray-900/40 border border-white/5 p-6 rounded-[2.5rem]">
          <Target className="text-cyan-400 mb-4" size={32} />
          <div className="text-3xl font-black">{stats.mastered}</div>
          <div className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Words Mastered</div>
        </div>
      </div>

      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Vocabulary Stats</h3>
          <BookOpen className="text-gray-700" size={20} />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500 font-medium">Total words seen:</span>
            <span className="font-bold">{stats.totalSeen}</span>
          </div>
          <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden">
             <div className="h-full bg-cyan-500" style={{ width: `${(stats.totalSeen / 3000) * 100}%` }}></div>
          </div>
          <p className="text-[10px] text-gray-700 font-bold uppercase tracking-widest">Goal: 3000 words (B1 level)</p>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-gray-500">
          <MapIcon size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Map</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-gray-500">
          <BookText size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Vocab</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-cyan-400">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Profile</span>
        </button>
      </div>
    </div>
  );
}