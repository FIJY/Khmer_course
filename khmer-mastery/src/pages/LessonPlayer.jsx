import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { supabase } from '../supabaseClient';
import { Volume2, ArrowRight, BookOpen, HelpCircle, RotateCcw, Check, X } from 'lucide-react';
import { updateSRSItem } from '../services/srsService';

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  // НОВЫЕ СОСТОЯНИЯ ДЛЯ ФИДБЕКА
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

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

  const playAudio = (file) => {
    if (!file) return;
    const audio = new Audio(`/sounds/${file}`);
    audio.play().catch(e => console.log("Audio missing:", file));
  };

  const handleNext = async (quality = 3) => {
    const currentItem = items[step];
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && (currentItem.type === 'vocab_card' || currentItem.type === 'quiz')) {
        await updateSRSItem(user.id, currentItem.id, quality);
      }
    } catch (err) { console.error(err); }

    // Сбрасываем состояния перед следующим шагом
    setIsFlipped(false);
    setSelectedOption(null);
    setIsCorrect(null);

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

  // НОВАЯ ЛОГИКА ОБРАБОТКИ ОТВЕТА
  const handleQuizAnswer = (opt, correct) => {
    if (selectedOption !== null) return; // Защита от повторных кликов

    const isRight = opt === correct;
    setSelectedOption(opt);
    setIsCorrect(isRight);

    // Озвучка: ищем файл в audio_map для выбранного варианта
    if (items[step].data.audio_map && items[step].data.audio_map[opt]) {
      playAudio(items[step].data.audio_map[opt]);
    }

    // Если правильно — ждем и идем дальше. Если нет — даем подумать.
    if (isRight) {
      setTimeout(() => handleNext(5), 1500);
    } else {
      // Через 2 секунды сбрасываем выбор, чтобы юзер попробовал снова
      setTimeout(() => {
        setSelectedOption(null);
        setIsCorrect(null);
      }, 2000);
    }
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400">Loading...</div>;

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans">
      {showConfetti && <Confetti numberOfPieces={300} recycle={false} />}

      <div className="w-full h-1.5 bg-gray-900">
        <div className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee] transition-all duration-500" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">

        {/* ТЕОРИЯ */}
        {type === 'theory' && (
          <div className="max-w-sm w-full bg-gray-900 p-8 rounded-[2rem] border border-white/5 animate-in fade-in">
            <BookOpen className="text-cyan-400 mb-6" size={28} />
            <h2 className="text-2xl font-bold mb-4">{current.title}</h2>
            <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{current.text}</p>
          </div>
        )}

        {/* КАРТОЧКА */}
        {type === 'vocab_card' && (
          <div className="perspective-1000 w-full max-w-sm h-80 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center p-8">
                <span className="text-gray-600 font-bold text-[10px] uppercase tracking-widest mb-4">English</span>
                <h2 className="text-4xl font-bold text-center">{current.front}</h2>
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gray-900 rounded-[2.5rem] border border-cyan-500/30 flex flex-col items-center justify-center p-8">
                <span className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest mb-4">Khmer</span>
                <h2 className="text-5xl font-bold text-center mb-2">{current.back}</h2>
                <p className="text-xl text-cyan-400 font-medium mb-10">{current.pronunciation}</p>
                <button onClick={(e) => { e.stopPropagation(); playAudio(current.audio); }} className="p-5 bg-cyan-500 rounded-full text-black shadow-lg active:scale-90 transition-transform">
                  <Volume2 size={32} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* КВИЗ С ФИДБЕКОМ */}
        {type === 'quiz' && (
          <div className="max-w-sm w-full space-y-4 animate-in fade-in">
             <div className="flex items-center gap-2 text-cyan-500/50 mb-4">
                <HelpCircle size={16}/>
                <span className="text-[10px] font-black uppercase tracking-widest">Knowledge Check</span>
             </div>
             <h2 className="text-2xl font-bold mb-8 leading-tight">{current.question}</h2>
             {current.options.map((opt, i) => {
               const isThisSelected = selectedOption === opt;
               const buttonStyle = isThisSelected
                 ? (isCorrect ? 'border-green-500 bg-green-500/10 text-green-400' : 'border-red-500 bg-red-500/10 text-red-400')
                 : 'border-white/5 bg-gray-900 hover:border-cyan-500/50';

               return (
                 <button
                   key={i}
                   disabled={selectedOption !== null}
                   onClick={() => handleQuizAnswer(opt, current.correct_answer)}
                   className={`w-full p-5 border-2 rounded-2xl text-left transition-all text-lg font-medium flex justify-between items-center ${buttonStyle}`}
                 >
                   {opt}
                   {isThisSelected && (isCorrect ? <Check size={20} /> : <X size={20} />)}
                 </button>
               );
             })}
          </div>
        )}
      </div>

      <div className="p-8">
        {type !== 'quiz' && (
          <button onClick={() => handleNext(3)} className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 text-black rounded-[1.5rem] font-black text-xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all uppercase tracking-widest">
            {step === items.length - 1 ? 'Finish' : 'Next'} <ArrowRight size={24} />
          </button>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}