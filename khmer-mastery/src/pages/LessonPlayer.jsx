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
  X,
  Gem
} from 'lucide-react';
import { updateSRSItem } from '../services/srsService';

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [loading, setLoading] = useState(true);

  // Состояния для квиза
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);

  useEffect(() => {
    fetchContent();
  }, [id]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('lesson_id', id)
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data) setItems(data);
    } catch (err) {
      console.error("Error fetching lesson content:", err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (file) => {
    if (!file) return;
    new Audio(`/sounds/${file}`).play().catch(() => console.log("Audio missing"));
  };

  const handleNext = async (quality = 3) => {
    const currentItem = items[step];

    // Сохраняем прогресс в систему SRS
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && (currentItem.type === 'vocab_card' || currentItem.type === 'quiz')) {
        await updateSRSItem(user.id, currentItem.id, quality);
      }
    } catch (err) {
      console.error("SRS error:", err);
    }

    setIsFlipped(false);
    setSelectedOption(null);
    setIsCorrect(null);

    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      completeLesson();
    }
  };

// Логика в LessonPlayer.jsx
 const completeLesson = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  // Проверяем, был ли урок пройден ранее
  const { data: existingProgress } = await supabase
    .from('user_progress')
    .select('is_completed')
    .eq('user_id', user.id)
    .eq('lesson_id', Number(id))
    .single();

  if (!existingProgress) {
    // Если проходим первый раз — даем 50 гемов
    console.log("First time! +50 Gems");
  } else {
    // Если повторно — даем только 5 гемов
    console.log("Review! +5 Gems");
  }

  // Обновляем базу...
};;

  const handleQuizAnswer = (opt, correct) => {
    if (selectedOption !== null) return;

    const isRight = opt === correct;
    setSelectedOption(opt);
    setIsCorrect(isRight);

    if (items[step].data.audio_map && items[step].data.audio_map[opt]) {
      playAudio(items[step].data.audio_map[opt]);
    }

    // Если правильно — автопереход через паузу. Если нет — ждем действий пользователя.
    if (isRight) {
      setTimeout(() => handleNext(5), 1500);
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

      {/* HEADER */}
      <div className="p-4 flex justify-between items-center bg-black/50 border-b border-white/5 backdrop-blur-md">
        <button onClick={() => navigate('/map')} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 block mb-1">Practice Mode</span>
          <span className="text-xs font-bold text-cyan-400 uppercase">Part {id}</span>
        </div>

        <div className="w-10 h-10 flex items-center justify-center">
          <Gem size={20} className="text-emerald-500/50" />
        </div>
      </div>

      {/* PROGRESS BAR */}
      <div className="w-full h-1 bg-gray-900">
        <div
          className="h-full bg-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)] transition-all duration-700"
          style={{ width: `${((step + 1) / items.length) * 100}%` }}
        />
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-y-auto">

        {/* THEORY */}
        {type === 'theory' && (
          <div className="max-w-sm w-full bg-gray-900/50 p-8 rounded-[2.5rem] border border-white/5 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-cyan-500/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20">
              <BookOpen className="text-cyan-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-4">{current.title}</h2>
            <p className="text-gray-400 leading-relaxed text-lg italic">{current.text}</p>
          </div>
        )}

        {/* VOCAB CARD */}
        {type === 'vocab_card' && (
          <div className="perspective-1000 w-full max-w-sm h-80 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center p-8">
                <span className="text-gray-600 font-bold text-[10px] uppercase tracking-[0.3em] mb-6">English</span>
                <h2 className="text-4xl font-bold text-center tracking-tight">{current.front}</h2>
                <div className="mt-12 text-gray-700 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <RotateCcw size={14} /> Tap to flip
                </div>
              </div>

              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gray-900 rounded-[3rem] border border-cyan-500/30 flex flex-col items-center justify-center p-8">
                <span className="text-cyan-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-6">Khmer</span>
                <h2 className="text-5xl font-bold text-center mb-2">{current.back}</h2>
                <p className="text-xl text-cyan-400 font-medium mb-10">{current.pronunciation}</p>
                <button
                  onClick={(e) => { e.stopPropagation(); playAudio(current.audio); }}
                  className="p-6 bg-cyan-500 rounded-full text-black shadow-lg active:scale-90 transition-transform"
                >
                  <Volume2 size={32} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QUIZ WITH FEEDBACK */}
        {type === 'quiz' && (
          <div className="max-w-sm w-full space-y-4 animate-in fade-in">
             <div className="flex items-center gap-2 text-cyan-500/40 mb-2">
                <HelpCircle size={16}/>
                <span className="text-[10px] font-black uppercase tracking-widest">Knowledge Check</span>
             </div>
             <h2 className="text-2xl font-bold mb-6 leading-tight">{current.question}</h2>

             <div className="space-y-3">
               {current.options.map((opt, i) => {
                 const isThisSelected = selectedOption === opt;
                 const isThisCorrect = opt === current.correct_answer;

                 let btnStyle = 'border-white/5 bg-gray-900/50 text-gray-300';
                 if (selectedOption !== null) {
                   if (isThisCorrect) btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-400';
                   else if (isThisSelected) btnStyle = 'border-red-500 bg-red-500/10 text-red-400';
                   else btnStyle = 'border-white/5 bg-gray-900/20 text-gray-600';
                 }

                 return (
                   <button
                     key={i}
                     disabled={selectedOption !== null}
                     onClick={() => handleQuizAnswer(opt, current.correct_answer)}
                     className={`w-full p-5 border-2 rounded-[1.5rem] text-left transition-all text-lg font-bold flex justify-between items-center ${btnStyle}`}
                   >
                     {opt}
                     {selectedOption !== null && isThisCorrect && <Check size={20} />}
                     {isThisSelected && !isCorrect && <X size={20} />}
                   </button>
                 );
               })}
             </div>

             {/* WRONG ANSWER EXPLANATION */}
             {selectedOption !== null && !isCorrect && (
               <div className="mt-6 p-6 bg-red-500/5 border border-red-500/20 rounded-[2rem] animate-in slide-in-from-top-2">
                 <p className="text-red-400 text-[10px] font-black uppercase tracking-widest mb-2">Explanation</p>
                 <p className="text-gray-400 text-sm italic leading-relaxed">{current.explanation || "Take a look at the correct answer highlighted in green."}</p>
                 <button
                   onClick={() => { setSelectedOption(null); setIsCorrect(null); }}
                   className="mt-4 text-cyan-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-cyan-300"
                 >
                   <RotateCcw size={12} /> Try Again
                 </button>
               </div>
             )}
          </div>
        )}

      </div>

      {/* FOOTER ACTION */}
      <div className="p-8 bg-black border-t border-white/5">
        {type !== 'quiz' ? (
          <button
            onClick={() => handleNext(3)}
            className="w-full py-5 bg-cyan-500 hover:bg-cyan-400 text-black rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all uppercase tracking-widest"
          >
            {step === items.length - 1 ? 'Finish Lesson' : 'Continue'} <ArrowRight size={20} />
          </button>
        ) : (
          // Если ответ верный, но автопереход еще не случился, даем нажать Continue вручную
          selectedOption !== null && isCorrect && (
            <button
              onClick={() => handleNext(5)}
              className="w-full py-5 bg-emerald-500 text-black rounded-2xl font-black text-lg flex items-center justify-center gap-3 animate-in fade-in"
            >
              Continue <ArrowRight size={20} />
            </button>
          )
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