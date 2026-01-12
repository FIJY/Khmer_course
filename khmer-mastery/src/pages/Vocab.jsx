import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  BookText, Map as MapIcon, User, Search,
  Volume2, ScrollText, BrainCircuit, Globe
} from 'lucide-react';

export default function Vocab() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchVocab(); }, []);

  const fetchVocab = async () => {
    try {
      setLoading(true);

      // ИЗМЕНЕНИЕ: Грузим ВСЕ карточки типа 'vocab_card' из таблицы уроков
      // Сортируем по lesson_id, чтобы сначала шли слова из первых уроков
      const { data, error } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('type', 'vocab_card')
        .order('lesson_id', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setItems(data || []);
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
    const front = item.data?.front?.toLowerCase() || '';
    const back = item.data?.back?.toLowerCase() || '';
    return front.includes(term) || back.includes(term);
  });

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans">

      {/* HEADER */}
      <div className="p-6 sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="text-cyan-500" size={24} />
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">
            Full Dictionary
          </h1>
        </div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">
          {items.length} words available in course
        </p>
      </div>

      {/* SEARCH BAR */}
      <div className="px-6 mt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search in English or Khmer..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-gray-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 transition-colors font-bold"
          />
        </div>
      </div>

      {/* WORD LIST */}
      <div className="px-6 mt-6 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 py-10 animate-pulse text-xs font-bold tracking-widest uppercase">Loading Database...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center opacity-50 py-20 flex flex-col items-center">
            <ScrollText size={48} className="mb-4 text-gray-600" />
            <p className="text-gray-500 italic">No words found.</p>
          </div>
        ) : (
          filteredItems.map((item, i) => {
            const word = item.data;
            return (
              <div key={i} onClick={() => playAudio(word.audio)} className="bg-gray-900/20 border border-white/5 p-5 rounded-2xl flex items-center justify-between active:bg-gray-800 transition-colors cursor-pointer group hover:border-cyan-500/20">
                <div className="flex items-center gap-4">
                  {/* Иконка громкости */}
                  <div className="w-8 h-8 rounded-full bg-cyan-500/5 text-cyan-500 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all">
                    <Volume2 size={14} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg leading-none mb-1">{word.back}</h3>
                    <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
                      {word.front}
                      {/* Можно добавить метку урока, если хочешь */}
                      <span className="opacity-30 ml-2 text-[8px]">Lesson {item.lesson_id}</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* НИЖНЕЕ МЕНЮ (4 КНОПКИ) */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-2xl border-t border-white/5 px-6 pt-4 pb-8 flex justify-between items-center z-50 max-w-lg mx-auto">
        <button onClick={() => navigate('/map')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <MapIcon size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Map</span>
        </button>

        <button onClick={() => navigate('/review')} className="text-gray-500 hover:text-white flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
          <BrainCircuit size={24} />
          <span className="text-[9px] font-black uppercase tracking-widest">Review</span>
        </button>

        {/* АКТИВНАЯ КНОПКА - VOCAB */}
        <button onClick={() => navigate('/vocab')} className="text-cyan-400 flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4">
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