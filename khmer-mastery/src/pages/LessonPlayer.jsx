import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Volume2, ArrowRight, X, Gem } from 'lucide-react';
import { updateSRSItem } from '../services/srsService';

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lessonInfo, setLessonInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  // Новое состояние для квиза
  const [selectedOption, setSelectedOption] = useState(null);

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
    audio.play().catch(e => console.log("Audio play error:", audioFile));
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
      setSelectedOption(null); // Сбрасываем выбор
    } else {
      navigate('/map');
    }
  };

  const handleQuizChoice = (opt) => {
    if (selectedOption) return; // Запрещаем повторный клик

    const isCorrect = opt === items[step].data.correct_answer;
    setSelectedOption(opt);

    // Играем системный звук
    playAudio(isCorrect ? 'success.mp3' : 'error.mp3');

    // Задержка, чтобы пользователь увидел результат
    setTimeout(() => {
      handleNext(isCorrect ? 5 : 1);
    }, 1500);
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic">SYNCING...</div>;

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <div className="h-screen flex flex-col bg-black text-white overflow-hidden font-sans">
      <header className="p-4 flex justify-between items-center border-b border-white/5 bg-gray-900/20">
        <button onClick={() => navigate('/map')} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
        <div className="text-center">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-1">{lessonInfo?.title}</h2>
          <div className="w-32 h-1 bg-gray-900 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-500 transition-all" style={{ width: `${((step + 1) / items.length) * 100}%` }} />
          </div>
        </div>
        <Gem size={20} className="text-emerald-500/50" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {type === 'vocab_card' && (
          <div className="w-full max-w-sm" onClick={() => { setIsFlipped(!isFlipped); if(!isFlipped) playAudio(current.audio); }}>
            <div className={`relative h-96 transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-10 text-center">
                <span className="text-gray-600 font-black text-[10px] uppercase mb-8 tracking-widest">Meaning</span>
                <h2 className="text-4xl font-black italic tracking-tighter">{current.front}</h2>
              </div>
              <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-10 text-center">
                <span className="text-cyan-500 font-black text-[10px] uppercase mb-8 tracking-widest">Khmer</span>
                <h2 className="text-5xl font-black mb-4">{current.back}</h2>
                <p className="text-2xl text-cyan-400 font-bold italic mb-10">{current.pronunciation}</p>
                <div className="p-6 bg-cyan-500 rounded-full text-black"><Volume2 size={32} /></div>
              </div>
            </div>
          </div>
        )}

        {type === 'quiz' && (
          <div className="w-full max-w-sm">
             <h2 className="text-2xl font-black mb-10 italic uppercase text-center">{current.question}</h2>
             <div className="space-y-3">
               {current.options.map((opt, i) => {
                 const isCorrect = opt === current.correct_answer;
                 const isSelected = selectedOption === opt;

                 // Логика цвета кнопок
                 let btnClass = "bg-gray-900/50 border-white/5 text-white";
                 if (selectedOption) {
                   if (isCorrect) btnClass = "bg-emerald-600 border-emerald-400 text-white scale-[1.02]";
                   else if (isSelected) btnClass = "bg-red-600 border-red-400 text-white opacity-70";
                   else btnClass = "bg-gray-900/20 border-white/5 text-gray-600";
                 }

                 return (
                   <button key={i} onClick={() => handleQuizChoice(opt)}
                     className={`w-full p-6 border rounded-3xl text-left font-bold transition-all duration-300 ${btnClass}`}>
                     {opt}
                   </button>
                 );
               })}
             </div>
          </div>
        )}
      </main>

      <footer className="p-8">
        {type !== 'quiz' && (
          <button onClick={() => handleNext(3)} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3">
            Continue <ArrowRight size={20} />
          </button>
        )}
      </footer>
      <style>{`.backface-hidden { backface-visibility: hidden; }`}</style>
    </div>
  );
}