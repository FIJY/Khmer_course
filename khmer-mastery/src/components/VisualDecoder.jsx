import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Volume2, AlertCircle } from 'lucide-react';
import KhmerColoredText from './KhmerColoredText';

// Дефолтный шрифт
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
  const [renderError, setRenderError] = useState(false); // Ловим ошибку рендера
  const audioRef = useRef(null);

  // Если разбивка не пришла, создаем массив букв
  const chars = char_split && char_split.length > 0 ? char_split : (word ? word.split('') : []);

  // Тема (Sun/Moon)
  const getTheme = () => {
    if (letter_series === 1) return { color: "text-amber-400", badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Sun size={12}/> A-Series</div> };
    if (letter_series === 2) return { color: "text-indigo-400", badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Moon size={12}/> O-Series</div> };
    return { color: "text-white", badge: null };
  };
  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    const path = `/sounds/${file}`;
    console.log("🔊 Play:", path);

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(e => console.warn("Audio error (missing file?):", path));
  };

  const handleCharClick = (char, index) => {
    if (status === 'success') return;
    setSelectedCharIndex(index);

    // Ищем звук: сначала буквы, потом целевой буквы, потом слова
    const soundToPlay = char_audio_map?.[char] || char_audio_map?.[target_char];

    // Проверяем, содержит ли выбранная часть целевую букву
    if (char.includes(target_char)) {
      setStatus('success');
      playAudio('success.mp3'); // Убедись, что файл есть!
      if (soundToPlay) setTimeout(() => playAudio(soundToPlay), 800);
      if (word_audio) setTimeout(() => playAudio(word_audio), 1800);
      onComplete();
    } else {
      setStatus('error');
      playAudio('error.mp3');
      if (soundToPlay) setTimeout(() => playAudio(soundToPlay), 600);
      setTimeout(() => { setStatus('searching'); setSelectedCharIndex(null); }, 1000);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-start min-h-[60vh] py-4">

      {/* 1. ГЛАВНОЕ СЛОВО (КРАСИВОЕ И ЦЕЛОЕ) */}
      <div className="mb-8 relative group cursor-pointer text-center" onClick={() => playAudio(word_audio)}>

         {/* Пробуем нарисовать векторное слово. Если ошибка — рисуем обычный текст */}
         {!renderError ? (
             <div className="relative z-10 drop-shadow-2xl">
                <KhmerColoredText
                    text={word}
                    fontUrl={DEFAULT_KHMER_FONT_URL}
                    fontSize={96}
                    onStatus={(st) => { if(st.state === 'error' || st.state === 'fallback') setRenderError(true); }}
                />
             </div>
         ) : (
             <h1 className="text-7xl md:text-8xl font-khmer text-white leading-normal tracking-normal">{word}</h1>
         )}

         {/* Иконка звука */}
         <div className="mt-4 opacity-50 flex justify-center">
            <Volume2 size={24} className="text-cyan-400" />
         </div>
      </div>

      {/* 2. ИНФО (ПЕРЕВОД) */}
      <div className="text-center space-y-2 mb-10 animate-in fade-in slide-in-from-bottom-2">
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
                Find: {hint}
                </span>
            </div>
         </div>
      </div>

      {/* 3. КНОПКИ РАЗБОРА (ЕСЛИ РЕНДЕР СЛОВА НЕ ИНТЕРАКТИВНЫЙ) */}
      {/* Рисуем части слова как отдельные кнопки, чтобы можно было точно кликнуть */}
      <div className="flex flex-wrap justify-center items-center gap-3 w-full max-w-md px-2">
        {chars.map((char, index) => {
          const isTarget = char.includes(target_char);
          let styleClass = "bg-gray-800 border-white/10 text-gray-300 hover:border-cyan-500/50 hover:bg-gray-700 hover:text-white";

          if (status === 'success') {
            styleClass = isTarget
                ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-110 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                : "opacity-20 blur-[1px]";
          } else if (status === 'error' && selectedCharIndex === index) {
            styleClass = "bg-red-900/40 border-red-500 text-red-500 animate-shake";
          }

          return (
            <button
              key={index}
              onClick={() => handleCharClick(char, index)}
              className={`flex-shrink-0 rounded-2xl border-2 flex items-center justify-center transition-all duration-200 min-w-[4rem] h-20 px-4 text-3xl font-khmer ${styleClass}`}
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