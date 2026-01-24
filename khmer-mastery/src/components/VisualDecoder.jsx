import React, { useState, useRef } from 'react';
import { Sun, Moon, Volume2 } from 'lucide-react';

// ИМПОРТИРУЕМ ФИНАЛЬНЫЙ ДВИЖОК
import KhmerEngineFinal from './KhmerEngineFinal';

const DEFAULT_KHMER_FONT_URL = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function VisualDecoder({ data, onComplete }) {
  const {
    word, hint, english_translation,
    pronunciation, letter_series, word_audio
  } = data;

  const [status, setStatus] = useState('searching');
  const audioRef = useRef(null);

  const getTheme = () => {
    if (letter_series === 1) return { badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Sun size={12}/> A-Series</div> };
    if (letter_series === 2) return { badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Moon size={12}/> O-Series</div> };
    return { badge: null };
  };
  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    const path = file.startsWith('/') ? file : `/sounds/${file}`;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4 relative">

      {/* Метка v7.0 */}
      <div className="absolute top-0 right-0 text-[9px] text-green-500 opacity-50 font-mono border border-green-500 px-1 rounded">
        ENGINE: v7.0 (FINAL)
      </div>

      <div className={`mb-12 w-full flex justify-center transition-all duration-700 ${status === 'success' ? 'scale-110' : ''}`}>
         {status === 'success' && <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse rounded-full"/>}

         <KhmerEngineFinal
            text={word}
            fontSize={140}
         />

         <div className="absolute -bottom-16 opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => playAudio(word_audio)}>
            <div className="bg-white/5 border border-white/10 rounded-full p-3 hover:bg-cyan-500/20 hover:text-cyan-400">
                <Volume2 size={24} />
            </div>
         </div>
      </div>

      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 mt-10">
         {pronunciation && <p className="text-cyan-300 font-mono text-xl tracking-widest">/{pronunciation}/</p>}
         <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">{english_translation}</h3>
         <div className="pt-6 flex justify-center gap-3">
             {theme.badge}
             <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-xl border border-white/10">Task: {hint}</span>
         </div>
      </div>
    </div>
  );
}