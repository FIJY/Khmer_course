import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser } from '../data/auth';
import { fetchSrsStatusCounts } from '../data/review';
import { getDueItems } from '../services/srsService';
import {
  BrainCircuit, Trophy, TrendingUp, Play, Check
} from 'lucide-react';
// Unified UI Components
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';

export default function ReviewHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ due: 0, total: 0, mastered: 0 });
  const [error, setError] = useState(null);

  useEffect(() => { fetchReviewData(); }, []);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await fetchCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const dueItems = await getDueItems(user.id);
      const { total, mastered } = await fetchSrsStatusCounts(user.id);

      setStats({ due: dueItems.length, total, mastered });
    } catch (e) {
      console.error(e);
      setError('Unable to load review stats right now.');
    }
    finally { setLoading(false); }
  };

  if (error) {
    return (
      <ErrorState
        title="Review Error"
        message={error}
        onRetry={fetchReviewData}
      />
    );
  }

  if (loading) return <LoadingState label="Loading hub..." />;

  return (
    <MobileLayout>
      {/* HEADER */}
      <div className="p-6 pt-10">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-1 text-white">
          Review <span className="text-orange-500">Center</span>
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest italic">
          Keep your memory sharp
        </p>
      </div>

      {/* MAIN CONTENT */}
      <div className="px-6 space-y-6 pb-10">
        {/* START SESSION CARD */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl group">
          <div className="relative z-10">
            <h2 className="text-6xl font-black text-white mb-2">{stats.due}</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8">
              Cards due today
            </p>

            <Button
              onClick={() => stats.due > 0 ? navigate('/review/session') : null}
              disabled={stats.due === 0}
              className={stats.due > 0 ? "bg-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)] border-none" : ""}
            >
              {stats.due > 0 ? (
                <> <Play size={20} fill="currentColor" /> Start Session </>
              ) : (
                <> <Check size={20} /> All Caught Up </>
              )}
            </Button>
          </div>
          <BrainCircuit className="absolute -right-10 -top-10 text-orange-500/10 rotate-12 transition-transform group-hover:rotate-45 duration-700" size={200} />
        </div>

        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
            <Trophy className="text-emerald-500 mb-3" size={24} />
            <h3 className="text-2xl font-black text-white">{stats.mastered}</h3>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Mastered</p>
          </div>
          <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
            <TrendingUp className="text-cyan-500 mb-3" size={24} />
            <h3 className="text-2xl font-black text-white">{stats.total}</h3>
            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Total Learned</p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
