import React, { useState, useRef } from 'react';
import { Sun, Moon, Volume2 } from 'lucide-react';
import InteractiveCanvasWord from './InteractiveCanvasWord'; // <--- ИМПОРТ

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
  const audioRef = useRef(null);

  // Разбиваем слово для Canvas (чтобы он знал зоны)
  // Если char_split нет, просто режем по буквам
  const parts = char_split && char_split.length > 0 ? char_split : (word ? word.split('') : []);

  const getTheme = () => {
    if (letter_series === 1) return { badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Sun size={12}/> A-Series</div> };
    if (letter_series === 2) return { badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Moon size={12}/> O-Series</div> };
    return { badge: null };
  };
  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    const cleanPath = file.startsWith('/') ? file : `/sounds/${file}`;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(cleanPath);
    audioRef.current = audio;
    audio.play().catch(e => console.warn(e));
  };

  const handlePartClick = (part, index) => {
    if (status === 'success') return;

    // Звук буквы
    const sound = char_audio_map?.[part] || char_audio_map?.[target_char];
    if (sound) playAudio(sound);

    // Проверка
    if (part.includes(target_char)) {
      setStatus('success');
      playAudio('success.mp3');
      if (word_audio) setTimeout(() => playAudio(word_audio), 1000);
      onComplete();
    } else {
      setStatus('error');
      playAudio('error.mp3');
      setTimeout(() => setStatus('searching'), 500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">

      {/* ГЛАВНОЕ СЛОВО (CANVAS) */}
      <div className={`mb-12 transition-all duration-700 ${status === 'success' ? 'scale-110 drop-shadow-[0_0_25px_rgba(52,211,153,0.6)]' : ''}`}>

         {/* ИНТЕРАКТИВНЫЙ ХОЛСТ */}
         <InteractiveCanvasWord
            word={word}
            parts={parts}
            onPartClick={handlePartClick}
            fontSize={120} // Размер шрифта
            color="white"
            highlightColor="#22d3ee" // Цвет при наведении (Cyan)
         />

         {/* Иконка звука */}
         <div
            className="mt-6 flex justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => playAudio(word_audio)}
         >
            <div className="bg-white/5 border border-white/10 rounded-full p-2 hover:bg-cyan-500/20 hover:text-cyan-400">
                <Volume2 size={24} />
            </div>
         </div>
      </div>

      {/* ИНФО */}
      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
         {pronunciation && (
            <p className="text-cyan-300 font-mono text-xl tracking-widest">/{pronunciation}/</p>
         )}
         <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            {english_translation}
         </h3>

         <div className="pt-6 flex justify-center gap-3">
             {theme.badge}
             <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-xl border border-white/10">
               Task: {hint}
             </span>
         </div>
      </div>
    </div>
  );
}