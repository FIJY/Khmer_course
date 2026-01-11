import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { updateSRSItem } from '../services/srsService';
import { X, Volume2, ArrowRight, RotateCcw, Check } from 'lucide-react';

export default function SmartReview() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReviewQueue(); }, []);

  const fetchReviewQueue = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Запрос слов, время которых пришло (next_review <= NOW)
    const { data: srsItems } = await supabase
      .from('user_srs_items')
      .select('*, lesson_items(data, type)')
      .lte('next_review', new Date().toISOString())
      .order('next_review', { ascending: true });

    if (srsItems) setQueue(srsItems);
    setLoading(false);
  };

  const handleRating = async (quality) => {
    const item = queue[currentIndex];
    const { data: { user } } = await supabase.auth.getUser();

    // Обновляем интервал повторения через SRS сервис
    await updateSRSItem(user.id, item.item_id, quality);

    setIsFlipped(false);
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate('/profile'); // Возвращаемся, когда всё повторили
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400">⏳ LOADING QUEUE...</div>;

  if (queue.length === 0) return (
    <div className="h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
        <Check size={40} className="text-emerald-500" />
      </div>
      <h2 className="text-2xl font-black uppercase italic mb-2">Memory is <span className="text-emerald-400">Fresh</span></h2>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">You've reviewed everything for now. Come back tomorrow!</p>
      <button onClick={() => navigate('/profile')} className="mt-10 text-cyan-400 font-black uppercase text-[10px] tracking-widest border-b border-cyan-400/30 pb-1">Go to Profile</button>
    </div>
  );

  const currentItem = queue[currentIndex].lesson_items;
  const wordData = currentItem.data;

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans overflow-hidden">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-white/5">
        <button onClick={() => navigate('/profile')} className="text-gray-600 hover:text-white"><X size={24} /></button>
        <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Smart Review: {currentIndex + 1} / {queue.length}</span>
        <div className="w-10"></div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-900">
        <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }} />
      </div>

      {/* Review Card */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="perspective-1000 w-full max-w-sm h-96" onClick={() => setIsFlipped(!isFlipped)}>
          <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center p-8">
               <h2 className="text-4xl font-bold text-center mb-4">{wordData.front}</h2>
               <div className="text-[10px] font-black uppercase text-gray-700 tracking-widest flex items-center gap-2">
                 <RotateCcw size={12} /> Tap to reveal
               </div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gray-900 rounded-[3rem] border border-cyan-500/30 flex flex-col items-center justify-center p-8 text-center">
               <h2 className="text-5xl font-bold text-white mb-2">{wordData.back}</h2>
               <p className="text-xl text-cyan-400 font-medium mb-10">{wordData.pronunciation}</p>
               <button onClick={(e) => { e.stopPropagation(); new Audio(`/sounds/${wordData.audio}`).play(); }} className="p-5 bg-cyan-500 rounded-full text-black shadow-lg">
                 <Volume2 size={24} />
               </button>
            </div>
          </div>
        </div>

        {/* Rating Buttons - Появляются только после того, как перевернули карточку */}
        {isFlipped && (
          <div className="mt-12 grid grid-cols-3 gap-3 w-full max-w-sm animate-in fade-in slide-in-from-bottom-4">
            <button onClick={() => handleRating(1)} className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-[10px] font-black uppercase tracking-tighter text-red-400">Forgot</button>
            <button onClick={() => handleRating(3)} className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl text-[10px] font-black uppercase tracking-tighter text-orange-400">Hard</button>
            <button onClick={() => handleRating(5)} className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-[10px] font-black uppercase tracking-tighter text-emerald-400">Easy</button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `.perspective-1000 { perspective: 1000px; } .preserve-3d { transform-style: preserve-3d; } .backface-hidden { backface-visibility: hidden; } .rotate-y-180 { transform: rotateY(180deg); }`}} />
    </div>
  );
}