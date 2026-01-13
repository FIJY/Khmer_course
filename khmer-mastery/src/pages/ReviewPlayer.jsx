import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getDueItems, updateSRSItem } from '../services/srsService';
import { X, Volume2, ArrowRight, CheckCircle2, AlertCircle, Settings } from 'lucide-react';

export default function ReviewPlayer() {
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState([]); // { target, distractors }
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  // Настройка сложности: 'mix', 'khmer_to_eng', 'eng_to_khmer', 'listening'
  const [difficulty, setDifficulty] = useState('mix');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => { initSession(); }, []);

  // 1. ЗАГРУЗКА ДАННЫХ
  const initSession = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      // А. Берем слова на повторение
      const dueItems = await getDueItems(user.id);

      if (dueItems.length === 0) {
        setLoading(false);
        return;
      }

      // Б. Берем "массовку" для неправильных ответов (дистракторы)
      // Берем просто 50 случайных слов из словаря или уроков
      const { data: allVocab } = await supabase
        .from('dictionary') // Или lesson_items, где удобнее
        .select('*')
        .limit(50);

      // В. Собираем уровни для каждого вопроса
      const session = dueItems.map(item => {
        // Данные слова лежат в item.lesson_items.data (если join) или item.data
        // Адаптируй в зависимости от того, что возвращает getDueItems
        // Предположим getDueItems возвращает полные данные
        const target = item.data || item.lesson_items?.data;

        // Подбираем 3 неправильных ответа
        const distractors = allVocab
          .filter(v => v.english !== target.front) // Исключаем правильный
          .sort(() => 0.5 - Math.random()) // Перемешиваем
          .slice(0, 3);

        return {
          srs_id: item.srs_id || item.id,
          target,
          options: shuffle([target, ...distractors])
        };
      });

      setSessionData(session);
    } catch (e) {
      console.error("Session init error:", e);
    } finally {
      setLoading(false);
    }
  };

  // Перемешивание массива
  const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());

  // Воспроизведение звука
  const playAudio = (file) => {
    if(!file) return;
    new Audio(`/sounds/${file}`).play().catch(() => {});
  };

  // 2. ОБРАБОТКА ОТВЕТА
  const handleAnswer = async (option) => {
    const current = sessionData[currentIndex];
    setSelectedOption(option);

    // Правильный ли ответ?
    // Сравниваем по английскому переводу (уникальный ID был бы лучше, но пока так)
    const isCorrect = option.english === current.target.front || option.english === current.target.english;

    // Звуковой эффект
    playAudio(isCorrect ? 'success.mp3' : 'error.mp3');

    // Если ответ ВЕРНЫЙ -> Сразу отправляем в SRS
    if (isCorrect) {
       // Оценка 5 (Easy/Good) - увеличиваем интервал
       // Можно сделать логику: если ответил быстро = 5, если медленно = 3. Пока ставим 4 (Good).
       await updateSRS(current.srs_id, 4);
    } else {
       // Если ОШИБКА -> Оценка 1 (Again) - сброс интервала
       await updateSRS(current.srs_id, 1);
    }
  };

  const updateSRS = async (id, grade) => {
    const { data: { user } } = await supabase.auth.getUser();
    await updateSRSItem(user.id, id, grade);
  };

  const nextCard = () => {
    if (currentIndex < sessionData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  // 3. ОПРЕДЕЛЕНИЕ ТИПА ВОПРОСА (В зависимости от сложности)
  const getQuestionMode = (diff) => {
    if (diff === 'mix') {
      const modes = ['khmer_to_eng', 'eng_to_khmer', 'listening'];
      return modes[Math.floor(Math.random() * modes.length)];
    }
    return diff;
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400">BUILDING QUIZ...</div>;

  // ЭКРАН ФИНИША
  if (isFinished || sessionData.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-500 mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h1 className="text-3xl font-black text-white italic uppercase mb-2">Session Complete!</h1>
        <p className="text-gray-500 mb-10">You've reviewed {sessionData.length} items.</p>
        <button onClick={() => navigate('/review')} className="w-full max-w-xs py-4 bg-white text-black rounded-xl font-bold uppercase">Back to Hub</button>
      </div>
    );
  }

  const currentItem = sessionData[currentIndex];
  const target = currentItem.target;
  const mode = getQuestionMode(difficulty);

  // Определяем, что показывать в вопросе и в ответах
  let questionText = "";
  let questionSub = "";
  let audioToPlay = null;
  let renderOption = (opt) => opt.english || opt.front; // По умолчанию ответы на английском

  if (mode === 'khmer_to_eng') {
     questionText = target.back || target.khmer;
     questionSub = "Select the meaning";
     audioToPlay = target.audio;
  } else if (mode === 'eng_to_khmer') {
     questionText = target.front || target.english;
     questionSub = "Select the Khmer word";
     renderOption = (opt) => opt.back || opt.khmer; // Ответы на кхмерском
  } else if (mode === 'listening') {
     questionText = "🔊 Listen";
     questionSub = "What did you hear?";
     audioToPlay = target.audio;
     // Авто-плей при появлении вопроса
     // (Можно добавить useEffect для этого, но пока по клику)
  }

  const isAnswered = selectedOption !== null;
  const isCorrectAnswer = (opt) => opt.english === target.front || opt.english === target.english;

  return (
    <div className="h-screen bg-black flex justify-center font-sans">
      <div className="w-full max-w-md h-full flex flex-col relative bg-black border-x border-white/5">

        {/* HEADER */}
        <div className="p-4 flex justify-between items-center bg-gray-900/50">
           <button onClick={() => navigate('/review')}><X size={24} className="text-gray-500" /></button>
           <div className="flex items-center gap-2">
             <div className="h-1 w-24 bg-gray-800 rounded-full overflow-hidden">
               <div className="h-full bg-cyan-500 transition-all" style={{width: `${(currentIndex / sessionData.length) * 100}%`}}></div>
             </div>
           </div>
           <button onClick={() => setShowSettings(!showSettings)}><Settings size={20} className="text-gray-500" /></button>
        </div>

        {/* НАСТРОЙКИ СЛОЖНОСТИ (Выпадашка) */}
        {showSettings && (
          <div className="absolute top-14 right-4 bg-gray-800 p-4 rounded-xl z-50 border border-white/10 shadow-xl">
             <p className="text-xs text-gray-400 uppercase mb-2 font-bold">Quiz Mode</p>
             <div className="flex flex-col gap-2">
               {['mix', 'khmer_to_eng', 'eng_to_khmer', 'listening'].map(m => (
                 <button key={m} onClick={() => { setDifficulty(m); setShowSettings(false); }}
                   className={`text-left text-sm p-2 rounded ${difficulty === m ? 'bg-cyan-500 text-black' : 'text-white hover:bg-white/10'}`}>
                   {m === 'mix' ? 'Smart Mix' : m.replace(/_/g, ' ')}
                 </button>
               ))}
             </div>
          </div>
        )}

        {/* ВОПРОС */}
        <div className="flex-1 flex flex-col items-center justify-center p-6">
           <span className="text-gray-500 text-[10px] uppercase tracking-widest mb-4 font-bold">{questionSub}</span>

           <div onClick={() => audioToPlay && playAudio(audioToPlay)}
                className="cursor-pointer active:scale-95 transition-transform flex flex-col items-center">
             <h1 className="text-4xl md:text-5xl font-black text-white text-center mb-4">{questionText}</h1>
             {audioToPlay && <div className="p-4 bg-cyan-500/10 rounded-full text-cyan-500"><Volume2 size={32} /></div>}
           </div>
        </div>

        {/* ВАРИАНТЫ ОТВЕТОВ */}
        <div className="p-6 pb-10 space-y-3 bg-black">
           {currentItem.options.map((opt, idx) => {
             // Логика цвета кнопок после ответа
             let btnStyle = "bg-gray-900 border-white/10 text-white hover:bg-gray-800";

             if (isAnswered) {
               if (isCorrectAnswer(opt)) btnStyle = "bg-emerald-600 border-emerald-500 text-white"; // Правильный всегда зеленый
               else if (selectedOption === opt) btnStyle = "bg-red-600 border-red-500 text-white"; // Если выбрали не тот - красный
               else btnStyle = "bg-gray-900 opacity-50"; // Остальные тускнеют
             }

             return (
               <button
                 key={idx}
                 disabled={isAnswered}
                 onClick={() => handleAnswer(opt)}
                 className={`w-full p-4 border rounded-2xl text-left font-bold transition-all text-sm flex justify-between items-center ${btnStyle}`}
               >
                 {renderOption(opt)}
                 {isAnswered && isCorrectAnswer(opt) && <CheckCircle2 size={18} />}
                 {isAnswered && selectedOption === opt && !isCorrectAnswer(opt) && <AlertCircle size={18} />}
               </button>
             );
           })}
        </div>

        {/* КНОПКА CONTINUE (Появляется после ответа) */}
        {isAnswered && (
           <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-900/90 backdrop-blur border-t border-white/10 animate-in slide-in-from-bottom-full">
             <button onClick={nextCard} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2
                ${isCorrectAnswer(selectedOption) ? 'bg-emerald-500 text-white' : 'bg-white text-black'}`}>
                {isCorrectAnswer(selectedOption) ? 'Good job!' : 'Got it'} <ArrowRight size={20} />
             </button>
           </div>
        )}

      </div>
    </div>
  );
}