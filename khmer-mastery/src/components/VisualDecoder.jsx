import React, { useState, useEffect } from 'react';
import { ArrowRight, Sun, Moon, Volume2 } from 'lucide-react';

// Добавили hideDefaultButton в деструктуризацию
export default function VisualDecoder({ data, onComplete, hideDefaultButton = false }) {
  const {
    word, target_char, hint, english_translation,
    letter_series, word_audio,
    char_audio_map
  } = data;

  const [status, setStatus] = useState('searching');
  const [selectedCharIndex, setSelectedCharIndex] = useState(null);
  const chars = word ? word.split('') : [];

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
    return { bg: "bg-cyan-500", border: "border-cyan-400", text: "text-black", shadow: "", badge: null };
  };

  const theme = getTheme();

  const handleCharClick = (char, index) => {
    if (status === 'success') return;
    setSelectedCharIndex(index);
    if (char === target_char) {
      setStatus('success');
      onComplete(); // Уведомляем плеер
    } else {
      setStatus('error');
      setTimeout(() => setStatus('searching'), 600);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto p-4">
      <div className="mb-8">{theme.badge}</div>
      <h1 className="text-2xl font-black text-white text-center mb-12 uppercase italic tracking-tighter">
        Find character: <span className={theme.text + " px-2 " + theme.bg}>{hint}</span>
      </h1>

      <div className="flex flex-wrap justify-center gap-3 mb-16">
        {chars.map((char, index) => {
          let styleClass = "bg-gray-900 border-white/10 text-gray-500";
          if (selectedCharIndex === index) {
            if (status === 'success' && char === target_char) styleClass = `${theme.bg} ${theme.border} ${theme.text} ${theme.shadow} scale-110`;
            if (status === 'error') styleClass = "bg-red-900/20 border-red-500 text-red-500 animate-shake";
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

      <div className={`w-full max-w-xs text-center transition-all duration-1000 delay-500 ${status === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <div className="flex flex-col items-center gap-1 mb-8 mt-8">
           <h2 className="text-4xl font-black text-white">{word}</h2>
           <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{english_translation}</p>
        </div>

        {/* СКРЫВАЕМ КНОПКУ, если передан hideDefaultButton */}
        {!hideDefaultButton && (
          <button onClick={() => onComplete()}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:brightness-110 transition-all ${theme.bg} ${theme.text}`}
          >
            Continue <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}