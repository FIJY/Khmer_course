import React, { useState, useRef } from 'react';
import { Sun, Moon, Volume2 } from 'lucide-react';
import KhmerColoredText from './KhmerColoredText';

const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function VisualDecoder({ data, onComplete }) {
  const {
    word,
    target_char,
    hint,
    english_translation,
    pronunciation,
    letter_series,
    word_audio,
    char_audio_map,
    char_split
  } = data;

  const [status, setStatus] = useState('searching');
  const [selectedCharIndex, setSelectedCharIndex] = useState(null);
  const audioRef = useRef(null);

  // Fallback, если char_split не пришел
  const chars = char_split && char_split.length > 0
    ? char_split
    : (word ? word.split('') : []);

  const getTheme = () => {
    if (letter_series === 1) return { color: "text-amber-400", badge: <span className="text-amber-400 text-xs font-bold border border-amber-500/30 px-2 py-1 rounded bg-amber-500/10 flex gap-1"><Sun size={14}/> Sun Series</span> };
    if (letter_series === 2) return { color: "text-indigo-400", badge: <span className="text-indigo-400 text-xs font-bold border border-indigo-500/30 px-2 py-1 rounded bg-indigo-500/10 flex gap-1"><Moon size={14}/> Moon Series</span> };
    return { color: "text-white", badge: null };
  };
  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    const path = `/sounds/${file}`;
    console.log("Playing:", path);

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(e => console.warn("Audio missing:", path));
  };

  const handleCharClick = (char, index) => {
    if (status === 'success') return;
    setSelectedCharIndex(index);

    const charSound = char_audio_map?.[char];
    const soundToPlay = charSound || char_audio_map?.[target_char];

    if (char === target_char) {
      setStatus('success');
      playAudio('success.mp3');
      if (soundToPlay) setTimeout(() => playAudio(soundToPlay), 800);
      if (word_audio) setTimeout(() => playAudio(word_audio), 1800);
      onComplete();
    } else {
      setStatus('error');
      playAudio('error.mp3');
      if (soundToPlay) setTimeout(() => playAudio(soundToPlay), 900);
      setTimeout(() => { setStatus('searching'); setSelectedCharIndex(null); }, 1500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-[50vh] py-4">

      {/* 1. СЛОВО ЦЕЛИКОМ (Через рендерер) */}
      <div className="mb-6 relative group cursor-pointer transform transition-transform active:scale-95" onClick={() => playAudio(word_audio)}>
         <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full opacity-30"></div>
         <KhmerColoredText
            text={word}
            fontUrl={DEFAULT_KHMER_FONT_URL}
            fontSize={80}
            className="relative z-10 drop-shadow-2xl"
         />
         <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-50">
            <Volume2 size={20} className="text-cyan-400" />
         </div>
      </div>

      {/* 2. ПЕРЕВОД И ЗАДАНИЕ */}
      <div className="text-center space-y-2 mb-8 animate-in fade-in slide-in-from-bottom-2">
         {pronunciation && (
            <p className="text-cyan-300 font-mono text-lg tracking-wider">
               /{pronunciation}/
            </p>
         )}
         <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">
            {english_translation}
         </h3>

         <div className="pt-4 flex flex-col items-center gap-2">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-xl border border-white/10">
              Goal: {hint}
            </span>
            {status === 'success' && <div className="animate-in fade-in zoom-in">{theme.badge}</div>}
         </div>
      </div>

      {/* 3. КНОПКИ РАЗБОРА */}
      <div className="flex flex-wrap justify-center items-center gap-3 w-full max-w-md px-2">
        {chars.map((char, index) => {
          const isTarget = char === target_char;

          let styleClass = "bg-gray-900 border-white/10 text-gray-300 hover:border-cyan-500/50 hover:text-white";

          if (status === 'success') {
            styleClass = isTarget
                ? `${theme.bg} ${theme.text} scale-110 shadow-[0_0_20px_rgba(52,211,153,0.5)] border-transparent`
                : "opacity-20 blur-[1px]";
          } else if (status === 'error' && selectedCharIndex === index) {
            styleClass = "bg-red-900/40 border-red-500 text-red-500 animate-shake";
          }

          return (
            <button
              key={index}
              onClick={() => handleCharClick(char, index)}
              className={`flex-shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 w-16 h-20 text-3xl font-khmer ${styleClass}`}
            >
              {char}
            </button>
          );
        })}
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
}