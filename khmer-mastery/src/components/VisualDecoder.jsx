import React, { useState, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import InteractiveKhmerWord from './InteractiveKhmerWord';

export default function VisualDecoder({ data, onComplete }) {
  const {
    word, target_char, hint, english_translation,
    pronunciation, word_audio, char_audio_map
  } = data;

  const [status, setStatus] = useState('searching');
  const audioRef = useRef(null);

  const playAudio = (file) => {
    if (!file) return;
    const audio = new Audio(`/sounds/${file}`);
    audio.play().catch(e => console.warn(e));
  };

  const handleClick = (char) => {
    if (status === 'success') return;

    const sound = char_audio_map?.[char] || char_audio_map?.[target_char];
    if (sound) playAudio(sound);

    if (char === target_char) {
      setStatus('success');
      playAudio('success.mp3');
      if (word_audio) setTimeout(() => playAudio(word_audio), 1000);
      onComplete();
    } else {
      playAudio('error.mp3');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] py-10">

      {/* ИНТЕРАКТИВНОЕ СЛОВО */}
      <div className={`mb-12 ${status === 'success' ? 'scale-110 duration-500' : ''}`}>
         {status === 'success' && <div className="absolute inset-0 bg-emerald-500/30 blur-3xl animate-pulse"/>}

         <InteractiveKhmerWord
            word={word}
            targetChar={target_char}
            onPartClick={handleClick}
         />
      </div>

      {/* ИНФО */}
      <div className="text-center space-y-3">
         <h2 className="text-3xl font-black text-white italic">{english_translation}</h2>
         <p className="text-cyan-400 font-mono text-xl">/{pronunciation}/</p>

         <div className="mt-4 inline-block bg-gray-900 border border-white/10 px-6 py-2 rounded-full">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">
               Mission: {hint}
            </span>
         </div>
      </div>
    </div>
  );
}