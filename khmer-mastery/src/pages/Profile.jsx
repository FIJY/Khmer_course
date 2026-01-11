import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Gem, Target, LogOut, Mail, AlertCircle, RefreshCw } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [userAuth, setUserAuth] = useState(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    initProfile();
  }, []);

  const initProfile = async () => {
    try {
      setLoading(true);
      // 1. Используем getSession вместо getUser для более быстрой проверки
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log("No session found, redirecting...");
        navigate('/login');
        return;
      }

      const user = session.user;
      setUserAuth(user);

      // 2. Загружаем данные из нашей таблицы профилей
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (profileData) {
        setProfile(profileData);
      } else {
        // Если авторизация есть, а записи в profiles нет — значит триггер не сработал
        console.warn("Auth OK, but profiles table is empty for this ID");
        setAuthError(true);
      }
    } catch (err) {
      console.error("Critical Profile Error:", err);
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
    <div className="h-screen bg-black flex flex-col items-center justify-center text-cyan-400 font-black italic">
      <RefreshCw className="animate-spin mb-4" size={32} />
      VALIDATING SESSION...
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 pb-32 font-sans">
      {/* HEADER */}
      <header className="flex justify-between items-start mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
            <User size={32} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic uppercase tracking-tight">
              {profile?.username || 'New Student'}
            </h1>
            <div className="flex items-center gap-1.5 text-gray-600">
              <Mail size={12} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{userAuth?.email}</span>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={20} />
        </button>
      </header>

      {/* ERROR HANDLING: Если профиль не создался автоматически */}
      {authError && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] mb-8 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-2 text-red-400">
            <AlertCircle size={20} />
            <h3 className="font-black uppercase italic text-sm">Profile Sync Error</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed uppercase font-bold">
            Account created, but your profile record is missing.
            Contact support or try creating a new account with a different nickname.
          </p>
        </div>
      )}

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-900/40 border border-emerald-500/20 p-6 rounded-[2.5rem] relative overflow-hidden group">
          <Gem className="text-emerald-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black mb-1">0</div>
          <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Gems</div>
        </div>
        <div className="bg-gray-900/40 border border-cyan-500/20 p-6 rounded-[2.5rem] relative overflow-hidden">
          <Target className="text-cyan-500/10 absolute -top-2 -right-2" size={80} />
          <div className="text-3xl font-black mb-1">0</div>
          <div className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Mastered</div>
        </div>
      </div>

      {/* ... остальной UI (Progress Bar и т.д.) */}
    </div>
  );
}