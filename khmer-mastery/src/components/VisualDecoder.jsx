import React, { useState, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import InteractiveKhmerWord from './InteractiveKhmerWord'; // <--- НОВЫЙ

export default function VisualDecoder({ data, onComplete }) {
  const {
    word,
    target_char, // Например "ក"
    hint,
    english_translation,
    pronunciation,
    letter_series,
    word_audio,
    char_audio_map
  } = data;

  const [status, setStatus] = useState('searching');
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
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handlePartClick = (clickedChar, index) => {
    if (status === 'success') return;

    // Звук
    const sound = char_audio_map?.[clickedChar] || char_audio_map?.[target_char];

    if (clickedChar === target_char) {
      // ПОБЕДА
      setStatus('success');
      playAudio('success.mp3');
      if (sound) setTimeout(() => playAudio(sound), 800);
      onComplete();
    } else {
      // ОШИБКА
      playAudio('error.mp3');
      if (sound) setTimeout(() => playAudio(sound), 600);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">

      {/* 1. ИНТЕРАКТИВНОЕ СЛОВО (ВЕКТОРНОЕ) */}
      <div className={`mb-10 transition-all duration-700 ${status === 'success' ? 'scale-110' : ''}`}>
         {/* Если успех — подсветка сзади */}
         {status === 'success' && (
            <div className="absolute inset-0 bg-emerald-500/30 blur-3xl animate-pulse rounded-full"></div>
         )}

         <InteractiveKhmerWord
            word={word}
            targetChar={target_char}
            onPartClick={handlePartClick}
            fontSize={130} // Огромный размер для удобства
         />
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
    </div>
  );
}