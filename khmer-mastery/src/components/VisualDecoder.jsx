import React, { useState, useRef } from 'react';
import { Sun, Moon, Volume2 } from 'lucide-react';
import KhmerColoredText from './KhmerColoredText';

const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function VisualDecoder({ data, onComplete }) {
  const {
    target_char, // То, что ищем (например "ក")
    hint,
    english_translation,
    pronunciation,
    letter_series,
    word_audio,
    char_audio_map,
    char_split // Части: ["ក", "ា", "ហ្វេ"]
  } = data;

  const [status, setStatus] = useState('searching');
  const [shakingIndex, setShakingIndex] = useState(null);
  const audioRef = useRef(null);

  // Тема
  const getTheme = () => {
    if (letter_series === 1) return { badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Sun size={12}/> A-Series</div> };
    if (letter_series === 2) return { badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Moon size={12}/> O-Series</div> };
    return { badge: null };
  };
  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    const path = `/sounds/${file}`;
    const audio = new Audio(path);
    audio.volume = 1.0;
    audio.play().catch(e => console.warn("Audio fail:", path));
  };

  const handlePartClick = (part, index) => {
    if (status === 'success') return;

    // Проверяем: содержит ли эта часть целевую букву?
    // (Потому что "ក" может быть частью слога "កា")
    const isTarget = part.includes(target_char);

    // Звук части
    const sound = char_audio_map?.[part] || char_audio_map?.[target_char];

    if (isTarget) {
      setStatus('success');
      playAudio('success.mp3');
      if (sound) setTimeout(() => playAudio(sound), 600);
      if (word_audio) setTimeout(() => playAudio(word_audio), 1600);
      onComplete();
    } else {
      setShakingIndex(index);
      playAudio('error.mp3');
      setTimeout(() => setShakingIndex(null), 500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">

      {/* ИНФО БЛОК */}
      <div className="text-center space-y-2 mb-12 animate-in fade-in slide-in-from-bottom-2">
         {pronunciation && (
            <p className="text-cyan-300 font-mono text-lg tracking-wider">/{pronunciation}/</p>
         )}
         <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">
            {english_translation}
         </h3>

         <div className="pt-4 flex flex-col items-center gap-2">
            <div className="flex gap-2 items-center">
                {theme.badge}
                <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-3 py-1 rounded border border-white/10">
                Task: {hint}
                </span>
            </div>
         </div>
      </div>

      {/* --- ИНТЕРАКТИВНОЕ СЛОВО (КНОПКИ СЛЕПЛЕНЫ ВМЕСТЕ) --- */}
      {/* gap-0.5 делает их почти слитными, но оставляет микро-зазор для понимания границ (можно gap-0) */}
      <div className="flex flex-wrap justify-center items-center gap-0">
        {char_split.map((part, index) => {
          const isTarget = part.includes(target_char);
          const isShaking = shakingIndex === index;
          const isRevealed = status === 'success' && isTarget;

          return (
            <button
              key={index}
              onClick={() => handlePartClick(part, index)}
              className={`
                relative transition-all duration-200 px-1 py-2 rounded-lg
                ${isShaking ? 'animate-shake bg-red-500/20' : ''}
                ${isRevealed
                    ? 'z-10 scale-110' // При успехе увеличиваем часть
                    : 'hover:bg-white/10 hover:scale-105 active:scale-95'
                }
              `}
            >
                {/* Используем KhmerColoredText для каждой части.
                   Если часть - это "កា", она отренедерится слитно и красиво.
                */}
                <KhmerColoredText
                    text={part}
                    fontUrl={DEFAULT_KHMER_FONT_URL}
                    fontSize={96}
                    className={`
                        transition-all duration-500 block leading-none
                        ${isRevealed
                            ? 'drop-shadow-[0_0_20px_rgba(52,211,153,0.8)] filter brightness-125'
                            : 'opacity-90'
                        }
                    `}
                />
            </button>
          );
        })}
      </div>

      <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity">
         <button onClick={() => playAudio(word_audio)} className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest border border-cyan-500/30 px-4 py-2 rounded-full hover:bg-cyan-500/10">
            <Volume2 size={14} /> Listen to word
         </button>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}