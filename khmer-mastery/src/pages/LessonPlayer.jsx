import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Volume2, ArrowRight, X, CheckCircle2,
  Trophy, BookOpen, ChevronLeft, RotateCcw, Frown
} from 'lucide-react';
import { updateSRSItem } from '../services/srsService';
import VisualDecoder from '../components/VisualDecoder';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lessonInfo, setLessonInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);

  const [score, setScore] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [lessonPassed, setLessonPassed] = useState(false);

  const audioRef = useRef(null);

  useEffect(() => { fetchLessonData(); }, [id]);

  useEffect(() => {
    setCanAdvance(false);
    setIsLocked(true);
    setHasInteracted(false);
    setSelectedOption(null);
    setIsFlipped(false);

    const timer = setTimeout(() => {
        setIsLocked(false);
        if (items[step]?.type === 'theory') setCanAdvance(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [step, items]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      const { data: lesson } = await supabase.from('lessons').select('*').eq('id', id).single();
      setLessonInfo(lesson);
      const { data: itemsData } = await supabase.from('lesson_items')
        .select('*').eq('lesson_id', id).order('order_index', { ascending: true });

      setItems(itemsData || []);
      setQuizCount(itemsData.filter(i => i.type === 'quiz').length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleNext = async (quality = 3) => {
    const currentItem = items[step];
    const { data: { user } } = await supabase.auth.getUser();

    if (user && (currentItem.type === 'vocab_card' || currentItem.type === 'quiz')) {
      try { await updateSRSItem(user.id, currentItem.id, quality); }
      catch (e) { console.error(e); }
    }

    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      const threshold = 0.7;
      const pass = quizCount === 0 || (score / quizCount) >= threshold;
      setLessonPassed(pass);
      setIsFinished(true);
      if (pass && user) {
        await supabase.from('user_progress').upsert({
          user_id: user.id, lesson_id: Number(id), is_completed: true, score
        }, { onConflict: 'user_id,lesson_id' });
      }
    }
  };

  const playAudio = (audioFile) => {
    if (!audioFile) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(`/sounds/${audioFile}`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic">SYNCING...</div>;

  if (isFinished) {
    return (
      <MobileLayout withNav={true}>
        {/* Обертка flex-1 и justify-center заставит контент встать ровно по центру
            и прижать меню к самому низу */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          {lessonPassed ? (
            <>
              <Trophy size={80} className="text-emerald-400 mb-8 animate-bounce" />
              <h1 className="text-4xl font-black italic uppercase mb-2 text-white">Complete!</h1>
              <p className="text-gray-400 mb-8 text-xl font-bold">Score: {score}/{quizCount}</p>
              <Button onClick={() => navigate('/map')}>Back to Map</Button>
            </>
          ) : (
            <>
              <Frown size={80} className="text-red-500 mb-8" />
              <h1 className="text-3xl font-black italic uppercase mb-2 text-white">Review Needed</h1>
              <Button variant="danger" onClick={() => window.location.reload()}>Try Again</Button>
            </>
          )}
        </div>
      </MobileLayout>
    );
  }

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <MobileLayout withNav={true}>
      <header className="p-4 flex-shrink-0 border-b border-white/5 bg-gray-900/20 z-20">
        <div className="flex justify-between items-center w-full">
          <button onClick={() => navigate('/map')} className="p-2 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
          <div className="text-center flex-1 px-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-1 truncate">{lessonInfo?.title}</h2>
            <div className="w-24 h-1 bg-gray-900 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs"><CheckCircle2 size={16}/> {score}</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center z-10 custom-scrollbar">
        <div className="w-full my-auto py-8">
          {type === 'visual_decoder' && (
            <VisualDecoder
              data={current}
              onComplete={() => setCanAdvance(true)}
              hideDefaultButton={true}
            />
          )}

          {type === 'vocab_card' && (
            <div className="w-full cursor-pointer" onClick={() => {
                setIsFlipped(!isFlipped);
                if(!isFlipped) { playAudio(current.audio); setHasInteracted(true); setCanAdvance(true); }
            }}>
              <div className={`relative h-[22rem] transition-all duration-500 preserve-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-8 text-center">
                  <span className="text-gray-600 font-black text-[10px] uppercase mb-8 tracking-widest">Meaning</span>
                  <h2 className="text-3xl font-black italic">{current.front}</h2>
                  {!hasInteracted && <div className="absolute bottom-6 text-cyan-500 text-xs font-bold animate-pulse uppercase tracking-widest">Tap to flip</div>}
                </div>
                <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-8 text-center">
                  <h2 className="text-4xl font-black mb-3">{current.back}</h2>
                  <p className="text-xl text-cyan-400 font-bold italic mb-6">{current.pronunciation}</p>
                  <div className="p-5 bg-cyan-500 rounded-full text-black shadow-lg"><Volume2 size={28} /></div>
                </div>
              </div>
            </div>
          )}

          {type === 'quiz' && (
            <div className="w-full">
               <h2 className="text-xl font-black mb-10 italic uppercase text-center">{current.question}</h2>
               <div className="space-y-3">
                 {current.options.map((opt, i) => {
                   const isCorrect = opt === current.correct_answer;
                   const isSelected = selectedOption === opt;
                   let btnClass = "bg-gray-900/50 border-white/5 text-white";
                   if (selectedOption) {
                     if (isCorrect) btnClass = "bg-emerald-600 border-emerald-400 text-white";
                     else if (isSelected) btnClass = "bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.2)]";
                     else btnClass = "bg-gray-900/20 border-white/5 text-gray-700";
                   }
                   return (
                     <button key={i} disabled={!!selectedOption} onClick={() => {
                        setSelectedOption(opt);
                        playAudio(isCorrect ? 'success.mp3' : 'error.mp3');
                        if (isCorrect) setScore(s => s + 1);
                        setCanAdvance(true);
                     }} className={`w-full p-5 border rounded-2xl text-left font-bold transition-all text-sm ${btnClass}`}>{opt}</button>
                   );
                 })}
               </div>
            </div>
          )}

          {type === 'theory' && (
            <div className="w-full bg-gray-900 border border-white/10 p-10 rounded-[3.5rem] text-center">
              <BookOpen className="text-cyan-500/20 mx-auto mb-4" size={32} />
              <h2 className="text-xl font-black italic uppercase text-cyan-400 mb-4">{current.title}</h2>
              <p className="text-base text-gray-300 italic leading-relaxed">{current.text}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-white/5 bg-black/80 backdrop-blur-md z-20">
        <div className="flex gap-3">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className={`p-5 rounded-2xl border transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'bg-gray-900 border-white/10 text-white active:scale-95'}`}
          >
            <ChevronLeft size={24} />
          </button>

          <Button
            onClick={() => handleNext(selectedOption ? (selectedOption === current.correct_answer ? 5 : 1) : 3)}
            disabled={!canAdvance || isLocked}
            className="flex-1"
          >
            Continue
            {!isLocked && canAdvance && <ArrowRight size={20} />}
          </Button>
        </div>
      </footer>
    </MobileLayout>
  );
}