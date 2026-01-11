import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { supabase } from '../supabaseClient';
import { Volume2, ArrowRight, CheckCircle, Home, BookOpen, HelpCircle, RotateCcw } from 'lucide-react';
import { updateSRSItem } from '../services/srsService';


export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false); // Состояние переворота
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('lesson_id', id)
        .order('order_index', { ascending: true });
      if (data) setItems(data);
      setLoading(false);
    };
    fetchContent();
  }, [id]);

  const handleNext = async () => {
    setIsFlipped(false); // Сбрасываем карту при переходе
    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      setShowConfetti(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_progress').upsert({
          user_id: user.id, lesson_id: id, is_completed: true, updated_at: new Date()
        }, { onConflict: 'user_id, lesson_id' });
      }
      setTimeout(() => navigate('/map'), 5000);
    }
  };

  const playAudio = (file) => {
    if (!file) return;
    const audio = new Audio(`/sounds/${file}`);
    audio.play().catch(e => console.log("Audio file missing"));
  };

  if (loading) return <div className="h-screen bg-gray-900 flex items-center justify-center text-emerald-400">Loading...</div>;

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden font-sans">
      {showConfetti && <Confetti numberOfPieces={300} recycle={false} />}

      {/* Прогресс */}
      <div className="w-full h-1.5 bg-gray-800">
        <div className="h-full bg-emerald-500 transition-all duration-500 shadow-[0_0_10px_#10b981]" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">

        {/* ТЕОРИЯ */}
        {type === 'theory' && (
          <div className="max-w-sm w-full bg-gray-800 p-8 rounded-[2rem] border-2 border-emerald-500/20 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="bg-emerald-500/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <BookOpen className="text-emerald-400" size={28} />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">{current.title}</h2>
            <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">{current.text}</p>
          </div>
        )}

        {/* ПЕРЕВОРАЧИВАЮЩАЯСЯ КАРТОЧКА */}
        {type === 'vocab_card' && (
          <div className="perspective-1000 w-full max-w-sm h-80 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

              {/* ПЕРЕДНЯЯ СТОРОНА (English/Front) */}
              <div className="absolute inset-0 backface-hidden bg-gray-800 rounded-[2.5rem] border-2 border-gray-700 flex flex-col items-center justify-center p-8 shadow-2xl">
                <span className="text-emerald-500/40 font-mono text-xs uppercase tracking-[0.3em] mb-4">English</span>
                <h2 className="text-4xl font-bold text-center text-white">{current.front}</h2>
                <div className="mt-8 text-gray-500 flex items-center gap-2 text-sm uppercase font-bold tracking-widest">
                  <RotateCcw size={16} /> Tap to flip
                </div>
              </div>

              {/* ЗАДНЯЯ СТОРОНА (Khmer/Back) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gray-800 rounded-[2.5rem] border-2 border-emerald-500/50 flex flex-col items-center justify-center p-8 shadow-emerald-500/10 shadow-2xl">
                <span className="text-emerald-500 font-mono text-xs uppercase tracking-[0.3em] mb-4">Khmer</span>
                <h2 className="text-5xl font-bold text-center text-white mb-2">{current.back}</h2>
                <p className="text-xl text-emerald-400 font-medium mb-10">{current.pronunciation}</p>

                <button
                  onClick={(e) => { e.stopPropagation(); playAudio(current.audio); }}
                  className="p-5 bg-emerald-500 rounded-full hover:bg-emerald-400 transition-colors shadow-lg active:scale-90"
                >
                  <Volume2 size={32} className="text-white" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* КВИЗ */}
        {type === 'quiz' && (
          <div className="max-w-sm w-full space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-yellow-500 mb-6 bg-yellow-500/10 w-fit px-4 py-1 rounded-full">
              <HelpCircle size={18}/> <span className="text-[10px] font-black uppercase tracking-tighter">Knowledge Check</span>
            </div>
            <h2 className="text-2xl font-bold mb-8 leading-tight">{current.question}</h2>
            {current.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  if (opt === current.correct_answer) handleNext();
                  else alert("❌ Try again!");
                }}
                className="w-full p-5 bg-gray-800 border-2 border-gray-700 rounded-2xl text-left hover:border-emerald-500 hover:bg-gray-750 transition-all text-lg font-medium active:scale-95"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* Футер с кнопкой */}
      <div className="p-8 bg-gray-900">
        <button onClick={handleNext} className="w-full py-5 bg-emerald-600 rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-transform">
          {step === items.length - 1 ? 'FINISH LESSON' : 'NEXT STEP'} <ArrowRight size={24} />
        </button>
      </div>

      {/* CSS для анимации переворота */}
      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  const handleNext = async (quality = 3) => {
    // Если это карточка или квиз — сохраняем прогресс в SRS
    const currentItem = items[step];
    const { data: { user } } = await supabase.auth.getUser();

    if (user && (currentItem.type === 'vocab_card' || currentItem.type === 'quiz')) {
      // quality: 5 для правильного квиза, 3 для просмотра карточки
      await updateSRSItem(user.id, currentItem.id, quality);
    }

    setIsFlipped(false);
    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      // ... логика завершения урока
    }
  };

  // В КВИЗЕ при правильном ответе вызывай:
  // onClick={() => {
  //   if (opt === current.correct_answer) handleNext(5); // 5 = отлично
  //   else alert("❌ Try again!");
  // }}
  );
}