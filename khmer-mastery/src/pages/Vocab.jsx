import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getDueItems } from '../services/srsService';
import {
  BookText, Map as MapIcon, User, Search,
  Volume2, Clock, CheckCircle2, BrainCircuit
} from 'lucide-react';

export default function Vocab() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchVocab();
  }, []);

  const fetchVocab = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Загружаем ВСЕ слова, которые пользователь уже встречал (есть запись в SRS)
      const { data: srsData, error } = await supabase
        .from('user_srs')
        .select(`
          interval,
          next_review,
          lesson_items (
            id, type, data, lesson_id
          )
        `)
        .eq('user_id', user.id)
        .order('id', { ascending: false }); // Сначала новые

      if (error) throw error;

      // Считаем, сколько слов "просрочено" (пора повторять)
      const now = new Date();
      const due = srsData.filter(row => new Date(row.next_review) <= now).length;
      setDueCount(due);

      setItems(srsData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (filename) => {
    if (!filename) return;
    new Audio(`/sounds/${filename}`).play().catch(() => {});
  };

  const filteredItems = items.filter(item => {
    const term = filter.toLowerCase();
    const front = item.lesson_items?.data?.front?.toLowerCase() || '';
    const back = item.lesson_items?.data?.back?.toLowerCase() || '';
    return front.includes(term) || back.includes(term);
  });

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans">

      {/* HEADER */}
      <div className="p-6 sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-4">
          My <span className="text-cyan-400">Vocabulary</span>
        </h1>

        {/* Кнопка запуска повторения */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black uppercase text-white mb-1">Review Time</h2>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                {dueCount > 0 ? `${dueCount} words need review` : "All caught up!"}
              </p>
            </div>
            <button
              disabled={dueCount === 0}
              className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95
                ${dueCount > 0
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
            >
              {dueCount > 0 ? 'Start Session' : 'No Reviews'}
            </button>
          </div>
          <BrainCircuit className="absolute -right-4 -bottom-4 text-white/5 rotate-12" size={120} />
        </div>
      </div>

      {/* ПОИСК */}
      <div className="px-6 mt-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search your words..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-gray-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors font-bold"
          />
        </div>
      </div>

      {/* СПИСОК СЛОВ */}
      <div className="px-6 mt-6 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-10 animate-pulse">Loading brain data...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center text-gray-600 py-10 italic">
            {filter ? "No matches found." : "No words learned yet. Go finish some lessons!"}
          </div>
        ) : (
          filteredItems.map((row, i) => {
            const word = row.lesson_items.data;
            const isDue = new Date(row.next_review) <= new Date();

            return (
              <div key={i} onClick={() => playAudio(word.audio)} className="bg-gray-900/30 border border-white/5 p-4 rounded-2xl flex items-center justify-between active:bg-gray-800 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border
                    ${isDue ? 'border-orange-500/30 bg-orange-500/10 text-orange-500' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'}`}>
                    {isDue ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg leading-none mb-1 group-hover:text-cyan-400 transition-colors">{word.back}</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{word.front}</p>
                  </div>
                </div>
                {word.audio && (
                  <button className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10">
                    <Volume2 size={14} />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* НИЖНЕЕ МЕНЮ (Копия с Карты) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-2xl border-t border-white/5 px-10 pt-4 pb-8 flex justify-between items-center z-50 max-w-lg mx-auto">
        <button onClick={() => navigate('/map')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
          <MapIcon size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="text-cyan-400 flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
          <BookText size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Vocab</span>
        </button>
        <button onClick={() => navigate('/profile')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform">
          <User size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Me</span>
        </button>
      </div>
    </div>
  );
}