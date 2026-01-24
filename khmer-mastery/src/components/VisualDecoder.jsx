import React, { useState, useRef } from 'react';
import { Sun, Moon, Volume2 } from 'lucide-react';

export default function VisualDecoder({ data, onComplete }) {
  const {
    word,
    target_char, // Например "ក"
    hint,
    english_translation,
    pronunciation,
    letter_series,
    word_audio,
    char_audio_map,
    char_split // ["ក", "ា", "ហ្វ", "េ"]
  } = data;

  const [status, setStatus] = useState('searching');
  const [clickedIndex, setClickedIndex] = useState(null);
  const audioRef = useRef(null);

  // Fallback: если разбивки нет, берем буквы
  const parts = char_split && char_split.length > 0 ? char_split : (word ? word.split('') : []);

  // ТЕМА (Sun/Moon)
  const getTheme = () => {
    if (letter_series === 1) return { color: "text-amber-400", badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Sun size={12}/> A-Series</div> };
    if (letter_series === 2) return { color: "text-indigo-400", badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Moon size={12}/> O-Series</div> };
    return { color: "text-white", badge: null };
  };
  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    const path = `/sounds/${file}`;
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(e => console.warn("No audio:", path));
  };

  const handlePartClick = (part, index) => {
    if (status === 'success') return;
    setClickedIndex(index);

    // Логика звука
    const sound = char_audio_map?.[part] || char_audio_map?.[target_char];
    if (sound) playAudio(sound);

    // Проверяем, содержит ли нажатая часть целевую букву
    // (Потому что часть может быть слогом, например "កា")
    if (part.includes(target_char)) {
      setStatus('success');
      playAudio('success.mp3');
      if (word_audio) setTimeout(() => playAudio(word_audio), 1000);
      onComplete();
    } else {
      setStatus('error');
      playAudio('error.mp3');
      setTimeout(() => {
        setStatus('searching');
        setClickedIndex(null);
      }, 500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">

      {/* 1. ГЛАВНОЕ ИНТЕРАКТИВНОЕ СЛОВО */}
      <div className={`relative mb-12 select-none ${status === 'success' ? 'scale-110 duration-500' : ''}`}>

         {/* ФОНОВОЕ СВЕЧЕНИЕ (ПРИ ПОБЕДЕ) */}
         {status === 'success' && (
            <div className="absolute inset-0 bg-emerald-500/30 blur-3xl animate-pulse rounded-full"></div>
         )}

         {/* СЛОЙ 1: ВИДИМЫЙ ТЕКСТ (КРАСИВЫЙ) */}
         {/* position: absolute позволяет ему лежать под кнопками.
             pointer-events-none пропускает клики сквозь себя. */}
         <div
            className="absolute inset-0 flex justify-center items-center pointer-events-none z-0"
            aria-hidden="true"
         >
            <span className="text-7xl md:text-9xl font-khmer text-white leading-normal tracking-normal drop-shadow-2xl">
                {word}
            </span>
         </div>

         {/* СЛОЙ 2: НЕВИДИМЫЕ КНОПКИ (КЛИКАБЕЛЬНЫЕ) */}
         {/* Мы рендерим части слова с opacity-0. Они занимают место, но их не видно.
             Пользователь думает, что нажимает на текст под ними. */}
         <div className="relative z-10 flex justify-center items-center">
            {parts.map((part, index) => {
               // Определяем состояние для подсветки
               const isClicked = clickedIndex === index;
               const isTarget = part.includes(target_char);
               const isSuccess = status === 'success' && isTarget;
               const isError = status === 'error' && isClicked;

               return (
                  <button
                    key={index}
                    onClick={() => handlePartClick(part, index)}
                    className={`
                        text-7xl md:text-9xl font-khmer leading-normal tracking-normal
                        transition-all duration-200 rounded-lg select-none
                        /* СТИЛИЗАЦИЯ */
                        ${isSuccess ? 'text-emerald-400 opacity-100 drop-shadow-[0_0_15px_rgba(52,211,153,1)]' : ''}
                        ${isError ? 'bg-red-500/30 animate-shake' : ''}
                        ${status === 'searching' ? 'opacity-0 hover:bg-white/10' : ''} /* В поиске кнопки прозрачные */
                        ${status === 'success' && !isTarget ? 'opacity-0' : ''}
                    `}
                    style={{
                        // Важно: color: transparent делает сам текст кнопки невидимым,
                        // но кнопка сохраняет размер букв!
                        color: isSuccess ? undefined : 'transparent',
                        WebkitTextStroke: isSuccess ? '2px #34d399' : '0px', // Делаем жирнее при победе
                    }}
                  >
                    {part}
                  </button>
               )
            })}
         </div>

         {/* Иконка звука */}
         <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-50 cursor-pointer hover:opacity-100 transition-opacity" onClick={() => playAudio(word_audio)}>
            <Volume2 size={24} className="text-cyan-400" />
         </div>
      </div>

      {/* 2. ИНФО БЛОК */}
      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
         {pronunciation && (
            <p className="text-cyan-300 font-mono text-xl tracking-widest">/{pronunciation}/</p>
         )}
         <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            {english_translation}
         </h3>

         <div className="pt-6 flex flex-col items-center gap-3">
            <div className="flex gap-3 items-center">
                {theme.badge}
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-xl border border-white/10">
                Task: {hint}
                </span>
            </div>
         </div>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}