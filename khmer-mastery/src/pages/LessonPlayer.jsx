import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Volume2, X, CheckCircle2, AlertCircle,
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
    setHasInteracted(false);
    setSelectedOption(null);
    setIsFlipped(false);

    if (items[step]?.type === 'theory') {
      const timer = setTimeout(() => setCanAdvance(true), 2000);
      return () => clearTimeout(timer);
    }
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
      await updateSRSItem(user.id, currentItem.id, quality);
    }

    if (step < items.length - 1) setStep(step + 1);
    else finishLesson();
  };

  const finishLesson = async () => {
    const pass = quizCount === 0 || (score / quizCount) >= 0.7;
    setLessonPassed(pass);
    setIsFinished(true);
    if (pass) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('user_progress').upsert({
        user_id: user.id, lesson_id: Number(id), is_completed: true, score
      });
    }
  };

  const playAudio = (file) => {
    if (!file) return;
    if (audioRef.current) { audioRef.current.pause(); }
    const audio = new Audio(`/sounds/${file}`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic">SYNCING...</div>;

  if (isFinished) {
    return (
      <MobileLayout withNav={false} className="justify-center items-center text-center p-8">
        {lessonPassed ? (
          <>
            <Trophy size={80} className="text-emerald-400 mb-8 animate-bounce" />
            <h1 className="text-4xl font-black italic uppercase mb-2">Complete!</h1>
            <p className="text-gray-400 mb-8 text-xl font-bold">Score: {score}/{quizCount}</p>
            <Button onClick={() => navigate('/map')}>Back to Map</Button>
          </>
        ) : (
          <>
            <Frown size={80} className="text-red-500 mb-8" />
            <h1 className="text-3xl font-black italic uppercase mb-2">Review Needed</h1>
            <Button variant="danger" onClick={() => window.location.reload()}>Try Again</Button>
          </>
        )}
      </MobileLayout>
    );
  }

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <MobileLayout withNav={false}>
      <header className="p-4 border-b border-white/5 bg-gray-900/20">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/map')} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 0}
              className={`p-2 transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'text-gray-400 hover:text-white'}`}
            >
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="text-center flex-1">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-1">{lessonInfo?.title}</h2>
            <div className="w-20 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
            </div>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 font-black text-sm w-12 justify-end">
            <CheckCircle2 size={16} /> {score}
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-8 flex flex-col items-center justify-center">
        {type === 'visual_decoder' && <VisualDecoder data={current} onComplete={() => handleNext(5)} />}

        {type === 'vocab_card' && (
          <div className="w-full h-80 perspective-1000 cursor-pointer" onClick={() => { setIsFlipped(!isFlipped); if(!isFlipped) { playAudio(current.audio); setCanAdvance(true); }}}>
            <div className={`relative w-full h-full transition-all duration-500 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center p-6">
                <span className="text-gray-500 text-[10px] font-black uppercase mb-4">Meaning</span>
                <h2 className="text-3xl font-black italic">{current.front}</h2>
              </div>
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gray-900 rounded-[2.5rem] border-2 border-cyan-500/30 flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-4xl font-black mb-2">{current.back}</h2>
                <p className="text-cyan-400 font-bold italic mb-4">{current.pronunciation}</p>
                <div className="w-12 h-12 bg-cyan-500 rounded-full flex items-center justify-center text-black shadow-lg"><Volume2 size={24} /></div>
              </div>
            </div>
          </div>
        )}

        {type === 'quiz' && (
          <div className="w-full">
            <h2 className="text-xl font-black mb-8 italic text-center uppercase">{current.question}</h2>
            <div className="space-y-3">
              {current.options.map((opt, i) => (
                <button key={i} disabled={!!selectedOption}
                  onClick={() => {
                    setSelectedOption(opt);
                    const correct = opt === current.correct_answer;
                    playAudio(correct ? 'success.mp3' : 'error.mp3');
                    if (correct) setScore(s => s + 1);
                    setCanAdvance(true);
                  }}
                  className={`w-full p-5 border rounded-2xl text-left font-bold transition-all ${
                    selectedOption === opt
                      ? (opt === current.correct_answer ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400')
                      : (selectedOption && opt === current.correct_answer ? 'bg-emerald-600/30 border-emerald-500/50' : 'bg-gray-900 border-white/5')
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'theory' && (
          <div className="w-full bg-gray-900 border border-white/10 p-8 rounded-[2.5rem] text-center">
            <BookOpen className="text-cyan-500 mx-auto mb-4 opacity-20" size={40} />
            <h2 className="text-xl font-black italic uppercase text-cyan-400 mb-4">{current.title}</h2>
            <p className="text-gray-300 leading-relaxed italic">{current.text}</p>
          </div>
        )}
      </main>

      <footer className="p-6 pb-12">
        <Button
          onClick={() => handleNext(selectedOption ? (selectedOption === current.correct_answer ? 5 : 1) : 3)}
          disabled={!canAdvance}
        >
          Next <ChevronLeft size={20} className="rotate-180" />
        </Button>
      </footer>
    </MobileLayout>
  );
}