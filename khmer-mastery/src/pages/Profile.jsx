import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Gem, Target, BookOpen, Info, Trophy, Zap,
  X, Award, TrendingUp, Edit3, BookText, ChevronRight
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [stats, setStats] = useState({
    totalSeen: 0, mastered: 0, gems: 0, lessonsDone: 0, reviewCount: 0
  });

  useEffect(() => { fetchProfileAndStats(); }, []);

  const fetchProfileAndStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      // Получаем никнейм
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (profile?.username) setNickname(profile.username);
      else setIsEditingName(true);

      // Загружаем статистику
      const { data: srsData } = await supabase.from('user_srs_items').select('interval').eq('user_id', user.id);
      const { data: progressData } = await supabase.from('user_progress').select('lesson_id').eq('user_id', user.id).eq('is_completed', true);
      const { data: dueData } = await supabase.from('user_srs_items').select('id').lte('next_review', new Date().toISOString()).eq('user_id', user.id);

      if (srsData) {
        setStats({
          totalSeen: srsData.length,
          mastered: srsData.filter(i => i.interval > 7).length, // Мастерство > 7 дней
          lessonsDone: progressData?.length || 0,
          gems: (progressData?.length || 0) * 50, // Начисление за уроки
          reviewCount: dueData?.length || 0
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const saveNickname = async () => {
    if (!nickname || nickname.length < 3) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('profiles').upsert({ id: user.id, username: nickname, updated_at: new Date().toISOString() });
      if (error) throw error;
      setIsEditingName(false);
    } catch (err) {
      alert("Error saving name. It might be taken."); // Ошибка уникальности
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black uppercase italic">Syncing...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-36 font-sans">
      {/* NICKNAME MODAL */}
      {isEditingName && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] p-8 flex flex-col items-center justify-center animate-in fade-in">
          <User size={40} className="text-cyan-400 mb-6" />
          <h2 className="text-3xl font-black italic uppercase mb-2">Identify <span className="text-cyan-400">Yourself</span></h2>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-10 text-center">Your name for the global leaderboard</p>
          <input
            type="text" value={nickname} onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-0_]/g, ''))}
            className="w-full max-w-xs bg-gray-900 border-2 border-white/5 rounded-2xl py-5 px-6 text-xl font-bold text-center outline-none focus:border-cyan-500"
            placeholder="NICKNAME"
          />
          <button onClick={saveNickname} className="mt-8 w-full max-w-xs py-5 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-widest active:scale-95">Confirm Identity</button>
        </div>
      )}

      {/* LEGEND MODAL */}
      {showLegend && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] p-8 flex items-center justify-center" onClick={() => setShowLegend(false)}>
          <div className="bg-gray-900 border border-white/10 p-8 rounded-[3rem] max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowLegend(false)} className="absolute top-6 right-6 text-gray-500"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-6 italic uppercase text-cyan-400">Economy Rules</h2>
            <div className="space-y-4 text-sm font-bold">
              <div className="flex justify-between"><span>First Lesson</span> <span className="text-emerald-400">+50 💎</span></div>
              <div className="flex justify-between"><span>Repeat Lesson</span> <span className="text-emerald-400">+5 💎</span></div>
              <div className="flex justify-between"><span>Smart Review</span> <span className="text-emerald-400">+1 💎/word</span></div>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-start mb-10 mt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{nickname || 'Explorer'}</h1>
            <button onClick={() => setIsEditingName(true)} className="text-gray-700 hover:text-cyan-400 transition-colors"><Edit3 size={16}/></button>
          </div>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest italic">Rank: Bronze Voyager</p>
        </div>
        <button onClick={() => setShowLegend(true)} className="p-4 bg-gray-900 rounded-[1.5rem] border border-white/5 text-gray-500 hover:text-cyan-400 transition-colors"><Info size={22} /></button>
      </header>

      {stats.reviewCount > 0 && (
        <button onClick={() => navigate('/review')} className="w-full mb-8 py-6 bg-emerald-500 text-black rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all">
          <Zap size={18} fill="currentColor" /> Review Words ({stats.reviewCount})
        </button>
      )}

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/40 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Gem className="text-emerald-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black mb-1">{stats.gems}</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase">Total Gems</div>
        </div>
        <div className="bg-gray-900/40 border border-cyan-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Target className="text-cyan-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black mb-1">{stats.mastered}</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase">Mastered</div>
        </div>
      </div>

      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-8">
        <h3 className="text-lg font-bold mb-8 flex items-center gap-2 italic uppercase"><Trophy size={20} className="text-yellow-500" /> Leaderboard</h3>
        <div className="flex justify-between items-center p-4 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
          <div className="flex items-center gap-4">
            <span className="font-black italic text-cyan-400 text-lg">#1</span>
            <span className="font-bold text-sm uppercase">{nickname || 'You'}</span>
          </div>
          <span className="font-black text-emerald-400">{stats.gems} 💎</span>
        </div>
      </div>

      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold italic uppercase tracking-tight">Vocab Goal</h3>
            <p className="text-[10px] text-gray-700 font-black uppercase mt-1">Goal: 3000 Words (B1)</p>
          </div>
          <BookOpen className="text-gray-800" size={24} />
        </div>
        <div className="space-y-5">
          <div className="flex justify-between items-end">
            <span className="text-4xl font-black italic tracking-tighter">{stats.totalSeen} <span className="text-sm text-gray-800 not-italic font-bold">/ 3000</span></span>
            <span className="text-[10px] font-black text-cyan-500 uppercase">{Math.round((stats.totalSeen / 3000) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-white/5">
             <div className="h-full bg-cyan-500" style={{ width: `${(stats.totalSeen / 3000) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-gray-500"><BookOpen size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Map</span></button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-gray-500"><BookText size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Vocab</span></button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-cyan-400"><User size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Profile</span></button>
      </div>
    </div>
  );
}