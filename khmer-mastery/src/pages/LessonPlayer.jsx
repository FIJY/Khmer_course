import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { supabase } from '../supabaseClient';
import {
  Volume2,
  ArrowRight,
  BookOpen,
  HelpCircle,
  RotateCcw,
  Check,
  X
} from 'lucide-react';
import { updateSRSItem } from '../services/srsService';

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Состояния для контента и прогресса
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  // Состояния для фидбека в квизах
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('lesson_id', id)
        .order('order_index', { ascending: true });

      if (error) console.error("Error fetching lesson items:", error);
      if (data) setItems(data);
      setLoading(false);
    };
    fetchContent();
  }, [id]);

  const playAudio = (file) => {
    if (!file) return;
    const audioPath = `/sounds/${file}`;
    const audio = new Audio(audioPath);
    audio.play().catch(e => console.log("Audio file missing at:", audioPath));
  };

  const handleNext = async (quality = 3) => {
    const currentItem = items[step];

    // 1. Сохраняем прогресс для Smart Review (SRS)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && (currentItem.type === 'vocab_card' || currentItem.type === 'quiz')) {
        await updateSRSItem(user.id, currentItem.id, quality);
      }
    } catch (err) {
      console.error("SRS update failed:", err);
    }

    // 2. Сбрасываем локальные состояния
    setIsFlipped(false);
    setSelectedOption(null);
    setIsCorrect(null);

    // 3. Переход или завершение урока
    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      setShowConfetti(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Отмечаем урок как пройденный
        await supabase.from('user_progress').upsert({
          user_id: user.id,
          lesson_id: Number(id),
          is_completed: true,
          updated_at: new Date()
        }, { onConflict: 'user_id, lesson_id' });
      }
      setTimeout(() => navigate('/map'), 5000);
    }
  };

  const handleQuizAnswer = (opt, correct) => {
    if (selectedOption !== null) return; // Защита от мульти-кликов

    const isRight = opt === correct;
    setSelectedOption(opt);
    setIsCorrect(isRight);

    // Авто-озвучка при выборе ответа, если она есть в мапе
    if (items[step].data.audio_map && items[step].data.audio_map[opt]) {
      playAudio(items[step].data.audio_map[opt]);
    }

    if (isRight) {
      // Если правильно — автоматический переход через паузу
      setTimeout(() => handleNext(5), 1500);
    } else {
      // Если неправильно — даем шанс попробовать снова через 2 сек
      setTimeout(() => {
        setSelectedOption(null);
        setIsCorrect(null);
      }, 2000);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center text-cyan-400">
      <div className="animate-spin text-4xl">⏳</div>
    </div>
  );

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans">
      {showConfetti && <Confetti numberOfPieces={300} recycle={false} />}

      {/* HEADER: Navigation and Lesson Info */}
      <div className="p-4 flex justify-between items-center bg-black border-b border-white/5 backdrop-blur-md">
        <button
          onClick={() => navigate('/map')}
          className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-500 hover:text-white"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block leading-none mb-1">In Progress</span>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Survival Block</span>
        </div>

        <div className="w-10 h-10 flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_#22d3ee]"></div>
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full h-1 bg-gray-900">
        <div
          className="h-full bg-cyan-500 shadow-[0_0_15px_#22d3ee] transition-all duration-700 ease-out"
          style={{ width: `${((step + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">

        {/* THEORY BLOCK */}
        {type === 'theory' && (
          <div className="max-w-sm w-full bg-gray-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-cyan-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
              <BookOpen className="text-cyan-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-4">{current.title}</h2>
            <p className="text-gray-400 leading-relaxed text-lg whitespace-pre-wrap">{current.text}</p>
          </div>
        )}

        {/* VOCAB CARD (FLIPPABLE) */}
        {type === 'vocab_card' && (
          <div className="perspective-1000 w-full max-w-sm h-80 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

              {/* Front: English */}
              <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center p-8 shadow-2xl">
                <span className="text-gray-600 font-bold text-[10px] uppercase tracking-[0.3em] mb-6">English</span>
                <h2 className="text-4xl font-bold text-center tracking-tight">{current.front}</h2>
                <div className="mt-12 text-gray-700 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <RotateCcw size={14} /> Tap to reveal
                </div>
              </div>

              {/* Back: Khmer */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gray-900 rounded-[3rem] border border-cyan-500/30 flex flex-col items-center justify-center p-8 shadow-[0_0_40px_rgba(34,211,238,0.05)]">
                <span className="text-cyan-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-6">Khmer</span>
                <h2 className="text-5xl font-bold text-center mb-2 tracking-tight">{current.back}</h2>
                <p className="text-xl text-cyan-400 font-medium mb-10 tracking-wide">{current.pronunciation}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); playAudio(current.audio); }}
                  className="p-6 bg-cyan-500 rounded-full text-black shadow-[0_10px_20px_rgba(34,211,238,0.3)] active:scale-90 transition-transform"
                >
                  <Volume2 size={32} strokeWidth={2.5} />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* QUIZ BLOCK */}
        {type === 'quiz' && (
          <div className="max-w-sm w-full space-y-4 animate-in fade-in">
             <div className="flex items-center gap-2 text-cyan-500/40 mb-4 bg-cyan-500/5 w-fit px-4 py-1 rounded-full border border-cyan-500/10">
                <HelpCircle size={14}/>
                <span className="text-[10px] font-black uppercase tracking-widest">Challenge</span>
             </div>
             <h2 className="text-2xl font-bold mb-8 leading-tight tracking-tight">{current.question}</h2>

             <div className="space-y-3">
               {current.options.map((opt, i) => {
                 const isThisSelected = selectedOption === opt;
                 const btnStyle = isThisSelected
                   ? (isCorrect ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-red-500 bg-red-500/10 text-red-400')
                   : 'border-white/5 bg-gray-900/50 hover:border-cyan-500/50 text-gray-300';

                 return (
                   <button
                     key={i}
                     disabled={selectedOption !== null}
                     onClick={() => handleQuizAnswer(opt, current.correct_answer)}
                     className={`w-full p-6 border-2 rounded-[1.5rem] text-left transition-all text-lg font-bold flex justify-between items-center group active:scale-[0.98] ${btnStyle}`}
                   >
                     {opt}
                     {isThisSelected && (
                       isCorrect ? <Check size={24} strokeWidth={3} /> : <X size={24} strokeWidth={3} />
                     )}
                   </button>
                 );
               })}
             </div>
          </div>
        )}

      </div>

      {/* FOOTER ACTION BUTTON */}
      <div className="p-10 bg-black">
        {type !== 'quiz' && (
          <button
            onClick={() => handleNext(3)}
            className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(34,211,238,0.2)] active:scale-95 transition-all uppercase tracking-[0.2em]"
          >
            {step === items.length - 1 ? 'Finish Lesson' : 'Continue'} <ArrowRight size={20} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* 3D Flip Effects */}
      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
}