import React, { useState, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import KhmerColoredText from './KhmerColoredText';

const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function VisualDecoder({ data, onComplete }) {
  const {
    target_char,
    hint,
    english_translation,
    pronunciation,
    letter_series,
    word_audio,
    char_audio_map,
    char_split // Массив частей слова ["ក", "ា", "ហ្វ", "េ"]
  } = data;

  const [status, setStatus] = useState('searching');
  const [shakingIndex, setShakingIndex] = useState(null); // Для анимации ошибки
  const audioRef = useRef(null);

  // Тема (Series)
  const getTheme = () => {
    if (letter_series === 1) return { color: "text-amber-400", badge: <span className="text-amber-400 text-xs font-bold border border-amber-500/30 px-2 py-1 rounded bg-amber-500/10 flex gap-1"><Sun size={14}/> Sun Series</span> };
    if (letter_series === 2) return { color: "text-indigo-400", badge: <span className="text-indigo-400 text-xs font-bold border border-indigo-500/30 px-2 py-1 rounded bg-indigo-500/10 flex gap-1"><Moon size={14}/> Moon Series</span> };
    return { color: "text-white", badge: null };
  };
  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    const path = `/sounds/${file}`; // Прямой путь
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

    // Звук части или цели
    const sound = char_audio_map?.[part] || char_audio_map?.[target_char];

    if (part === target_char) {
      // ПОБЕДА
      setStatus('success');
      playAudio('success.mp3');
      // Играем звук буквы, потом звук слова
      if (sound) setTimeout(() => playAudio(sound), 800);
      if (word_audio) setTimeout(() => playAudio(word_audio), 1800);
      onComplete();
    } else {
      // ОШИБКА
      setShakingIndex(index);
      playAudio('error.mp3');
      if (sound) setTimeout(() => playAudio(sound), 600);

      // Сброс тряски через 500мс
      setTimeout(() => setShakingIndex(null), 500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">

      {/* ЗАГОЛОВОК */}
      <div className="text-center mb-10 space-y-2">
         <h3 className="text-3xl font-black text-white uppercase italic tracking-tight">
            {english_translation}
         </h3>
         {pronunciation && (
            <p className="text-cyan-300 font-mono text-lg tracking-wider opacity-80">/{pronunciation}/</p>
         )}
         <div className="flex justify-center gap-3 mt-2">
            {theme.badge}
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-3 py-1 rounded border border-white/10">
              Find: {hint}
            </span>
         </div>
      </div>

      {/* --- ИНТЕРАКТИВНОЕ СЛОВО --- */}
      {/* Мы рендерим части слова рядом друг с другом, создавая иллюзию целого слова */}
      <div className="flex flex-wrap justify-center items-end bg-gray-900/50 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">

         {/* Фоновое свечение при успехе */}
         {status === 'success' && (
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse"></div>
         )}

         {char_split.map((part, index) => {
            const isTarget = part === target_char;
            const isShaking = shakingIndex === index;
            const isRevealed = status === 'success' && isTarget;

            return (
               <button
                  key={index}
                  onClick={() => handlePartClick(part, index)}
                  className={`
                    relative group transition-all duration-300 px-1 rounded-xl
                    ${isShaking ? 'animate-shake bg-red-500/20' : ''}
                    ${isRevealed ? 'scale-110 z-10' : 'hover:bg-white/5 hover:scale-105'}
                  `}
                  style={{ minWidth: '40px' }} // Чтобы узкие гласные было удобно нажимать
               >
                  {/* Рендерим каждую часть через твой крутой рендерер, чтобы она была цветной */}
                  <KhmerColoredText
                      text={part}
                      fontUrl={DEFAULT_KHMER_FONT_URL}
                      fontSize={96} // Крупный размер
                      className={`
                        transition-all duration-500
                        ${isRevealed ? 'drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]' : ''}
                      `}
                  />

                  {/* Подсветка при наведении, чтобы пользователь понимал, куда тыкать */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-white/10 rounded-xl transition-colors pointer-events-none"></div>
               </button>
            );
         })}
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}