import React, { useState, useRef } from 'react';
import { Sun, Moon, Volume2 } from 'lucide-react';

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
  const [clickedIndex, setClickedIndex] = useState(null);
  const audioRef = useRef(null);

  // Используем части из JSON
  const parts = char_split && char_split.length > 0 ? char_split : (word ? word.split('') : []);

  // --- ЗАГРУЗКА ШРИФТА (CSS) ---
  // Мы добавляем шрифт через style-тег, чтобы он точно применился к спанам
  const fontFaceStyle = `
    @font-face {
      font-family: 'KhmerLessonFont';
      src: url('${DEFAULT_KHMER_FONT_URL}') format('truetype');
      font-display: block;
    }
    .khmer-word-span {
      font-family: 'KhmerLessonFont', 'Noto Sans Khmer', serif;
    }
    /* Хак для удаления пунктирных кругов в некоторых браузерах */
    .khmer-word-span {
      font-variant-ligatures: common-ligatures;
    }
  `;

  // Тема
  const getTheme = () => {
    if (letter_series === 1) return { badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Sun size={12}/> A-Series</div> };
    if (letter_series === 2) return { badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Moon size={12}/> O-Series</div> };
    return { badge: null };
  };
  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    // Чистим путь от лишних слешей
    const cleanPath = file.startsWith('/') ? file : `/sounds/${file}`;

    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    const audio = new Audio(cleanPath);
    audioRef.current = audio;
    audio.play().catch(e => console.warn("Audio play error:", e));
  };

  const handlePartClick = (part, index) => {
    if (status === 'success') return;
    setClickedIndex(index);

    // Логика звука
    const sound = char_audio_map?.[part] || char_audio_map?.[target_char];
    if (sound) playAudio(sound);

    // Сравниваем. Удаляем пробелы на всякий случай.
    const cleanPart = part.trim();
    const cleanTarget = target_char.trim();

    // Проверяем: содержит ли часть целевую букву?
    if (cleanPart.includes(cleanTarget)) {
      setStatus('success');
      playAudio('success.mp3');
      if (word_audio) setTimeout(() => playAudio(word_audio), 1000);
      onComplete();
    } else {
      setStatus('error');
      playAudio('error.mp3');

      // Сброс ошибки через полсекунды
      setTimeout(() => {
        if (status !== 'success') {
            setStatus('searching');
            setClickedIndex(null);
        }
      }, 500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">
      <style>{fontFaceStyle}</style>

      {/* 1. ГЛАВНОЕ ИНТЕРАКТИВНОЕ СЛОВО */}
      <div
        className={`
            relative mb-12 select-none text-center
            ${status === 'success' ? 'scale-110 duration-500' : ''}
        `}
      >
         {/* Фоновое свечение при успехе */}
         {status === 'success' && (
            <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse rounded-full"></div>
         )}

         {/* КОНТЕЙНЕР СЛОВА
            Используем text-9xl и inline-block.
            Никакого flex! Flex ломает лигатуры.
         */}
         <div className="relative z-10 khmer-word-span text-7xl md:text-9xl leading-normal tracking-normal text-white drop-shadow-2xl">
            {parts.map((part, index) => {
               const isClicked = clickedIndex === index;
               const isTarget = part.includes(target_char.trim());
               const isSuccess = status === 'success' && isTarget;
               const isError = status === 'error' && isClicked;

               // Цвет текста
               let colorClass = "text-white";
               if (status === 'success') {
                   // Если успех - целевая буква зеленая, остальные тусклые
                   colorClass = isTarget ? "text-emerald-400" : "text-white/30 blur-[1px]";
               } else if (isError) {
                   colorClass = "text-red-500";
               } else {
                   // Обычное состояние: белый, при наведении голубой
                   colorClass = "text-white hover:text-cyan-400";
               }

               return (
                  <span
                    key={index}
                    onClick={() => handlePartClick(part, index)}
                    className={`
                        cursor-pointer transition-all duration-200 inline-block
                        ${colorClass}
                        ${isError ? 'animate-shake' : ''}
                        ${status === 'searching' ? 'active:scale-95' : ''}
                    `}
                    style={{
                        // Микро-оптимизация рендеринга
                        display: 'inline-block',
                    }}
                  >
                    {part}
                  </span>
               )
            })}
         </div>

         {/* Кнопка звука (маленькая под словом) */}
         <div
            className="mt-4 flex justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => playAudio(word_audio)}
         >
            <div className="bg-white/5 border border-white/10 rounded-full p-2 hover:bg-cyan-500/20 hover:text-cyan-400">
                <Volume2 size={24} />
            </div>
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
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
    </div>
  );
}