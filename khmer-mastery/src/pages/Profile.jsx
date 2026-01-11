import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Gem, Target, BookOpen, Info, Trophy, Zap,
  X, Award, TrendingUp, Edit3, BookText, ChevronRight
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [showLegend, setShowLegend] = useState(false);
  const [nickname, setNickname] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [stats, setStats] = useState({
    totalSeen: 0, mastered: 0, gems: 0, lessonsDone: 0, reviewCount: 0
  });

  useEffect(() => {
    fetchProfileAndStats();
  }, []);

  // Авто-фокус на поле ввода при открытии модалки
  useEffect(() => {
    if (isEditingName && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditingName]);

  const fetchProfileAndStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (profile?.username) setNickname(profile.username);
      else setIsEditingName(true);

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

  const saveNickname = async () => {
    if (!nickname || nickname.trim().length < 3) {
      alert("Name is too short!");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: nickname.trim(),
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      setIsEditingName(false);
    } catch (err) {
      alert("This name is already taken. Try another one.");
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black uppercase italic tracking-widest">Loading...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-36 font-sans selection:bg-cyan-500/30">

      {/* NICKNAME MODAL */}
      {isEditingName && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[200] p-8 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-cyan-500/10 p-6 rounded-full mb-8 border border-cyan-500/20 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
             <User size={48} className="text-cyan-400" />
          </div>
          <h2 className="text-3xl font-black italic uppercase mb-2 tracking-tighter">Enter <span className="text-cyan-400">Identity</span></h2>
          <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] mb-12">Only letters, numbers and underscores</p>

          <input
            ref={inputRef}
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Zа-яА-Я0-9_]/g, ''))}
            className="w-full max-w-xs bg-gray-900 border-b-2 border-white/10 py-5 px-4 text-2xl font-black text-center outline-none focus:border-cyan-400 transition-all uppercase tracking-widest"
            placeholder="TYPE_HERE"
            onKeyPress={(e) => e.key === 'Enter' && saveNickname()}
          />

          <button
            onClick={saveNickname}
            className="mt-12 w-full max-w-xs py-5 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-cyan-500/20"
          >
            Confirm Identity
          </button>
        </div>
      )}

      {/* LEGEND MODAL */}
      {showLegend && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] p-8 flex items-center justify-center" onClick={() => setShowLegend(false)}>
          <div className="bg-gray-900 border border-white/10 p-10 rounded-[3rem] max-w-sm w-full relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowLegend(false)} className="absolute top-8 right-8 text-gray-600 hover:text-white"><X size={24}/></button>
            <h2 className="text-2xl font-black mb-8 italic uppercase text-cyan-400 tracking-tighter">Economy Rules</h2>
            <div className="space-y-5 text-sm font-bold">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-gray-400">First Lesson</span>
                <span className="text-emerald-400">+50 💎</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-gray-400">Repeat Lesson</span>
                <span className="text-emerald-400">+5 💎</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-gray-400">Smart Review</span>
                <span className="text-emerald-400">+1 💎/word</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="flex justify-between items-start mb-12 mt-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{nickname || 'Explorer'}</h1>
            <button onClick={() => setIsEditingName(true)} className="p-2 text-gray-800 hover:text-cyan-400 transition-colors"><Edit3 size={18}/></button>
          </div>
          <p className="text-gray-700 text-[10px] font-black uppercase tracking-widest italic">Rank: Bronze Voyager</p>
        </div>
        <button onClick={() => setShowLegend(true)} className="p-4 bg-gray-900 rounded-2xl border border-white/5 text-gray-500 hover:text-cyan-400 transition-colors shadow-lg"><Info size={22} /></button>
      </header>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="bg-gray-900/40 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Gem className="text-emerald-500/10 absolute -top-4 -right-4" size={90} />
          <div className="text-3xl font-black mb-1">{stats.gems}</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Total Gems</div>
        </div>
        <div className="bg-gray-900/40 border border-cyan-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Target className="text-cyan-500/10 absolute -top-4 -right-4" size={90} />
          <div className="text-3xl font-black mb-1">{stats.mastered}</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Mastered</div>
        </div>
      </div>

      {/* LEADERBOARD MOCKUP */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-10">
        <h3 className="text-lg font-bold mb-8 flex items-center gap-3 italic uppercase tracking-tight">
          <Trophy size={22} className="text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
          Leaderboard
        </h3>
        <div className="flex justify-between items-center p-5 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 shadow-xl shadow-cyan-500/5">
          <div className="flex items-center gap-4">
            <span className="font-black italic text-cyan-400 text-lg">#1</span>
            <span className="font-black text-sm uppercase tracking-tight">{nickname || 'YOU'}</span>
          </div>
          <span className="font-black text-emerald-400">{stats.gems} 💎</span>
        </div>
      </div>

      {/* VOCAB PROGRESS */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem]">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold italic uppercase tracking-tight leading-none mb-1">Vocab Mastery</h3>
            <p className="text-[10px] text-gray-700 font-black uppercase tracking-widest">Goal: 3,000 (B1 Level)</p>
          </div>
          <div className="bg-gray-900 p-3 rounded-xl border border-white/5"><BookOpen size={20} className="text-gray-600" /></div>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-end font-black italic">
            <span className="text-4xl tracking-tighter">{stats.totalSeen} <span className="text-sm text-gray-800 not-italic">/ 3000</span></span>
            <span className="text-[11px] text-cyan-500 uppercase tracking-[0.2em]">{Math.round((stats.totalSeen / 3000) * 100)}%</span>
          </div>
          <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
             <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all duration-1000" style={{ width: `${(stats.totalSeen / 3000) * 100}%` }}></div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[3rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-all"><BookOpen size={24} /><span className="text-[10px] font-black uppercase tracking-[0.1em]">Map</span></button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-all"><BookText size={24} /><span className="text-[10px] font-black uppercase tracking-[0.1em]">Vocab</span></button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-cyan-400"><User size={24} /><span className="text-[10px] font-black uppercase tracking-[0.1em]">Profile</span></button>
      </div>
    </div>
  );
}