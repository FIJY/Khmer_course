import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Gem, Target, BookOpen, Info, Trophy, Zap, Mail, LogOut, BookText
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [stats, setStats] = useState({
    uniqueWords: 0, // Только слова типа 'word'
    mastered: 0,
    gems: 0,
    reviewCount: 0
  });

  useEffect(() => { fetchFullProfile(); }, []);

  const fetchFullProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }
      setUserEmail(user.email);

      // 1. Никнейм
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).maybeSingle();
      if (profile) setNickname(profile.username);

      // 2. SRS Прогресс + Связь со словарем для фильтрации типов
      const { data: srsData } = await supabase
        .from('user_srs_items')
        .select(`
          interval,
          next_review,
          dictionary_id,
          dictionary:dictionary_id ( item_type )
        `)
        .eq('user_id', user.id);

      if (srsData) {
        // Фильтруем: считаем только уникальные 'word' и 'phrase' для цели B1
        const wordsOnly = srsData.filter(item =>
          item.dictionary?.item_type === 'word' || item.dictionary?.item_type === 'phrase'
        );

        const masteredOnly = wordsOnly.filter(item => item.interval > 7);
        const dueCount = srsData.filter(item => new Date(item.next_review) <= new Date()).length;

        // Гемы считаем по старинке (за пройденные уроки)
        const { count: lessonsCount } = await supabase
          .from('user_progress')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_completed', true);

        setStats({
          uniqueWords: wordsOnly.length,
          mastered: masteredOnly.length,
          gems: (lessonsCount || 0) * 50,
          reviewCount: dueCount
        });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic">SYNCING...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-36 font-sans">
      <header className="mb-10 mt-4 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)]">
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
        <button onClick={handleLogout} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={20} />
        </button>
      </header>

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

      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold italic uppercase tracking-tight">Vocabulary Goal</h3>
            <p className="text-[10px] text-gray-700 font-black uppercase mt-1">Goal: B1 Proficiency (3,000 words)</p>
          </div>
          <BookOpen className="text-gray-800" size={24} />
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-end font-black italic">
            <span className="text-4xl tracking-tighter">{stats.uniqueWords} <span className="text-sm text-gray-800 not-italic">/ 3000</span></span>
            <span className="text-[10px] text-cyan-500 uppercase">{Math.round((stats.uniqueWords / 3000) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-950 rounded-full overflow-hidden border border-white/5">
             <div className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)]" style={{ width: `${(stats.uniqueWords / 3000) * 100}%` }}></div>
          </div>
          <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest">* Sentences and numbers are excluded from B1 word count.</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1 text-gray-500"><BookOpen size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Map</span></button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1 text-gray-500"><BookText size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Vocab</span></button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-cyan-400"><User size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Profile</span></button>
      </div>
    </div>
  );
}