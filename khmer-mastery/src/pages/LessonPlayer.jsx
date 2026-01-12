import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
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

  const shuffledOptions = useMemo(() => {
    const current = items[step];
    if (current?.type !== 'quiz') return [];
    return [...current.data.options].sort(() => Math.random() - 0.5);
  }, [items, step]);

  useEffect(() => { fetchLessonData(); }, [id]);

  const fetchLessonData = async () => {
    try {
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
    new Audio(`/sounds/${audioFile}`).play().catch(() => {});
  };

  const handleNext = async (quality = 3) => {
    const currentItem = items[step];
    const { data: { user } } = await supabase.auth.getUser();
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
      <header className="p-4 flex justify-between items-center border-b border-white/5 bg-gray-900/20 flex-shrink-0">
        <button onClick={() => navigate('/map')} className="p-2 text-gray-500"><X size={24} /></button>
        <div className="text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-1">{lessonInfo?.title}</h2>
          <div className="w-32 h-1 bg-gray-900 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
          </div>
        </div>
        <Gem size={20} className="text-emerald-500/50" />
      </header>

      {/* Основной контент теперь с прокруткой для длинных квизов */}
      <main className="flex-1 overflow-y-auto px-6 py-8 flex flex-col items-center">
        <div className="w-full max-w-sm flex-1 flex flex-col justify-center">
          {type === 'vocab_card' && (
            <div onClick={() => { setIsFlipped(!isFlipped); if(!isFlipped) playAudio(current.audio); }} className="w-full">
              <div className={`relative h-[22rem] transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-gray-600 font-black text-[10px] uppercase mb-4 tracking-widest">Meaning</span>
                  <h2 className="text-3xl font-black italic tracking-tighter leading-tight">{current.front}</h2>
                </div>
                <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-cyan-500 font-black text-[10px] uppercase mb-4 tracking-widest">Khmer</span>
                  <h2 className="text-4xl font-black mb-3">{current.back}</h2>
                  <p className="text-xl text-cyan-400 font-bold italic mb-6">{current.pronunciation}</p>
                  <div className="p-4 bg-cyan-500 rounded-full text-black shadow-lg"><Volume2 size={24} /></div>
                </div>
              </div>
            </div>
          )}

          {type === 'quiz' && (
            <div className="w-full">
               <h2 className="text-xl font-black mb-6 italic uppercase text-center tracking-tighter leading-tight">{current.question}</h2>
               <div className="grid gap-2 mb-6">
                 {shuffledOptions.map((opt, i) => {
                   const isCorrect = opt === current.correct_answer;
                   const isSelected = selectedOption === opt;
                   let btnClass = "bg-gray-900/50 border-white/5 text-white";
                   if (selectedOption) {
                     if (isCorrect) btnClass = "bg-emerald-600 border-emerald-400 text-white";
                     else if (isSelected) btnClass = "bg-red-600 border-red-400 text-white";
                     else btnClass = "bg-gray-900/20 border-white/5 text-gray-700";
                   }
                   return (
                     <button key={i} disabled={!!selectedOption} onClick={() => { setSelectedOption(opt); playAudio(isCorrect ? 'success.mp3' : 'error.mp3'); }}
                       className={`w-full p-4 border rounded-2xl text-left font-bold transition-all text-sm ${btnClass}`}>
                       {opt}
                     </button>
                   );
                 })}
               </div>

               {selectedOption && (
                 <div className="bg-gray-900/80 border border-white/10 p-5 rounded-2xl [transform:translateZ(0)] animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex items-center gap-3 mb-2">
                     {selectedOption === current.correct_answer ? <CheckCircle2 size={18} className="text-emerald-500" /> : <AlertCircle size={18} className="text-red-500" />}
                     <span className={`text-[10px] font-black uppercase tracking-widest ${selectedOption === current.correct_answer ? 'text-emerald-500' : 'text-red-500'}`}>
                       {selectedOption === current.correct_answer ? 'Correct!' : 'Keep Learning'}
                     </span>
                   </div>
                   <p className="text-xs text-gray-400 italic leading-relaxed">{current.explanation}</p>
                 </div>
               )}
            </div>
          )}

          {type === 'theory' && (
            <div className="w-full bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] text-center [transform:translateZ(0)]">
              <h2 className="text-xl font-black italic uppercase text-cyan-400 mb-4 leading-tight">{current.title}</h2>
              <p className="text-base text-gray-300 italic leading-relaxed">{current.text}</p>
            </div>
          )}
        </div>
      </main>

      {/* Футер с отступом для iPhone */}
      <footer className="px-8 pt-4 pb-10 flex-shrink-0 bg-black/50 backdrop-blur-sm border-t border-white/5">
        {(type !== 'quiz' || selectedOption) && (
          <button onClick={() => handleNext(selectedOption === current?.correct_answer ? 5 : 3)}
            className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
            Continue <ArrowRight size={20} />
          </button>
        )}
      </footer>

      <style>{`
        .perspective-1000 { perspective: 1000px; -webkit-perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        [transform-style:preserve-3d] { transform-style: preserve-3d; -webkit-transform-style: preserve-3d; }
      `}</style>
    </div>
  );
}