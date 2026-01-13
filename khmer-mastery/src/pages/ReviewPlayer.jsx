import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getDueItems, updateSRSItem } from '../services/srsService';
import { X, Volume2, CheckCircle2, HelpCircle, Eye } from 'lucide-react';

export default function ReviewPlayer() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => { loadSession(); }, []);

  const loadSession = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const due = await getDueItems(user.id);
      setItems(due);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const playAudio = (filename) => {
    if (!filename) return;
    new Audio(`/sounds/${filename}`).play().catch(() => {});
  };

  const handleReveal = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      if (items[currentIndex]?.data?.audio) {
        playAudio(items[currentIndex].data.audio);
      }
    }
  };

  const handleGrade = async (grade) => {
    const currentItem = items[currentIndex];
    const { data: { user } } = await supabase.auth.getUser();

    // Отправляем оценку в SRS
    await updateSRSItem(user.id, currentItem.srs_id || currentItem.id, grade);

    if (currentIndex < items.length - 1) {
      setIsRevealed(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-orange-500 font-black tracking-widest">SYNCING...</div>;

  // --- ЭКРАН УСПЕХА ---
  if (finished || items.length === 0) {
    return (
      <div className="min-h-screen bg-black flex justify-center">
        <div className="w-full max-w-md h-screen flex flex-col items-center justify-center text-center p-6 border-x border-white/5">
          <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-8 animate-bounce">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-black text-white italic uppercase mb-4">All Clear!</h1>
          <p className="text-gray-500 mb-12 max-w-xs mx-auto leading-relaxed">
            You've reviewed all your due cards for now. Great job!
          </p>
          <button onClick={() => navigate('/review')} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform shadow-xl">
            Back to Hub
          </button>
        </div>
      </div>
    );
  }

  const card = items[currentIndex].data;

  return (
    // ГЛАВНЫЙ ФОН
    <div className="min-h-screen bg-black flex justify-center font-sans">

      {/* МОБИЛЬНЫЙ КОНТЕЙНЕР */}
      <div className="w-full max-w-md h-screen flex flex-col relative bg-black border-x border-white/5 shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="p-4 flex items-center justify-between z-20 bg-black/50 backdrop-blur-sm">
          <button onClick={() => navigate('/review')} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X size={24} />
          </button>

          {/* Progress Bar */}
          <div className="flex-1 mx-6 h-1 bg-gray-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-300"
              style={{ width: `${((currentIndex) / items.length) * 100}%` }}
            />
          </div>

          <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest w-8 text-right">
            {currentIndex + 1}/{items.length}
          </div>
        </div>

        {/* КАРТОЧКА */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-40">

          {/* ПЕРЕДНЯЯ СТОРОНА (Всегда видна) */}
          <div className="text-center mb-12 animate-in fade-in zoom-in duration-300">
            <span className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] mb-6 block">Translate</span>
            <h2 className="text-4xl md:text-5xl font-black text-white leading-tight break-words">
              {card.front}
            </h2>
          </div>

          {/* ЗАДНЯЯ СТОРОНА (Скрыта до клика) */}
          {isRevealed ? (
            <div className="text-center w-full animate-in slide-in-from-bottom-8 fade-in duration-500">
              <div className="w-16 h-1 bg-gray-800 rounded-full mx-auto mb-8" />

              <h2 className="text-5xl md:text-6xl font-black text-orange-400 mb-4 font-serif">
                {card.back}
              </h2>

              {card.pronunciation && (
                <p className="text-gray-400 text-lg italic mb-8">/{card.pronunciation}/</p>
              )}

              <button
                onClick={() => playAudio(card.audio)}
                className="w-16 h-16 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto hover:bg-orange-500 hover:text-white transition-all active:scale-90 border border-orange-500/20"
              >
                <Volume2 size={28} />
              </button>
            </div>
          ) : (
            /* КНОПКА ПОКАЗАТЬ ОТВЕТ */
            <button
              onClick={handleReveal}
              className="mt-8 py-4 px-10 rounded-full bg-gray-900 border border-white/10 text-gray-300 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-3 active:scale-95 shadow-lg"
            >
              <Eye size={16} /> Show Answer
            </button>
          )}

        </div>

        {/* КНОПКИ ОЦЕНКИ (Внизу, появляются после открытия) */}
        {isRevealed && (
          <div className="absolute bottom-0 left-0 right-0 p-6 pt-10 bg-gradient-to-t from-black via-black to-transparent animate-in slide-in-from-bottom-full duration-300">
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => handleGrade(1)}
                className="py-5 bg-gray-900 border border-red-500/20 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95">
                Hard (1m)
              </button>
              <button onClick={() => handleGrade(3)}
                className="py-5 bg-gray-900 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-800 transition-all active:scale-95">
                Good (1d)
              </button>
              <button onClick={() => handleGrade(5)}
                className="py-5 bg-gray-900 border border-emerald-500/20 text-emerald-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95">
                Easy (4d)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}