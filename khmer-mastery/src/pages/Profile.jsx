import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Gem, Target, LogOut, Mail, Info } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [userAuth, setUserAuth] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate('/login');
        return;
      }
      setUserAuth(user);

      // Загружаем профиль
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      } else {
        // Если авторизация есть, а профиля в таблице нет —
        // значит триггер не сработал или данные не синхронизировались.
        console.log("Auth exists, but profile record missing.");
      }
    } catch (err) {
      console.error("Auth check error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear(); // Полная очистка при выходе
    navigate('/login');
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400">SYNCING...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <header className="flex justify-between items-start mb-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-3xl flex items-center justify-center border border-cyan-500/20">
            <User size={32} className="text-cyan-400" />
          </div>
          <div>
            {/* Если профиля нет, показываем хотя бы почту */}
            <h1 className="text-2xl font-black italic uppercase">
              {profile?.username || 'New Student'}
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">{userAuth?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500">
          <LogOut size={20} />
        </button>
      </header>

      {!profile && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-3xl mb-8">
          <p className="text-yellow-500 text-xs font-bold uppercase tracking-tight">
            Warning: Profile data not found. Try logging out and in again to trigger synchronization.
          </p>
        </div>
      )}

      {/* Остальные блоки статистики... */}
    </div>
  );
}