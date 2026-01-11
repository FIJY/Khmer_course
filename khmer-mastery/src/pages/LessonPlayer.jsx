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

  useEffect(() => {
    fetchLessonData();
  }, [id]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      // 1. Загружаем заголовок урока (например, "Lesson 1.1: Greetings")
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      if (lessonError) throw lessonError;
      setLessonInfo(lesson);

      // 2. Загружаем все элементы (карточки, теорию, квизы)
      const { data: itemsData, error: itemsError } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('lesson_id', id)
        .order('order_index', { ascending: true });

      if (itemsError) throw itemsError;
      setItems(itemsData || []);
    } catch (err) {
      console.error("Error fetching lesson:", err);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioFile) => {
    if (!audioFile) return;
    // Путь к папке public/sounds/
    const audio = new Audio(`/sounds/${audioFile}`);
    audio.play().catch(e => console.error("Audio playback failed:", e));
  };

  const handleNext = async (quality = 3) => {
    const currentItem = items[step];
    const { data: { user } } = await supabase.auth.getUser();

    // Обновляем SRS прогресс, связывая его с dictionary_id для профиля
    if (user && (currentItem.type === 'vocab_card' || currentItem.type === 'quiz')) {
      await updateSRSItem(user.id, currentItem.id, quality);
    }

    if (step < items.length - 1) {
      setStep(step + 1);
      setIsFlipped(false);
    } else {
      // Возвращаемся на карту по завершении
      navigate('/map');
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic uppercase tracking-widest">
        Syncing Lesson ...
      </div>
    );
  }

  const current = items[step]?.data;
  const type = items[step]?.type;

  return (
    <div className="h-screen flex flex-col bg-black text-white font-sans overflow-hidden">
      {/* HEADER: Название урока и прогресс */}
      <header className="p-4 flex justify-between items-center border-b border-white/5 bg-gray-900/20 backdrop-blur-md">
        <button onClick={() => navigate('/map')} className="p-2 text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="text-center">
          {/* Метка урока: 1.1, 1.2 и т.д. */}
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 mb-1">
            {lessonInfo?.title || `Module ${id}`}
          </h2>
          <div className="w-32 h-1 bg-gray-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-500 transition-all duration-300"
              style={{ width: `${((step + 1) / items.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 text-emerald-500/50">
          <Gem size={18} />
          <span className="text-[10px] font-black tracking-tighter italic">B1</span>
        </div>
      </header>

      {/* MAIN: Игровое поле */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative">

        {/* Карточка со словом */}
        {type === 'vocab_card' && (
          <div
            className="w-full max-w-sm cursor-pointer perspective-1000"
            onClick={() => {
              setIsFlipped(!isFlipped);
              if (!isFlipped) playAudio(current.audio);
            }}
          >
            <div className={`relative h-[28rem] transition-all duration-500 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>

              {/* English (Front) */}
              <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-10 text-center shadow-2xl">
                <span className="text-gray-600 font-black text-[10px] uppercase tracking-[0.3em] mb-8">Meaning</span>
                <h2 className="text-4xl font-black italic tracking-tighter leading-tight">
                  {current.front}
                </h2>
                <p className="mt-8 text-gray-700 text-[10px] uppercase font-bold tracking-widest animate-pulse">Tap to flip</p>
              </div>

              {/* Khmer (Back): Кхмерский + Транскрипция + Перевод */}
              <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-10 text-center shadow-[0_0_40px_rgba(34,211,238,0.05)]">
                <span className="text-cyan-500 font-black text-[10px] uppercase tracking-[0.3em] mb-8">Khmer</span>

                <h2 className="text-5xl font-black mb-4 tracking-normal text-white leading-none">
                  {current.back}
                </h2>

                {/* Транскрипция для помощи новичкам */}
                <p className="text-2xl text-cyan-400 font-bold italic mb-4 tracking-tight">
                  {current.pronunciation}
                </p>

                {/* Мелкая подсказка на английском, чтобы не забыть значение */}
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-10 opacity-50">
                  ({current.front})
                </p>

                <div className="p-6 bg-cyan-500 rounded-full text-black shadow-lg shadow-cyan-500/20 active:scale-90 transition-transform">
                  <Volume2 size={32} />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Квиз (Выбор варианта) */}
        {type === 'quiz' && (
          <div className="w-full max-w-sm animate-in fade-in slide-in-from-bottom-4">
             <h2 className="text-2xl font-black mb-10 italic uppercase tracking-tighter text-center leading-tight">
               {current.question}
             </h2>
             <div className="space-y-3">
               {current.options.map((opt, i) => (
                 <button
                   key={i}
                   onClick={() => handleNext(opt === current.correct_answer ? 5 : 1)}
                   className="w-full p-6 bg-gray-900/50 border border-white/5 rounded-[2rem] text-left font-bold text-lg hover:border-cyan-500/50 hover:bg-gray-900 transition-all active:scale-[0.98]"
                 >
                   {opt}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* Блок теории */}
        {type === 'theory' && (
          <div className="w-full max-w-sm bg-gray-900/40 border border-white/5 p-10 rounded-[3rem] text-center animate-in zoom-in-95">
            <h2 className="text-2xl font-black italic uppercase text-cyan-400 mb-6 tracking-tighter">
              {current.title}
            </h2>
            <p className="text-lg text-gray-300 leading-relaxed italic opacity-90">
              {current.text}
            </p>
          </div>
        )}
      </main>

      {/* FOOTER: Кнопка продолжения */}
      <footer className="p-8 max-w-sm mx-auto w-full">
        {type !== 'quiz' && (
          <button
            onClick={() => handleNext(3)}
            className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
          >
            Continue <ArrowRight size={20} />
          </button>
        )}
      </footer>

      {/* CSS для эффекта 3D */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      `}</style>
    </div>
  );
}