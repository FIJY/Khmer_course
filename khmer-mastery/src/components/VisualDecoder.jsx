import React, { useState } from 'react';
import { ArrowRight, Sun, Moon, Volume2 } from 'lucide-react';

// Добавлен hideDefaultButton в аргументы
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
    return { bg: "bg-emerald-500", border: "border-emerald-400", text: "text-black", shadow: "shadow-none", badge: null };
  };
  const theme = getTheme();

  const handleCharClick = (char, index) => {
    if (status === 'success') return;
    setSelectedCharIndex(index);
    if (char === target_char) {
      setStatus('success');
      onComplete(); // Сообщаем плееру о готовности
    } else {
      setStatus('error');
      setTimeout(() => { setStatus('searching'); setSelectedCharIndex(null); }, 1500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center space-y-4">
        <h3 className="text-gray-600 font-black uppercase tracking-[0.2em] text-[10px]">Visual Decoder</h3>
        <div className="inline-flex flex-col items-center gap-2">
            <span className="text-white font-bold text-xl tracking-tight">{hint}</span>
            {status === 'success' && theme.badge}
        </div>
      </div>

      {/* Адаптивная сетка: буквы переносятся, если их много */}
      <div className="flex flex-wrap justify-center gap-3 w-full max-w-sm mb-8">
        {chars.map((char, index) => {
          const isTarget = char === target_char;
          // Динамический размер: меньше букв — крупнее плитки
          const sizeClass = chars.length > 6 ? "w-10 h-14 text-2xl" : "w-14 h-20 text-3xl sm:w-16 sm:h-24 sm:text-4xl";

          let styleClass = "bg-gray-900 border-white/10 text-gray-400";
          if (status === 'success') {
            styleClass = isTarget ? `${theme.bg} ${theme.text} scale-110 shadow-lg` : "opacity-30 blur-[1px]";
          } else if (status === 'error' && selectedCharIndex === index) {
            styleClass = "bg-red-500/20 border-red-500 text-red-500 animate-shake";
          }

          return (
            <button key={index} onClick={() => handleCharClick(char, index)}
              className={`flex-shrink-0 rounded-lg border-2 flex items-center justify-center font-serif transition-all duration-300 ${sizeClass} ${styleClass}`}
            >
              {char}
            </button>
          );
        })}
      </div>

      <div className={`w-full max-w-xs text-center transition-all duration-1000 ${status === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <div className="flex flex-col items-center gap-1 mb-8 mt-4">
           <h2 className="text-4xl font-black text-white">{word}</h2>
           <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{english_translation}</p>
        </div>

        {/* Внутренняя кнопка теперь скрывается */}
        {!hideDefaultButton && (
          <button onClick={() => onComplete()} className={`w-full py-4 rounded-xl font-black uppercase ${theme.bg} ${theme.text}`}>
            Continue <ArrowRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}