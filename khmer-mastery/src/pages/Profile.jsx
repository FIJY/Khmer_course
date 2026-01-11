import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Gem, Target, BookOpen, Info, Trophy, Zap,
  X, Award, TrendingUp, Edit3, CheckCircle2
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [stats, setStats] = useState({ totalSeen: 0, mastered: 0, gems: 0, lessonsDone: 0, reviewCount: 0 });

  useEffect(() => { fetchProfileAndStats(); }, []);

  const fetchProfileAndStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // 1. Получаем никнейм из таблицы profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile) setNickname(profile.username);
      else setIsEditingName(true); // Если имени нет, заставляем выбрать

      // 2. Загружаем статистику (как раньше)
      const { data: srsData } = await supabase.from('user_srs_items').select('interval').eq('user_id', user.id);
      const { data: progressData } = await supabase.from('user_progress').select('is_completed').eq('user_id', user.id).eq('is_completed', true);
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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveNickname = async () => {
    if (!nickname || nickname.length < 3) return;
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, username: nickname, updated_at: new Date() });

    if (!error) setIsEditingName(false);
    else alert("This name is already taken or invalid.");
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black tracking-widest uppercase">Syncing...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-36 font-sans">

      {/* МОДАЛКА ВЫБОРА ИМЕНИ */}
      {isEditingName && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] p-8 flex flex-col items-center justify-center animate-in fade-in">
          <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.1)]">
            <User size={40} className="text-cyan-400" />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-center">Establish your <span className="text-cyan-400">Identity</span></h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-10">This name will appear on the Leaderboard</p>

          <div className="w-full max-w-xs relative">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-0_]/g, ''))}
              placeholder="NICKNAME_EX"
              className="w-full bg-gray-900/50 border-2 border-white/5 rounded-2xl py-5 px-6 text-xl font-bold focus:border-cyan-500 outline-none transition-all tracking-tight"
              maxLength={15}
            />
          </div>
          <button
            onClick={saveNickname}
            className="mt-8 w-full max-w-xs py-5 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-xl shadow-cyan-500/20"
          >
            Confirm Identity
          </button>
        </div>
      )}

      {/* HEADER С ИМЕНЕМ */}
      <header className="flex justify-between items-start mb-10 mt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{nickname || 'Unknown'}</h1>
            <button onClick={() => setIsEditingName(true)} className="text-gray-700 hover:text-cyan-400 transition-colors"><Edit3 size={16}/></button>
          </div>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest italic">Rank: Bronze Explorer</p>
        </div>
        <button onClick={() => setShowLegend(true)} className="p-4 bg-gray-900 rounded-[1.5rem] border border-white/5 text-gray-500 hover:text-cyan-400 transition-colors shadow-lg"><Info size={22} /></button>
      </header>

      {/* Дальше идут Stats Cards и Leaderboard (как в прошлом ответе)... */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/40 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Gem className="text-emerald-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black text-white mb-1 leading-none">{stats.gems}</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">Gems Earned</div>
        </div>
        <div className="bg-gray-900/40 border border-cyan-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Target className="text-cyan-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black text-white mb-1 leading-none">{stats.mastered}</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest flex items-center gap-1">Mastered</div>
        </div>
      </div>

      {/* КНОПКА SMART REVIEW */}
      {stats.reviewCount > 0 && (
        <button
          onClick={() => navigate('/review')}
          className="w-full mb-8 py-6 bg-emerald-500 text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Zap size={18} fill="currentColor" />
          Review Required ({stats.reviewCount})
        </button>
      )}

      {/* LEADERBOARD (Отображает твое имя) */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold flex items-center gap-2 italic uppercase tracking-tight">
            <Trophy size={20} className="text-yellow-500" /> Leaderboard
          </h3>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.05)]">
            <div className="flex items-center gap-4">
              <span className="font-black italic text-cyan-400 text-lg">#1</span>
              <span className="font-bold text-sm tracking-tight">{nickname} (You)</span>
            </div>
            <span className="font-black text-emerald-400">{stats.gems} 💎</span>
          </div>
          {/* Другие пользователи будут загружаться из базы позже */}
        </div>
      </div>

      {/* FOOTER NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-gray-500"><BookOpen size={24} /><span className="text-[10px] font-black uppercase">Map</span></button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-gray-500"><BookText size={24} /><span className="text-[10px] font-black uppercase">Vocab</span></button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-cyan-400"><User size={24} /><span className="text-[10px] font-black uppercase">Profile</span></button>
      </div>
    </div>
  );
}