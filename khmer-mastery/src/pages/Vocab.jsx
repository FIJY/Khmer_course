import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Search, Volume2, Map as MapIcon, BookText, User, ChevronLeft } from 'lucide-react';

export default function Vocab() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [allWords, setAllWords] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAllWords();
  }, []);

  const fetchAllWords = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('vocabulary')
        .order('id', { ascending: true });

      if (error) throw error;

      // Объединяем массивы слов и фильтруем null/undefined
      const flattened = data
        .flatMap(lesson => lesson.vocabulary || [])
        .filter(word => word !== null);

      setAllWords(flattened);
    } catch (error) {
      console.error('Error fetching vocab:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (file) => {
    if (!file) return;
    new Audio(`/sounds/${file}`).play().catch(() => console.log("Audio missing"));
  };

  // ИСПРАВЛЕННАЯ ЛОГИКА ФИЛЬТРАЦИИ: добавлена защита от undefined
  const filteredWords = allWords.filter(w => {
    const query = searchQuery.toLowerCase();

    const englishMatch = (w.english || "").toLowerCase().includes(query);
    const khmerMatch = (w.khmer || "").includes(query);
    const pronunciationMatch = (w.pronunciation || "").toLowerCase().includes(query);

    return englishMatch || khmerMatch || pronunciationMatch;
  });

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-cyan-400">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans">
      <div className="p-6 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/map')} className="text-gray-500 hover:text-white">
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Dictionary</h1>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-cyan-400 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-white/5 py-4 pl-12 pr-6 rounded-2xl outline-none focus:border-cyan-500/50 transition-all font-medium placeholder:text-gray-700"
          />
        </div>
      </div>

      <div className="max-w-xl mx-auto p-6 space-y-3">
        {filteredWords.length > 0 ? (
          filteredWords.map((word, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-5 bg-gray-900/40 border border-white/5 rounded-3xl hover:bg-gray-900/60 transition-colors group"
            >
              <div className="flex-1">
                <div className="flex items-baseline gap-3 mb-1">
                  <h3 className="text-xl font-bold text-white">{word.khmer || 'N/A'}</h3>
                  <span className="text-cyan-400 text-sm font-medium">{word.pronunciation || ''}</span>
                </div>
                <p className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">
                  {word.english || 'No translation'}
                </p>
              </div>

              <button
                onClick={() => playAudio(word.audio)}
                className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 hover:bg-cyan-500 hover:text-black transition-all active:scale-90"
              >
                <Volume2 size={20} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-600 font-medium">
            {allWords.length === 0 ? "Dictionary is empty. Complete a lesson first!" : "No matches found."}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-xl border-t border-white/5 px-10 py-5 flex justify-between items-center z-50 max-w-lg mx-auto rounded-t-[2.5rem]">
        <button onClick={() => navigate('/map')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300">
          <MapIcon size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Map</span>
        </button>
        <button onClick={() => navigate('/vocab')} className="flex flex-col items-center gap-1.5 text-cyan-400">
          <BookText size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Vocab</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-gray-500 hover:text-gray-300">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
        </button>
      </div>
    </div>
  );
}