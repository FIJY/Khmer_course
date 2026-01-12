import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getDueItems, updateSRSItem } from '../services/srsService';
import { X, Volume2, RotateCw, CheckCircle2 } from 'lucide-react';

export default function ReviewPlayer() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => { loadSession(); }, []);

  const loadSession = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      // Загружаем слова на сегодня
      const due = await getDueItems(user.id);
      setItems(due);
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

  const handleGrade = async (grade) => {
    // 1. Отправляем оценку в базу
    // grade: 1=Hard, 3=Good, 5=Easy
    const currentItem = items[currentIndex];
    const { data: { user } } = await supabase.auth.getUser();

    await updateSRSItem(user.id, currentItem.id, grade);

    // 2. Переходим к следующему
    if (currentIndex < items.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-orange-500 font-black tracking-widest">LOADING SESSION...</div>;

  // ЭКРАН ЗАВЕРШЕНИЯ
  if (finished || items.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-6 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-black text-white italic uppercase mb-2">Session Complete!</h1>
        <p className="text-gray-500 mb-10 max-w-xs mx-auto">You've reviewed all your cards for now. Your brain is getting stronger.</p>
        <button onClick={() => navigate('/review')} className="w-full max-w-sm py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform">
          Back to Hub
        </button>
      </div>
    );
  }

  const card = items[currentIndex].data;

  return (
    <div className="h-screen bg-black flex justify-center overflow-hidden">
      <div className="w-full max-w-lg h-full flex flex-col relative bg-black">

        {/* HEADER */}
        <div className="p-4 flex justify-between items-center z-20">
          <button onClick={() => navigate('/review')} className="p-2 text-gray-500 hover:text-white">
            <X size={24} />
          </button>
          <div className="text-gray-500 text-xs font-black uppercase tracking-widest">
            {currentIndex + 1} / {items.length}
          </div>
          <div className="w-8" /> {/* Spacer */}
        </div>

        {/* CARD AREA */}
        <div className="flex-1 flex flex-col justify-center px-6 pb-20 perspective-1000">
          <div
            onClick={() => {
              if (!isFlipped) {
                setIsFlipped(true);
                playAudio(card.audio);
              }
            }}
            className="relative w-full aspect-[3/4] cursor-pointer"
          >
            {/* FRONT (Вопрос) */}
            <div className={`absolute inset-0 bg-gray-900 border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center transition-all duration-300 backface-hidden
              ${isFlipped ? 'opacity-0 rotate-y-180 pointer-events-none' : 'opacity-100'}`}>
              <span className="text-orange-500 font-black text-[10px] uppercase mb-6 tracking-widest">Tap to reveal</span>
              <h2 className="text-4xl font-black text-white leading-tight">{card.back}</h2>
              {/* Если хочешь показывать кхмерский сразу - используй card.back, если английский - card.front */}
            </div>

            {/* BACK (Ответ) */}
            <div className={`absolute inset-0 bg-gray-900 border-2 border-orange-500/30 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center transition-all duration-300 backface-hidden [transform:rotateY(180deg)]
              ${isFlipped ? 'opacity-100 rotate-y-0' : 'opacity-0 pointer-events-none'}`}>

              <span className="text-gray-500 font-black text-[10px] uppercase mb-4 tracking-widest">Answer</span>

              <h2 className="text-4xl font-black text-white mb-2">{card.back}</h2>
              <p className="text-xl text-orange-400 italic mb-6 font-bold">{card.pronunciation}</p>

              <div className="w-full h-px bg-white/10 mb-6" />

              <p className="text-2xl text-gray-300 font-bold">{card.front}</p>

              <button onClick={(e) => { e.stopPropagation(); playAudio(card.audio); }} className="mt-8 p-4 bg-orange-500/20 text-orange-500 rounded-full hover:bg-orange-500 hover:text-black transition-colors">
                <Volume2 size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* CONTROLS (Появляются только если перевернуто) */}
        {isFlipped && (
          <div className="absolute bottom-10 left-0 right-0 px-6 flex gap-3 animate-in slide-in-from-bottom-10 fade-in duration-300 z-30">
            <button onClick={() => handleGrade(1)} className="flex-1 py-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl font-black uppercase text-xs hover:bg-red-500 hover:text-white transition-colors">
              Hard 😓
            </button>
            <button onClick={() => handleGrade(3)} className="flex-1 py-4 bg-gray-800 border border-white/10 text-white rounded-2xl font-black uppercase text-xs hover:bg-gray-700 transition-colors">
              Good 🙂
            </button>
            <button onClick={() => handleGrade(5)} className="flex-1 py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl font-black uppercase text-xs hover:bg-emerald-500 hover:text-white transition-colors">
              Easy 😎
            </button>
          </div>
        )}
      </div>

      <style>{`
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}