import React, { useState } from 'react';
import { ArrowRight, Sun, Moon, Volume2 } from 'lucide-react';

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
         badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><Sun size={12}/> A-Series</div>
    };
    if (letter_series === 2) return {
         bg: "bg-indigo-500", border: "border-indigo-400", text: "text-white",
         badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><Moon size={12}/> O-Series</div>
    };
    return { bg: "bg-emerald-500", border: "border-emerald-400", text: "text-black", badge: null };
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
    const charSound = char_audio_map?.[char];
    const fallbackSound = charSound || char_audio_map?.[target_char];

    if (char === target_char) {
      setStatus('success');
      playAudio('success.mp3');
      if (charSound) setTimeout(() => playAudio(charSound), 1000);
      if (word_audio) setTimeout(() => playAudio(word_audio), 2200);
      onComplete();
    } else {
      setStatus('error');
      playAudio('error.mp3');
      if (fallbackSound) setTimeout(() => playAudio(fallbackSound), 900);
      setTimeout(() => { setStatus('searching'); setSelectedCharIndex(null); }, 1500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-between min-h-[40vh] py-4">
      {/* Заголовок (убран лишний текст, чтобы не двоилось с LessonPlayer) */}
      <div className="text-center space-y-3 mb-6">
        <div className="flex flex-col items-center gap-2">
            <span className="text-white font-black text-2xl uppercase tracking-tighter italic italic italic italic">
              Find: <span className="text-cyan-400">{hint}</span>
            </span>
            {status === 'success' && <div className="animate-in fade-in zoom-in">{theme.badge}</div>}
        </div>
      </div>

      {/* Буквы: теперь они используют flex-wrap, но с приоритетом в одну строку */}
      <div className="flex flex-wrap justify-center items-center gap-2 w-full max-w-md px-2">
        {chars.map((char, index) => {
          const isTarget = char === target_char;
          // Расчет размера: если букв много, уменьшаем их сильнее
          const sizeClass = chars.length > 5
            ? "w-10 h-16 text-2xl"
            : "w-14 h-22 text-4xl sm:w-16 sm:h-24";

          let styleClass = "bg-gray-900 border-white/5 text-gray-500";
          if (status === 'success') {
            styleClass = isTarget ? `${theme.bg} ${theme.text} scale-110 shadow-2xl z-10` : "opacity-20 blur-[2px]";
          } else if (status === 'error' && selectedCharIndex === index) {
            styleClass = "bg-red-900/40 border-red-500 text-red-500 animate-shake";
          }

          return (
            <button
              key={index}
              onClick={() => handleCharClick(char, index)}
              className={`flex-shrink-0 rounded-2xl border-2 flex items-center justify-center font-serif transition-all duration-500 ${sizeClass} ${styleClass}`}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* Блок результата: всегда занимает место, чтобы верстка не прыгала */}
      <div className={`mt-10 text-center transition-all duration-700 ${status === 'success' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <h2 className="text-5xl font-black text-white mb-2 tracking-tight">{word}</h2>
        <p className="text-gray-500 font-black uppercase tracking-[0.2em] text-[10px]">
          {english_translation}
        </p>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}
