import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { getDueItems, updateSRSItem } from '../services/srsService';
import {
  X, Volume2, ArrowRight, CheckCircle2, AlertCircle,
  Settings, Ear, Eye, BrainCircuit, Shuffle
} from 'lucide-react';

export default function ReviewPlayer() {
  const navigate = useNavigate();

  // --- STATE ---
  const [sessionData, setSessionData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Настройки сессии (по умолчанию)
  const [settings, setSettings] = useState({
    mode: 'mix',        // mix, read, recall, listen
    showPhonetics: true, // Показывать транскрипцию
    autoPlay: true,     // Авто-звук
    sessionLimit: 20    // Лимит слов
  });

  // Ref для аудио, чтобы не накладывались звуки
  const audioRef = useRef(null);

  useEffect(() => { initSession(); }, []);

  // АВТО-ЗВУК ПРИ СМЕНЕ КАРТОЧКИ
  useEffect(() => {
    if (!loading && !isFinished && sessionData.length > 0 && settings.autoPlay) {
      const item = sessionData[currentIndex];
      // Если режим аудирования или просто включен автоплей - играем
      if (settings.mode === 'listen' || settings.autoPlay) {
        // Небольшая задержка для плавности
        const timer = setTimeout(() => {
          if(item?.target?.audio) playAudio(item.target.audio);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, loading, isFinished, sessionData]);

  // 1. ЗАГРУЗКА ДАННЫХ
  const initSession = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const dueItems = await getDueItems(user.id);

      if (dueItems.length === 0) {
        setLoading(false);
        return;
      }

      // Загружаем дистракторы (неправильные ответы)
      const { data: allVocab } = await supabase
        .from('dictionary')
        .select('*')
        .neq('english', 'Quiz Answer')
        .neq('english', '')
        .limit(100);

      if (!allVocab || allVocab.length < 4) {
          console.error("Not enough words for distractors");
          setLoading(false); return;
      }

      // Собираем сессию
      const session = dueItems.slice(0, settings.sessionLimit).map(item => {
        const target = item.data || item.lesson_items?.data;
        if (!target || !target.front) return null;

        const distractors = allVocab
          .filter(v => v.english !== target.front && v.english !== target.english)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);

        return {
          srs_id: item.srs_id || item.id,
          target,
          options: shuffle([target, ...distractors])
        };
      }).filter(Boolean);

      setSessionData(session);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());

  const playAudio = (file) => {
    if(!file) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(`/sounds/${file}`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handleAnswer = async (option) => {
    const current = sessionData[currentIndex];
    setSelectedOption(option);

    const targetEng = current.target.front || current.target.english;
    const optionEng = option.front || option.english;
    const isCorrect = optionEng === targetEng;

    playAudio(isCorrect ? 'success.mp3' : 'error.mp3');

    // Если ответ верный - повышаем ранг, если нет - сбрасываем
    await updateSRSItem((await supabase.auth.getUser()).data.user.id, current.srs_id, isCorrect ? 4 : 1);
  };

  const nextCard = () => {
    if (currentIndex < sessionData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  // ОПРЕДЕЛЕНИЕ ТИПА ВОПРОСА ДЛЯ ТЕКУЩЕЙ КАРТОЧКИ
  const getCardMode = () => {
    if (settings.mode === 'mix') {
      const modes = ['read', 'recall', 'listen'];
      return modes[Math.floor(Math.random() * modes.length)]; // Случайный режим
    }
    return settings.mode;
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic">BUILDING QUIZ...</div>;

  if (isFinished || sessionData.length === 0) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center text-center p-6">
        <CheckCircle2 size={64} className="text-emerald-500 mb-6" />
        <h1 className="text-3xl font-black text-white italic uppercase mb-2">Session Complete!</h1>
        <button onClick={() => navigate('/review')} className="w-full max-w-xs py-4 bg-white text-black rounded-xl font-bold uppercase mt-8">Back to Hub</button>
      </div>
    );
  }

  const currentItem = sessionData[currentIndex];
  const target = currentItem.target;
  const activeMode = getCardMode();

  // --- ЛОГИКА ОТОБРАЖЕНИЯ ВОПРОСА ---
  let questionMain = "";
  let questionSub = "";
  let showBigAudioBtn = false;

  // Эта функция решает, как отображать варианты ответов
  let renderOptionContent = (opt) => {
    const eng = opt.english || opt.front || "???";
    const khm = opt.back || opt.khmer || "???";
    const pron = opt.pronunciation || "";

    // Если вопрос на английском -> ответы на кхмерском
    if (activeMode === 'recall') {
      return (
        <div className="flex flex-col items-start">
          <span className="text-lg font-bold">{khm}</span>
          {/* ВОТ ОНО: Показываем транскрипцию, если включено в настройках */}
          {settings.showPhonetics && pron && (
            <span className="text-xs text-gray-400 font-mono opacity-80">/{pron}/</span>
          )}
        </div>
      );
    }
    // Иначе (чтение или аудирование) -> ответы на английском
    return <span className="text-sm font-bold">{eng}</span>;
  };

  if (activeMode === 'read') {
     questionMain = target.back || target.khmer;
     questionSub = "How do you read this?";
     showBigAudioBtn = true;
  } else if (activeMode === 'recall') {
     questionMain = target.front || target.english;
     questionSub = "Select the Khmer translation";
  } else if (activeMode === 'listen') {
     questionMain = "Listen...";
     questionSub = "What did you hear?";
     showBigAudioBtn = true;
  }

  const isAnswered = selectedOption !== null;
  const isCorrectAnswer = (opt) => (opt.front || opt.english) === (target.front || target.english);

  return (
    <div className="h-screen bg-black flex justify-center font-sans">
      <div className="w-full max-w-md h-full flex flex-col relative bg-black border-x border-white/5">

        {/* HEADER */}
        <div className="p-4 flex justify-between items-center bg-gray-900/50 z-10">
           <button onClick={() => navigate('/review')}><X size={24} className="text-gray-500" /></button>
           <div className="h-1 w-24 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all" style={{width: `${(currentIndex / sessionData.length) * 100}%`}}></div>
           </div>
           <button onClick={() => setShowSettings(true)} className="p-2 bg-gray-800 rounded-full text-cyan-400 hover:bg-gray-700 transition-colors">
             <Settings size={18} />
           </button>
        </div>

        {/* SETTINGS MODAL (ШТОРКА СНИЗУ) */}
        {showSettings && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end animate-in fade-in">
             <div className="bg-gray-900 border-t border-white/10 rounded-t-[2rem] p-6 pb-10 animate-in slide-in-from-bottom-full">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">Review Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="bg-black p-2 rounded-full"><X size={20} className="text-white"/></button>
                </div>

                {/* 1. РЕЖИМЫ */}
                <div className="mb-6">
                  <p className="text-gray-500 text-[10px] font-bold uppercase mb-3">Training Mode</p>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {id: 'mix', icon: Shuffle, label: 'Mix'},
                      {id: 'read', icon: Eye, label: 'Read'},
                      {id: 'listen', icon: Ear, label: 'Listen'},
                      {id: 'recall', icon: BrainCircuit, label: 'Recall'}
                    ].map(mode => (
                      <button
                        key={mode.id}
                        onClick={() => setSettings({...settings, mode: mode.id})}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all
                          ${settings.mode === mode.id
                            ? 'bg-cyan-500 border-cyan-400 text-black'
                            : 'bg-gray-800 border-transparent text-gray-400 hover:bg-gray-700'}`}
                      >
                        <mode.icon size={20} className="mb-1" />
                        <span className="text-[9px] font-black uppercase">{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. ПОМОЩНИКИ */}
                <div className="space-y-3">
                   <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🅰️</span>
                        <div>
                          <p className="text-white font-bold text-sm">Show Phonetics</p>
                          <p className="text-gray-500 text-[10px]">Helper text for reading</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, showPhonetics: !settings.showPhonetics})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.showPhonetics ? 'bg-emerald-500' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.showPhonetics ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>

                   <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">🔊</span>
                        <div>
                          <p className="text-white font-bold text-sm">Auto-play Audio</p>
                          <p className="text-gray-500 text-[10px]">Hear words automatically</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSettings({...settings, autoPlay: !settings.autoPlay})}
                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.autoPlay ? 'bg-emerald-500' : 'bg-gray-700'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.autoPlay ? 'left-7' : 'left-1'}`} />
                      </button>
                   </div>
                </div>

                <button onClick={() => setShowSettings(false)} className="w-full mt-6 py-4 bg-white text-black font-black uppercase rounded-xl">Save & Close</button>
             </div>
          </div>
        )}

        {/* MAIN QUESTION AREA */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 pb-10 min-h-[30vh]">
           <span className="text-gray-500 text-[10px] uppercase tracking-widest mb-6 font-bold">{questionSub}</span>

           <div
             onClick={() => target.audio && playAudio(target.audio)}
             className="cursor-pointer active:scale-95 transition-transform flex flex-col items-center text-center group"
           >
             {/* Если это Listening Mode, показываем большую иконку звука вместо текста */}
             {activeMode === 'listen' ? (
                <div className="w-24 h-24 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-pulse">
                   <Volume2 size={40} />
                </div>
             ) : (
                <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight font-serif tracking-tight">
                  {questionMain}
                </h1>
             )}

             {/* Маленькая иконка звука под текстом */}
             {showBigAudioBtn && activeMode !== 'listen' && (
               <div className="p-3 bg-gray-800 rounded-full text-cyan-400 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                 <Volume2 size={24} />
               </div>
             )}
           </div>
        </div>

        {/* ANSWERS LIST (С большим отступом снизу pb-40) */}
        <div className="p-6 pb-40 space-y-3 overflow-y-auto custom-scrollbar">
           {currentItem.options.map((opt, idx) => {
             let btnStyle = "bg-gray-900 border-white/10 text-white hover:bg-gray-800";

             if (isAnswered) {
               if (isCorrectAnswer(opt)) btnStyle = "bg-emerald-600/20 border-emerald-500 text-emerald-400";
               else if (selectedOption === opt) btnStyle = "bg-red-600/20 border-red-500 text-red-400";
               else btnStyle = "bg-gray-900 opacity-30";
             }

             return (
               <button
                 key={idx}
                 disabled={isAnswered}
                 onClick={() => handleAnswer(opt)}
                 className={`w-full p-4 border rounded-2xl text-left transition-all flex justify-between items-center ${btnStyle}`}
               >
                 {/* Рендерим контент с учетом настроек транскрипции */}
                 <div className="flex-1">
                   {renderOptionContent(opt)}
                 </div>

                 {isAnswered && isCorrectAnswer(opt) && <CheckCircle2 size={20} className="text-emerald-500 shrink-0 ml-2" />}
                 {isAnswered && selectedOption === opt && !isCorrectAnswer(opt) && <AlertCircle size={20} className="text-red-500 shrink-0 ml-2" />}
               </button>
             );
           })}
        </div>

        {/* BOTTOM ACTION BAR */}
        {isAnswered && (
           <div className="absolute bottom-0 left-0 right-0 p-6 pt-6 pb-8 bg-gray-900/95 backdrop-blur-xl border-t border-white/10 animate-in slide-in-from-bottom-full z-20">
             <button onClick={nextCard} className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all
                ${isCorrectAnswer(selectedOption) ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-white text-black'}`}>
                {isCorrectAnswer(selectedOption) ? 'Continue' : 'Got it'} <ArrowRight size={20} />
             </button>
           </div>
        )}

      </div>
    </div>
  );
}