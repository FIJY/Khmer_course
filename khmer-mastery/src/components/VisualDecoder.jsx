import React, { useState, useEffect } from 'react';
import { ArrowRight, Sun, Moon, Volume2 } from 'lucide-react';

export default function VisualDecoder({ data, onComplete }) {
  const {
    word, target_char, hint, english_translation,
    letter_series, word_audio,
    char_audio_map
  } = data;

  const [status, setStatus] = useState('searching'); // searching | success | error
  const [selectedCharIndex, setSelectedCharIndex] = useState(null);

  const chars = word ? word.split('') : [];

  // ТЕМА
  const getTheme = () => {
    if (letter_series === 1) return {
         bg: "bg-orange-500", border: "border-orange-400", text: "text-black",
         shadow: "shadow-[0_0_50px_rgba(249,115,22,0.5)]",
         badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"><Sun size={14}/> A-Series</div>
    };
    if (letter_series === 2) return {
         bg: "bg-indigo-500", border: "border-indigo-400", text: "text-white",
         shadow: "shadow-[0_0_50px_rgba(99,102,241,0.5)]",
         badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"><Moon size={14}/> O-Series</div>
    };
    return { bg: "bg-emerald-500", border: "border-emerald-400", text: "text-black", shadow: "shadow-none", badge: null };
  };

  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    const audio = new Audio(`/sounds/${file}`);
    audio.play().catch(e => console.error("Audio error:", e));
  };

  const handleCharClick = (char, index) => {
    if (status === 'success') return;
    setSelectedCharIndex(index);

    // 1. ЗВУК БУКВЫ (Сразу)
    const charSound = char_audio_map?.[char];
    if (charSound) playAudio(charSound);

    if (char === target_char) {
      // --- ПОБЕДА ---
      setStatus('success');

      // ТАЙМИНГИ (Увеличили задержку)
      // 0ms: Буква
      // 1200ms: Звук успеха (было 800)
      // 2500ms: Слово целиком (было 1800)

      setTimeout(() => playAudio('success.mp3'), 1200);

      if (word_audio) {
          setTimeout(() => playAudio(word_audio), 2500);
      }

    } else {
      // --- ОШИБКА ---
      setStatus('error');
      // Даем букве договорить перед звуком ошибки
      setTimeout(() => playAudio('error.mp3'), 1000);

      setTimeout(() => {
          setStatus('searching');
          setSelectedCharIndex(null);
      }, 1500);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">

      {/* ИНСТРУКЦИЯ */}
      <div className="mb-10 text-center space-y-4">
        <h3 className="text-gray-600 font-black uppercase tracking-[0.2em] text-[10px]">Visual Decoder</h3>

        <div className="inline-flex flex-col items-center gap-2">
            <span className="text-white font-bold text-xl tracking-tight">{hint}</span>
            {status === 'success' && <div className="animate-in fade-in slide-in-from-top-2">{theme.badge}</div>}
        </div>
      </div>

      {/* СЕТКА БУКВ
          УБРАЛИ: gap-transition. Теперь всегда gap-3.
          УБРАЛИ: Схлопывание границ. Карточки остаются карточками.
      */}
      <div className="flex flex-nowrap justify-center gap-3 w-full overflow-x-auto pb-4 px-2">

        {chars.map((char, index) => {
          const isTarget = char === target_char;

          let styleClass = "bg-gray-900 border-white/10 text-gray-400 hover:bg-gray-800 hover:border-white/30 hover:text-white";

          if (status === 'success') {
            if (isTarget) {
                // Целевую букву просто подсвечиваем цветом серии
                styleClass = `${theme.bg} ${theme.text} border-transparent scale-110 z-20 shadow-lg`;
            } else {
                // Остальные просто чуть гасим
                styleClass = "bg-gray-900/50 text-gray-600 border-transparent blur-[1px]";
            }
          } else if (status === 'error' && selectedCharIndex === index) {
            styleClass = "bg-red-500/20 border-red-500 text-red-500 animate-shake";
          }

          return (
            <button key={index} onClick={() => handleCharClick(char, index)}
              className={`flex-shrink-0 w-12 h-16 sm:w-16 sm:h-24 rounded-lg border-2 flex items-center justify-center text-3xl sm:text-4xl font-serif transition-all duration-300 ${styleClass}`}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* РЕЗУЛЬТАТ */}
      <div className={`w-full max-w-xs text-center transition-all duration-1000 delay-500 ${status === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>

        <div className="flex flex-col items-center gap-1 mb-8 mt-8">
           <h2 className="text-4xl font-black text-white">{word}</h2>
           <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{english_translation}</p>
        </div>

        <button onClick={() => onComplete()}
          className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all ${theme.bg} ${theme.text}`}
        >
          Continue <ArrowRight size={20} />
        </button>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}