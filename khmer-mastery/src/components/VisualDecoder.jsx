import React, { useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import KhmerColoredText from './KhmerColoredText';

const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function VisualDecoder({ data, onComplete, hideDefaultButton = false }) {
  const {
    word,
    target_char,
    hint,
    english_translation,
    pronunciation, // <--- ДОБАВИЛИ (в JSON это поле должно быть)
    letter_series,
    word_audio,
    char_audio_map,
    char_split
  } = data;

  const [status, setStatus] = useState('searching');
  const [selectedCharIndex, setSelectedCharIndex] = useState(null);

  // Fallback, если char_split не пришел
  const chars = char_split && char_split.length > 0
    ? char_split
    : (word ? word.split('') : []);

  // Цветовая тема (A/O Series)
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
    if (!file) {
        console.warn("No audio file provided");
        return;
    }
    // Упрощаем путь: всегда ищем в /sounds/
    const audioPath = file.startsWith('/') ? file : `/sounds/${file}`;
    console.log("Playing:", audioPath); // Отладка
    const audio = new Audio(audioPath);
    audio.play().catch(e => console.error("Audio error:", e));
  };

  const handleCharClick = (char, index) => {
    if (status === 'success') return;
    setSelectedCharIndex(index);

    // Логика звука: Свой звук -> Звук цели -> Тишина
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

      {/* 1. ГЛАВНОЕ СЛОВО (ЦВЕТНОЕ) */}
      <div className="mb-6 relative group transform transition-all duration-500 hover:scale-105 cursor-pointer" onClick={() => playAudio(word_audio)}>
         <div className="absolute inset-0 bg-cyan-500/10 blur-3xl rounded-full opacity-30"></div>

         {/* Рендер слова целиком с раскраской */}
         <div className="relative z-10 text-center">
            <KhmerColoredText
                text={word}
                fontUrl={DEFAULT_KHMER_FONT_URL}
                fontSize={80}
                className="drop-shadow-2xl"
            />
         </div>
      </div>

      {/* 2. ИНФОРМАЦИЯ (ПЕРЕВОД + ТРАНСКРИПЦИЯ) */}
      <div className="text-center space-y-2 mb-8 animate-in fade-in slide-in-from-bottom-2">
         {pronunciation && (
            <p className="text-cyan-300 font-mono text-lg tracking-wider">
               /{pronunciation}/
            </p>
         )}
         <h3 className="text-2xl font-black text-white uppercase italic">
            {english_translation}
         </h3>

         {/* Подсказка, что искать */}
         <div className="pt-4 flex flex-col items-center gap-2">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-3 py-1 rounded-lg border border-white/10">
              Goal: {hint}
            </span>
            {status === 'success' && <div className="animate-in fade-in zoom-in">{theme.badge}</div>}
         </div>
      </div>

      {/* 3. ИНТЕРАКТИВНЫЙ РАЗБОР */}
      <div className="flex flex-wrap justify-center items-center gap-3 w-full max-w-md px-2">
        {chars.map((char, index) => {
          const isTarget = char === target_char;

          let styleClass = "bg-gray-900 border-white/10 text-gray-400 hover:border-white/30 hover:bg-gray-800";
          if (status === 'success') {
            styleClass = isTarget ? `${theme.bg} ${theme.text} scale-110 shadow-xl border-transparent` : "opacity-20 blur-[1px]";
          } else if (status === 'error' && selectedCharIndex === index) {
            styleClass = "bg-red-900/40 border-red-500 text-red-500 animate-shake";
          }

          return (
            <button
              key={index}
              onClick={() => handleCharClick(char, index)}
              className={`flex-shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all duration-300 w-16 h-20 text-3xl font-khmer ${styleClass}`}
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