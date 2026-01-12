import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Volume2, ArrowRight, X, Gem, CheckCircle2,
  AlertCircle, Trophy, BookOpen
} from 'lucide-react';
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
  const [isFinished, setIsFinished] = useState(false);

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
    new Audio(`/sounds/${audioFile}`).play().catch(() => {});
  };
  const markLessonCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Записываем завершение урока в таблицу user_progress
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: id, // ID берем из useParams()
          is_completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_id' }); // Если запись уже есть — обновляем

      if (error) throw error;
      console.log("Lesson marked as completed!");
    } catch (err) {
      console.error("Error saving lesson progress:", err);
    }
  };

  const handleNext = async (quality = 3) => {
    const currentItem = items[step];
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user && (currentItem.type === 'vocab_card' || currentItem.type === 'quiz')) {
      await updateSRSItem(session.user.id, currentItem.id, quality);
    }

    if (step < items.length - 1) {
      setStep(step + 1);
      setIsFlipped(false);
      setSelectedOption(null);
    } else {
      // ВАЖНО: Сначала сохраняем в базу, потом показываем финальный экран
      await markLessonCompleted();
      setIsFinished(true);
    }
  };

  if (loading) return <div className="h-[100dvh] bg-black flex items-center justify-center text-cyan-400 font-black italic">SYNCING...</div>;

  if (isFinished) {
    return (
      <div className="h-[100dvh] bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <Trophy size={64} className="text-emerald-400 mb-8" />
        <h1 className="text-4xl font-black italic uppercase mb-2">Complete!</h1>
        <div className="bg-gray-900/50 p-8 rounded-[2.5rem] w-full max-w-sm mb-12">
          <div className="flex justify-between items-center text-white text-2xl font-black italic">
            <div className="flex items-center gap-3"><Gem className="text-emerald-500" /><span>+50</span></div>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Gems</span>
          </div>
        </div>
        <button onClick={() => navigate('/map')} className="w-full max-w-sm py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95">Back to Map</button>
      </div>
    );
  }

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <div className="h-[100dvh] flex flex-col bg-black text-white overflow-hidden font-sans relative">
      <header className="p-4 flex-shrink-0 border-b border-white/5 bg-gray-900/20 z-20">
        <div className="flex justify-between items-center max-w-lg mx-auto w-full">
          <button onClick={() => navigate('/map')} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
          <div className="text-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-1">{lessonInfo?.title}</h2>
            <div className="w-24 h-1 bg-gray-900 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
            </div>
          </div>
          <Gem size={20} className="text-emerald-500/50" />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center z-10">
        <div className="w-full max-w-sm my-auto py-8">
          {type === 'vocab_card' && (
            <div className="w-full" onClick={() => { setIsFlipped(!isFlipped); if(!isFlipped) playAudio(current.audio); }}>
              <div className={`relative h-[22rem] transition-all duration-500 preserve-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-gray-600 font-black text-[10px] uppercase mb-8 tracking-widest">Meaning</span>
                  <h2 className="text-3xl font-black italic tracking-tighter leading-tight">{current.front}</h2>
                </div>
                <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-cyan-500 font-black text-[10px] uppercase mb-8 tracking-widest">Khmer</span>
                  <h2 className="text-4xl font-black mb-3">{current.back}</h2>
                  <p className="text-xl text-cyan-400 font-bold italic mb-6">{current.pronunciation}</p>
                  <div className="p-5 bg-cyan-500 rounded-full text-black shadow-lg"><Volume2 size={28} /></div>
                </div>
              </div>
            </div>
          )}

          {type === 'quiz' && (
            <div className="w-full">
               <h2 className="text-xl font-black mb-10 italic uppercase text-center tracking-tighter leading-tight">{current.question}</h2>
               <div className="space-y-3">
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
                       className={`w-full p-5 border rounded-2xl text-left font-bold transition-all text-sm ${btnClass}`}>{opt}</button>
                   );
                 })}
               </div>
            </div>
          )}

          {type === 'theory' && (
            <div className="w-full bg-gray-900 border border-white/10 p-10 rounded-[3.5rem] text-center translate-z-0">
              <BookOpen className="text-cyan-500/20 mx-auto mb-4" size={32} />
              <h2 className="text-xl font-black italic uppercase text-cyan-400 mb-4 tracking-tighter leading-tight">{current.title}</h2>
              <p className="text-base text-gray-300 italic leading-relaxed">{current.text}</p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER: Только для карточек и теории */}
      {type !== 'quiz' && (
        <footer className="px-8 pt-4 pb-16 flex-shrink-0 bg-black/80 backdrop-blur-md border-t border-white/5 z-20">
          <button onClick={() => handleNext(3)}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
            Continue <ArrowRight size={20} />
          </button>
        </footer>
      )}

      {/* MODAL FEEDBACK: Появляется поверх квиза */}
      {selectedOption && (
        <div className="absolute inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gray-900 border-t-2 border-white/10 rounded-t-[3rem] p-10 pb-16 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] translate-z-0 animate-in slide-in-from-bottom-full duration-500">
            <div className="max-w-sm mx-auto">
              <div className="flex items-center gap-4 mb-4">
                {selectedOption === current.correct_answer ?
                  <CheckCircle2 size={32} className="text-emerald-500" /> :
                  <AlertCircle size={32} className="text-red-500" />
                }
                <div>
                  <h3 className={`text-xl font-black uppercase italic ${selectedOption === current.correct_answer ? 'text-emerald-500' : 'text-red-500'}`}>
                    {selectedOption === current.correct_answer ? 'Awesome!' : 'Correct Answer:'}
                  </h3>
                  {selectedOption !== current.correct_answer && (
                    <p className="text-white font-bold text-lg">{current.correct_answer}</p>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm italic mb-10 leading-relaxed">{current.explanation}</p>
              <button onClick={() => handleNext(selectedOption === current.correct_answer ? 5 : 1)}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl ${selectedOption === current.correct_answer ? 'bg-emerald-500 text-white' : 'bg-white text-black'}`}>
                Next Step <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; -webkit-perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .preserve-3d { transform-style: preserve-3d; -webkit-transform-style: preserve-3d; }
        .translate-z-0 { transform: translateZ(0); -webkit-transform: translateZ(0); }
      `}</style>
    </div>
  );
}