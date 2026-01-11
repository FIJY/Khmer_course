import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  User, Gem, Target, BookOpen, Info, Trophy, Zap, Mail,
  LogOut, BookText, AlertCircle, RefreshCw
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [userAuth, setUserAuth] = useState(null);
  const [stats, setStats] = useState({
    uniqueWords: 0,
    mastered: 0,
    gems: 0,
    reviewCount: 0
  });

  useEffect(() => { initProfile(); }, []);

  const initProfile = async () => {
    try {
      setLoading(true);
      // 1. Проверяем сессию
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }

      const user = session.user;
      setUserAuth(user);

      // 2. Загружаем никнейм
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      setProfile(profileData);

      // 3. Загружаем статистику с фильтром по типу 'word'
      const { data: srsData } = await supabase
        .from('user_srs_items')
        .select(`
          interval, next_review,
          dictionary:dictionary_id ( item_type )
        `)
        .eq('user_id', user.id);

      // 4. Считаем пройденные уроки для Гемов
      const { count: lessonsCount } = await supabase
        .from('user_progress')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_completed', true);

      if (srsData) {
        // Считаем только уникальные слова для B1 (исключая предложения)
        const wordsOnly = srsData.filter(item =>
          item.dictionary?.item_type === 'word' || item.dictionary?.item_type === 'phrase'
        );

        setStats({
          uniqueWords: wordsOnly.length,
          mastered: wordsOnly.filter(i => i.interval > 7).length,
          gems: (lessonsCount || 0) * 50,
          reviewCount: srsData.filter(i => new Date(i.next_review) <= new Date()).length
        });
      }
    } catch (err) {
      console.error("Profile sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-cyan-400 font-black italic uppercase tracking-widest">
      <RefreshCw className="animate-spin mb-4" size={32} />
      Syncing Progress...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-40 font-sans selection:bg-cyan-500/30">

      {/* HEADER */}
      <header className="flex justify-between items-start mb-10 mt-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/20 shadow-lg shadow-cyan-500/5">
            <User size={32} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
              {profile?.username || 'New Student'}
            </h1>
            <div className="flex items-center gap-1.5 mt-2 text-gray-600">
              <Mail size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{userAuth?.email}</span>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={20} />
        </button>
      </header>

      {/* WARNING: Если профиль не создался автоматически */}
      {!profile && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-[2rem] mb-8 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="text-yellow-500 shrink-0" size={20} />
          <p className="text-[10px] font-black uppercase tracking-tight text-yellow-600 leading-relaxed">
            Identity sync delayed. Your progress is being saved, but your nickname is not yet active on the leaderboard.
          </p>
        </div>
      )}

      {/* STATS GRID */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/40 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden group">
          <Gem className="text-emerald-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black text-white mb-1 leading-none">{stats.gems}</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gems</div>
        </div>

        <div className="bg-gray-900/40 border border-cyan-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Target className="text-cyan-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black text-white mb-1 leading-none">{stats.mastered}</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Mastered</div>
        </div>
      </div>

      {/* VOCAB PROGRESS BAR */}
      <div className="bg-gray-900/20 border border-white/5 p-8 rounded-[3rem] mb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-lg font-bold italic uppercase tracking-tight">B1 Vocabulary Goal</h3>
            <p className="text-[10px] text-gray-700 font-black uppercase mt-1">Target: 3,000 unique words</p>
          </div>
          <BookOpen className="text-gray-800" size={24} />
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-end font-black italic">
            <span className="text-4xl tracking-tighter">
              {stats.uniqueWords} <span className="text-sm text-gray-800 not-italic font-bold">/ 3000</span>
            </span>
            <span className="text-[10px] text-cyan-500 uppercase tracking-widest">
              {Math.round((stats.uniqueWords / 3000) * 100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-950 rounded-full overflow-hidden border border-white/5">
             <div
               className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all duration-1000"
               style={{ width: `${(stats.uniqueWords / 3000) * 100}%` }}
             ></div>
          </div>
          <p className="text-[9px] text-gray-600 uppercase font-bold tracking-widest italic leading-relaxed">
            * Only unique words and phrases count towards B1. Sentences and numbers are excluded.
          </p>
        </div>
      </div>

      {/* FOOTER NAV */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[3rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-all">
          <BookOpen size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300 transition-all">
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