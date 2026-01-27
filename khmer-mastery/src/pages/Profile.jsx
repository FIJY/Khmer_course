import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Trophy, Zap, Target, Flame, Trash2, LogOut, Gem } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import EmptyState from '../components/UI/EmptyState';
import { fetchCurrentUser } from '../data/auth';
import { fetchCompletedLessonCount } from '../data/progress';
import { fetchUserSrsCount } from '../data/profile';
import { t } from '../i18n';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ email: '', joined: '' });
  const [stats, setStats] = useState({ lessons: 0, words: 0, gems: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchProfileData(); }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await fetchCurrentUser();
      if (!user) { navigate('/login'); return; }

      const lessonsCompleted = await fetchCompletedLessonCount(user.id);
      const wordsLearned = await fetchUserSrsCount(user.id);
      const username = user.email ? user.email.split('@')[0] : 'Learner';

      const baselineLeaders = [
        { name: 'sokha', gems: 2100 },
        { name: 'dara', gems: 1850 },
        { name: 'maly', gems: 1600 },
        { name: 'nika', gems: 1200 }
      ];
      const currentEntry = {
        name: username,
        gems: lessonsCompleted * 50,
        isCurrent: true
      };
      const merged = [currentEntry, ...baselineLeaders]
        .sort((a, b) => b.gems - a.gems)
        .slice(0, 5);

      setProfile({ email: user.email, joined: new Date(user.created_at).toLocaleDateString() });
      setStats({ lessons: lessonsCompleted, words: wordsLearned, gems: lessonsCompleted * 50 });
      setLeaderboard(merged);
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

  if (loading) return <LoadingState label={t('loading.profile')} />;

  if (error) {
    return (
      <ErrorState
        title={t('errors.profile')}
        message={error}
        onRetry={fetchProfileData}
      />
    );
  }

  const isEmptyStats = stats.lessons === 0 && stats.words === 0;

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
                {t('profile.memberSince', { date: profile.joined || '—' })}
              </p>
           </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* STATS GRID */}
        {isEmptyStats && (
          <EmptyState
            title={t('empty.lessons')}
            description={t('empty.lessonsSubtext')}
            actions={(
              <Button variant="outline" onClick={() => navigate('/map')}>
                {t('actions.backToMap')}
              </Button>
            )}
            className="py-6"
          />
        )}
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

        <div className="bg-gray-900/50 p-5 rounded-[2rem] border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Rating</p>
              <h3 className="text-lg font-black text-white uppercase tracking-widest">Top Gems</h3>
            </div>
            <Gem size={18} className="text-emerald-400" />
          </div>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => (
              <div
                key={`${entry.name}-${index}`}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  entry.isCurrent
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                    : 'border-white/5 bg-black/40 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-500">#{index + 1}</span>
                  <span className="text-xs font-black uppercase tracking-widest">{entry.name}</span>
                </div>
                <span className="text-xs font-black flex items-center gap-2">
                  <Gem size={14} className="text-emerald-400" />
                  {entry.gems}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-600 uppercase tracking-[0.3em] text-center">
            Gems = completed lessons × 50
          </p>
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
