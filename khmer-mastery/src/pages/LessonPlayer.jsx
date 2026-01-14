import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Volume2, ArrowRight, X, Gem, CheckCircle2,
  AlertCircle, Trophy, BookOpen, ChevronLeft // <--- 1. Добавлена иконка
} from 'lucide-react';
import { updateSRSItem } from '../services/srsService';
import VisualDecoder from '../components/VisualDecoder';

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

  const markLessonCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from('user_progress').upsert({
          user_id: user.id,
          lesson_id: Number(id),
          is_completed: true,
          completed_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_id' });
    } catch (err) { console.error("System error:", err); }
  };

  const handleNext = async (quality = 3) => {
    const currentItem = items[step];
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user && (currentItem.type === 'vocab_card' || currentItem.type === 'quiz')) {
      try { await updateSRSItem(session.user.id, currentItem.id, quality); }
      catch (e) { console.error("SRS update failed:", e); }
    }

    if (step < items.length - 1) {
      setStep(step + 1);
      setIsFlipped(false);
      setSelectedOption(null);
    } else {
      await markLessonCompleted();
      setIsFinished(true);
    }
  };

  // --- 2. НОВАЯ ФУНКЦИЯ НАЗАД ---
  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      setIsFlipped(false);
      setSelectedOption(null);
    }
  };

  const playAudio = (audioFile) => {
    if (!audioFile) return;

    // Мягкий сброс звука перед новым
    if (window.currentAudio) {
        window.currentAudio.pause();
        window.currentAudio.currentTime = 0;
    }

    const audio = new Audio(`/sounds/${audioFile}`);
    window.currentAudio = audio;
    audio.play().catch(() => {});
  };

  const getAudioForOption = (text) => {
    if (!text) return null;
    const cleanText = text.trim();
    const vocabCard = items.find(item =>
      item.type === 'vocab_card' && (
         item.data.back?.trim() === cleanText ||
         item.data.front?.trim() === cleanText
      )
    );
    if (vocabCard?.data?.audio) return vocabCard.data.audio;
    return null;
  };

  const shuffledOptions = useMemo(() => {
    const current = items[step];
    if (current?.type !== 'quiz') return [];
    return [...current.data.options].sort(() => Math.random() - 0.5);
  }, [items, step]);

  if (loading) return <div className="h-[100dvh] bg-black flex items-center justify-center text-cyan-400 font-black italic">SYNCING...</div>;

  if (isFinished) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="w-full max-w-lg h-[100dvh] flex flex-col items-center justify-center p-8 text-center border-x border-white/5 shadow-2xl">
          <Trophy size={64} className="text-emerald-400 mb-8" />
          <h1 className="text-4xl font-black italic uppercase mb-2 text-white">Complete!</h1>
          <button onClick={() => navigate('/map')} className="w-full max-w-sm py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-xl mt-12">Back to Map</button>
        </div>
      </div>
    );
  }

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <div className="h-[100dvh] bg-black flex justify-center font-sans overflow-hidden">
      <div className="w-full max-w-lg h-full flex flex-col relative bg-black shadow-2xl border-x border-white/5">

        {/* HEADER */}
        <header className="p-4 flex-shrink-0 border-b border-white/5 bg-gray-900/20 z-20">
          <div className="flex justify-between items-center w-full">

            {/* 3. КНОПКИ НАВИГАЦИИ (ЛЕВЫЙ УГОЛ) */}
            <div className="flex items-center gap-2">
                <button onClick={() => navigate('/map')} className="p-2 text-gray-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                {step > 0 && (
                    <button onClick={handlePrev} className="p-2 text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                        <ChevronLeft size={24} />
                    </button>
                )}
            </div>

            <div className="text-center flex-1 px-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-1 truncate">{lessonInfo?.title}</h2>
              <div className="w-24 h-1 bg-gray-900 rounded-full overflow-hidden mx-auto">
                <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
              </div>
            </div>
            <Gem size={20} className="text-emerald-500/50" />
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center z-10 custom-scrollbar">
          <div className="w-full my-auto py-8">

            {/* --- VISUAL DECODER --- */}
            {type === 'visual_decoder' && (
              <VisualDecoder data={current} onComplete={() => handleNext(5)} />
            )}

            {/* --- VOCAB CARD --- */}
            {type === 'vocab_card' && (
              <div className="w-full cursor-pointer" onClick={() => { setIsFlipped(!isFlipped); if(!isFlipped) playAudio(current.audio); }}>
                <div className={`relative h-[22rem] transition-all duration-500 preserve-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                  <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-8 text-center">
                    <span className="text-gray-600 font-black text-[10px] uppercase mb-8 tracking-widest">Meaning</span>
                    <h2 className="text-3xl font-black italic tracking-tighter leading-tight">{current.front}</h2>
                  </div>
                  <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-8 text-center">
                    <span className="text-cyan-500 font-black text-[10px] uppercase mb-8 tracking-widest">Khmer</span>
                    <h2 className="text-4xl font-black mb-3">{current.back}</h2>
                    <p className="text-xl text-cyan-400 font-bold italic mb-6">{current.pronunciation}</p>
                    <div className="p-5 bg-cyan-500 rounded-full text-black shadow-lg shadow-cyan-500/20"><Volume2 size={28} /></div>
                  </div>
                </div>
              </div>
            )}

            {/* --- QUIZ (4. НОВАЯ ЛОГИКА: ЗВУК СНАЧАЛА) --- */}
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
                       else if (isSelected) btnClass = "bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.2)]";
                       else btnClass = "bg-gray-900/20 border-white/5 text-gray-700";
                     }
                     return (
                       <button key={i} disabled={!!selectedOption}
                         onClick={() => {
                            setSelectedOption(opt);

                            // А. Играем звук УСПЕХА/ОШИБКИ сразу (мгновенная реакция)
                            playAudio(isCorrect ? 'success.mp3' : 'error.mp3');

                            // Б. Ищем озвучку слова
                            const wordAudio = getAudioForOption(opt);

                            // В. Если слово есть, играем его ПОСЛЕ (через 0.8с)
                            if (wordAudio) {
                                setTimeout(() => {
                                    playAudio(wordAudio);
                                }, 800);
                            }
                         }}
                         className={`w-full p-5 border rounded-2xl text-left font-bold transition-all text-sm ${btnClass}`}
                       >
                         {opt}
                       </button>
                     );
                   })}
                 </div>
              </div>
            )}

            {/* --- THEORY --- */}
            {type === 'theory' && (
              <div className="w-full bg-gray-900 border border-white/10 p-10 rounded-[3.5rem] text-center">
                <BookOpen className="text-cyan-500/20 mx-auto mb-4" size={32} />
                <h2 className="text-xl font-black italic uppercase text-cyan-400 mb-4 tracking-tighter leading-tight">{current.title}</h2>
                <p className="text-base text-gray-300 italic leading-relaxed">{current.text}</p>
              </div>
            )}
          </div>
        </main>

        {/* FOOTER */}
        {type !== 'quiz' && type !== 'visual_decoder' && (
          <footer className="px-8 pt-4 pb-16 flex-shrink-0 bg-black/80 backdrop-blur-md border-t border-white/5 z-20">
            <button onClick={() => handleNext(3)}
              className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
              Continue <ArrowRight size={20} />
            </button>
          </footer>
        )}

        {/* QUIZ FEEDBACK */}
        {selectedOption && type === 'quiz' && (
          <div className="absolute inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gray-900 border-t-2 border-white/10 rounded-t-[3rem] p-10 pb-16 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-500">
                <div className="flex items-center gap-4 mb-4">
                  {selectedOption === current.correct_answer ? <CheckCircle2 size={32} className="text-emerald-500" /> : <AlertCircle size={32} className="text-red-500" />}
                  <div>
                    <h3 className={`text-xl font-black uppercase italic ${selectedOption === current.correct_answer ? 'text-emerald-500' : 'text-red-500'}`}>{selectedOption === current.correct_answer ? 'Awesome!' : 'Correct Answer:'}</h3>
                    {selectedOption !== current.correct_answer && <p className="text-white font-bold text-lg">{current.correct_answer}</p>}
                  </div>
                </div>
                <button onClick={() => handleNext(selectedOption === current.correct_answer ? 5 : 1)} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl">Next Step <ArrowRight size={20} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}