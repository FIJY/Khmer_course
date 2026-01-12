import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getDueItems, updateSRSItem } from '../services/srsService';
import { X, Volume2, CheckCircle2, HelpCircle } from 'lucide-react';

export default function ReviewPlayer() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false); // Открыта ли карточка
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

  const handleReveal = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      // Авто-воспроизведение звука при открытии (если хочешь)
      if (items[currentIndex]?.data?.audio) {
        playAudio(items[currentIndex].data.audio);
      }
    }
  };

  const handleGrade = async (grade) => {
    const currentItem = items[currentIndex];
    const { data: { user } } = await supabase.auth.getUser();

    // Обновляем базу
    await updateSRSItem(user.id, currentItem.srs_id || currentItem.id, grade);

    // Переход к следующему
    if (currentIndex < items.length - 1) {
      setIsRevealed(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setFinished(true);
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-orange-500 font-black tracking-widest">LOADING...</div>;

  // ЭКРАН ФИНИША
  if (finished || items.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-6 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-black text-white italic uppercase mb-2">Session Complete!</h1>
        <p className="text-gray-500 mb-10 max-w-xs mx-auto">Great job keeping your memory fresh.</p>
        <button onClick={() => navigate('/review')} className="w-full max-w-sm py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest active:scale-95 transition-transform">
          Back to Hub
        </button>
      </div>
    );
  }

  const card = items[currentIndex].data; // Данные карточки (front, back, audio)

  return (
    <div className="h-screen bg-black flex flex-col relative overflow-hidden font-sans text-white">

      {/* HEADER (Прогресс бар) */}
      <div className="p-4 flex items-center justify-between z-20">
        <button onClick={() => navigate('/review')} className="p-2 text-gray-500 hover:text-white">
          <X size={24} />
        </button>
        <div className="flex-1 mx-4 h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${((currentIndex) / items.length) * 100}%` }}
          />
        </div>
        <div className="text-gray-500 text-xs font-black uppercase tracking-widest">
          {currentIndex + 1} / {items.length}
        </div>
      </div>

      {/* ОБЛАСТЬ КАРТОЧКИ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pb-32">

        {/* ВОПРОС (Английский) - Всегда виден */}
        <div className="text-center mb-8 animate-in fade-in zoom-in duration-300">
          <span className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-4 block">Translate this</span>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
            {card.front}
          </h2>
        </div>

        {/* ОТВЕТ (Кхмерский) - Скрыт до нажатия */}
        {isRevealed ? (
          <div className="text-center animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="w-full h-px bg-white/10 my-6 mx-auto w-24" />

            <h2 className="text-5xl md:text-6xl font-black text-orange-400 mb-3 font-serif">
              {card.back}
            </h2>
            {/* Если есть транскрипция или доп инфо */}
            {card.pronunciation && (
              <p className="text-gray-400 text-lg italic">{card.pronunciation}</p>
            )}

            <button
              onClick={() => playAudio(card.audio)}
              className="mt-6 w-14 h-14 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto hover:bg-orange-500 hover:text-white transition-all active:scale-90"
            >
              <Volume2 size={24} />
            </button>
          </div>
        ) : (
          /* КНОПКА "ПОКАЗАТЬ ОТВЕТ" */
          <button
            onClick={handleReveal}
            className="mt-8 py-3 px-8 rounded-full border border-white/20 text-gray-400 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black hover:border-white transition-all flex items-center gap-2"
          >
            <HelpCircle size={16} /> Show Answer
          </button>
        )}

      </div>

      {/* КНОПКИ ОЦЕНКИ (Только когда открыто) */}
      {isRevealed && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent pt-20 animate-in slide-in-from-bottom-20 duration-300">
          <div className="flex gap-3 max-w-lg mx-auto">
            <button onClick={() => handleGrade(1)} className="flex-1 py-4 bg-gray-900 border border-red-500/30 text-red-400 rounded-2xl font-black uppercase text-xs hover:bg-red-500 hover:text-white transition-colors active:scale-95">
              Hard
            </button>
            <button onClick={() => handleGrade(3)} className="flex-1 py-4 bg-gray-900 border border-white/20 text-white rounded-2xl font-black uppercase text-xs hover:bg-gray-700 transition-colors active:scale-95">
              Good
            </button>
            <button onClick={() => handleGrade(5)} className="flex-1 py-4 bg-gray-900 border border-emerald-500/30 text-emerald-400 rounded-2xl font-black uppercase text-xs hover:bg-emerald-500 hover:text-white transition-colors active:scale-95">
              Easy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}