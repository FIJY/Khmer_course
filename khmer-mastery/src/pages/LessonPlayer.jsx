import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Путь к единственному файлу
import { Volume2, ArrowRight, X, Gem, CheckCircle2, AlertCircle } from 'lucide-react';
import { updateSRSItem } from '../services/srsService';

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lessonInfo, setLessonInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);

  // 1. Перемешивание ответов (чтобы правильный не всегда был первым)
  const shuffledOptions = useMemo(() => {
    const current = items[step];
    if (current?.type !== 'quiz') return [];
    return [...current.data.options].sort(() => Math.random() - 0.5);
  }, [items, step]);

  useEffect(() => { fetchLessonData(); }, [id]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      const { data: lesson } = await supabase.from('lessons').select('*').eq('id', id).single();
      setLessonInfo(lesson);

      const { data: itemsData } = await supabase.from('lesson_items')
        .select('*').eq('lesson_id', id).order('order_index', { ascending: true });
      setItems(itemsData || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const playAudio = (audioFile) => {
    if (!audioFile) return;
    const audio = new Audio(`/sounds/${audioFile}`);
    audio.play().catch(e => console.log("Audio error:", audioFile));
  };

  const handleNext = async (quality = 3) => {
    const currentItem = items[step];
    const { data: { user } } = await supabase.auth.getUser();

    // Записываем прогресс для статистики B1
    if (user && (currentItem.type === 'vocab_card' || currentItem.type === 'quiz')) {
      await updateSRSItem(user.id, currentItem.id, quality);
    }

    if (step < items.length - 1) {
      setStep(step + 1);
      setIsFlipped(false);
      setSelectedOption(null);
    } else {
      navigate('/map');
    }
  };

  if (loading) return <div className="h-[100dvh] bg-black flex items-center justify-center text-cyan-400 font-black italic">SYNCING...</div>;

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white overflow-hidden font-sans">
      {/* HEADER: flex-shrink-0 чтобы не сжимался */}
      <header className="p-4 flex justify-between items-center border-b border-white/5 bg-gray-900/20 flex-shrink-0">
        <button onClick={() => navigate('/map')} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
        <div className="text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-1">
            {lessonInfo?.title || `Lesson ${id}`}
          </h2>
          <div className="w-32 h-1 bg-gray-900 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
          </div>
        </div>
        <Gem size={20} className="text-emerald-500/50" />
      </header>

      {/* MAIN: overflow-y-auto позволяет скроллить длинные квизы на iPhone */}
      <main className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center">
        <div className="w-full max-w-sm flex-1 flex flex-col justify-center">

          {/* VOCAB CARD */}
          {type === 'vocab_card' && (
            <div className="w-full" onClick={() => { setIsFlipped(!isFlipped); if(!isFlipped) playAudio(current.audio); }}>
              <div className={`relative h-[24rem] transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-10 text-center">
                  <span className="text-gray-600 font-black text-[10px] uppercase mb-8 tracking-widest">Meaning</span>
                  <h2 className="text-4xl font-black italic tracking-tighter leading-tight">{current.front}</h2>
                </div>
                <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-10 text-center">
                  <span className="text-cyan-500 font-black text-[10px] uppercase mb-8 tracking-widest">Khmer</span>
                  <h2 className="text-5xl font-black mb-4 leading-none">{current.back}</h2>
                  <p className="text-2xl text-cyan-400 font-bold italic mb-10 tracking-tight">{current.pronunciation}</p>
                  <div className="p-6 bg-cyan-500 rounded-full text-black shadow-lg shadow-cyan-500/20"><Volume2 size={32} /></div>
                </div>
              </div>
            </div>
          )}

          {/* QUIZ: С пояснением и перемешиванием */}
          {type === 'quiz' && (
            <div className="w-full">
               <h2 className="text-2xl font-black mb-8 italic uppercase text-center tracking-tighter leading-tight">{current.question}</h2>
               <div className="space-y-3 mb-6">
                 {shuffledOptions.map((opt, i) => {
                   const isCorrect = opt === current.correct_answer;
                   const isSelected = selectedOption === opt;
                   let btnClass = "bg-gray-900/50 border-white/5 text-white";

                   if (selectedOption) {
                     if (isCorrect) btnClass = "bg-emerald-600 border-emerald-400 text-white";
                     else if (isSelected) btnClass = "bg-red-600 border-red-400 text-white opacity-80";
                     else btnClass = "bg-gray-900/20 border-white/5 text-gray-700";
                   }

                   return (
                     <button key={i} disabled={!!selectedOption}
                       onClick={() => { setSelectedOption(opt); playAudio(isCorrect ? 'success.mp3' : 'error.mp3'); }}
                       className={`w-full p-6 border rounded-3xl text-left font-bold transition-all duration-300 ${btnClass}`}>
                       {opt}
                     </button>
                   );
                 })}
               </div>

               {selectedOption && (
                 <div className="bg-gray-900/80 border border-white/10 p-6 rounded-[2rem] [transform:translateZ(0)]">
                   <div className="flex items-center gap-3 mb-2">
                     {selectedOption === current.correct_answer ? <CheckCircle2 size={20} className="text-emerald-500" /> : <AlertCircle size={20} className="text-red-500" />}
                     <span className={`text-xs font-black uppercase tracking-widest ${selectedOption === current.correct_answer ? 'text-emerald-500' : 'text-red-500'}`}>
                       {selectedOption === current.correct_answer ? 'Correct!' : 'Keep Learning'}
                     </span>
                   </div>
                   <p className="text-sm text-gray-300 italic leading-relaxed">{current.explanation}</p>
                 </div>
               )}
            </div>
          )}

          {/* THEORY: Без анимаций для Safari и с translateZ */}
          {type === 'theory' && (
            <div className="w-full bg-gray-900 border border-white/10 p-10 rounded-[3rem] text-center shadow-2xl relative z-10 [transform:translateZ(0)]">
              <h2 className="text-2xl font-black italic uppercase text-cyan-400 mb-6 tracking-tighter leading-tight">
                {current.title}
              </h2>
              <div className="h-px w-12 bg-cyan-500/30 mx-auto mb-6" />
              <p className="text-lg text-gray-300 leading-relaxed italic opacity-90">
                {current.text}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER: pb-12 решает проблему обрезки кнопки на iPhone */}
      <footer className="px-8 pt-4 pb-12 flex-shrink-0 bg-black/50 backdrop-blur-sm border-t border-white/5">
        {(type !== 'quiz' || selectedOption) && (
          <button
            onClick={() => handleNext(selectedOption === current?.correct_answer ? 5 : 1)}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
          >
            Continue <ArrowRight size={20} />
          </button>
        )}
      </footer>

      {/* Важные CSS-фиксы для Safari */}
      <style>{`
        .perspective-1000 { perspective: 1000px; -webkit-perspective: 1000px; }
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        [transform-style:preserve-3d] {
          transform-style: preserve-3d;
          -webkit-transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
}