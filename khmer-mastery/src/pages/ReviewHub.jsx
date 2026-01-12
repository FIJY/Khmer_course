import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getDueItems } from '../services/srsService';
import {
  BrainCircuit, Map as MapIcon, BookText, User,
  Trophy, TrendingUp, History, Play
} from 'lucide-react';

export default function ReviewHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ due: 0, total: 0, mastered: 0 });

  useEffect(() => { fetchReviewData(); }, []);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Узнаем, сколько слов "горит" (Due)
      const dueItems = await getDueItems(user.id);

      // 2. Считаем общую статистику
      const { data: allSrs } = await supabase
        .from('user_srs')
        .select('status')
        .eq('user_id', user.id);

      const total = allSrs?.length || 0;
      // "Mastered" считаем те, где интервал уже большой (status = 'graduated')
      const mastered = allSrs?.filter(i => i.status === 'graduated').length || 0;

      setStats({
        due: dueItems.length,
        total,
        mastered
      });

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans">

      {/* HEADER */}
      <div className="p-6 pt-10">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-1">
          Review <span className="text-orange-500">Center</span>
        </h1>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
          Keep your memory sharp
        </p>
      </div>

      <div className="px-6 space-y-6">

        {/* ГЛАВНАЯ КАРТОЧКА: START SESSION */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-5xl font-black text-white mb-2">{stats.due}</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-8">
              Cards due today
            </p>

            <button
              onClick={() => stats.due > 0 ? navigate('/review/session') : null}
              disabled={stats.due === 0}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95
                ${stats.due > 0
                  ? 'bg-orange-500 text-black shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:bg-orange-400'
                  : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              {stats.due > 0 ? (
                <> <Play size={20} fill="currentColor" /> Start Session </>
              ) : (
                <> <Check size={20} /> All Caught Up </>
              )}
            </button>
          </div>

          {/* Декор */}
          <BrainCircuit className="absolute -right-10 -top-10 text-orange-500/10 rotate-12" size={200} />
        </div>

        {/* СТАТИСТИКА */}
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

        {/* СОВЕТ */}
        {stats.due === 0 && (
          <div className="bg-emerald-900/10 border border-emerald-500/20 p-6 rounded-3xl flex items-start gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-500">
              <History size={20} />
            </div>
            <div>
              <h4 className="text-emerald-400 font-bold uppercase text-sm mb-1">Great Job!</h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                You've cleared your queue. Come back tomorrow or learn new words on the Map.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* НИЖНЕЕ МЕНЮ (4 ПУНКТА) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/5 px-6 pt-4 pb-8 flex justify-between items-center z-50 max-w-lg mx-auto">
        <button onClick={() => navigate('/map')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <MapIcon size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Map</span>
        </button>

        {/* АКТИВНАЯ ВКЛАДКА REVIEW */}
        <button onClick={() => navigate('/review')} className="text-orange-500 flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <BrainCircuit size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Review</span>
        </button>

        <button onClick={() => navigate('/vocab')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <BookText size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Vocab</span>
        </button>
        <button onClick={() => navigate('/profile')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <User size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Me</span>
        </button>
      </div>
    </div>
  );
}