import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Trophy, Zap, Target, Flame, Trash2, LogOut } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ email: '', joined: '' });
  const [stats, setStats] = useState({ lessons: 0, words: 0, gems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchProfileData(); }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/login'); return; }

      const { data: progress } = await supabase.from('user_progress').select('id').eq('user_id', user.id).eq('is_completed', true);
      const { data: words } = await supabase.from('user_srs').select('id').eq('user_id', user.id);

      setProfile({ email: user.email, joined: new Date(user.created_at).toLocaleDateString() });
      setStats({ lessons: progress?.length || 0, words: words?.length || 0, gems: (progress?.length || 0) * 50 });
    } catch (err) {
      console.error(err);
      setError('Unable to load your profile.');
    }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleResetProgress = async () => {
    if (!window.confirm("Are you sure? This will delete all your progress permanently!")) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('user_progress').delete().eq('user_id', user.id);
      await supabase.from('user_srs').delete().eq('user_id', user.id);
      window.location.reload();
    } catch (err) { alert("Error resetting progress"); }
  };

  if (loading) return <div className="h-screen bg-black text-cyan-400 flex items-center justify-center font-black italic">LOADING PROFILE...</div>;

  if (error) {
    return (
      <div className="h-screen bg-black text-white flex flex-col items-center justify-center text-center px-6 gap-4">
        <p className="text-red-400 text-xs font-black uppercase tracking-widest">Profile Error</p>
        <p className="text-gray-400 text-xs">{error}</p>
        <Button onClick={fetchProfileData} className="bg-cyan-500 border-none">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <MobileLayout>
      {/* HEADER */}
      <div className="p-6 pt-10 bg-gradient-to-b from-gray-900 to-black border-b border-white/5">
        <div className="flex items-center gap-5">
           <div className="w-20 h-20 bg-cyan-500 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              <User size={40} className="text-black" />
           </div>
           <div>
              <h2 className="text-xl font-black text-white truncate w-48">
                {profile.email ? profile.email.split('@')[0] : 'Learner'}
              </h2>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                Member since {profile.joined || '—'}
              </p>
           </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-900/50 p-5 rounded-[2rem] border border-white/5">
             <Trophy className="text-emerald-500 mb-2" size={20} />
             <h3 className="text-2xl font-black text-white">{stats.lessons}</h3>
             <p className="text-gray-500 text-[10px] font-bold uppercase">Lessons</p>
          </div>
          <div className="bg-gray-900/50 p-5 rounded-[2rem] border border-white/5">
             <Zap className="text-cyan-400 mb-2" size={20} />
             <h3 className="text-2xl font-black text-white">{stats.words}</h3>
             <p className="text-gray-500 text-[10px] font-bold uppercase">Words</p>
          </div>
        </div>

        {/* SETTINGS AREA */}
        <div className="pt-4 space-y-3 pb-10">
          <Button variant="danger" onClick={handleResetProgress}>
             <Trash2 size={18} /> Reset Progress
          </Button>
          <Button variant="outline" onClick={handleLogout}>
             <LogOut size={18} /> Sign Out
          </Button>
        </div>

        <div className="text-center pb-4">
          <p className="text-[9px] text-gray-800 font-black uppercase tracking-[0.3em]">Khmer Mastery 2026</p>
        </div>
      </div>
    </MobileLayout>
  );
}
