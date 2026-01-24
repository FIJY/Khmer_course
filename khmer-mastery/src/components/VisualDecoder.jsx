import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Volume2, Loader2 } from 'lucide-react';
import InteractivePixelWord from './InteractivePixelWord'; // <--- НОВЫЙ ИМПОРТ

const DEFAULT_KHMER_FONT_URL = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function VisualDecoder({ data, onComplete }) {
  const {
    word, target_char, hint, english_translation,
    pronunciation, letter_series, word_audio,
    char_audio_map, char_split
  } = data;

  const [status, setStatus] = useState('searching');
  const [fontLoaded, setFontLoaded] = useState(false);
  const audioRef = useRef(null);

  const parts = char_split && char_split.length > 0 ? char_split : (word ? word.split('') : []);

  useEffect(() => {
    const font = new FontFace('Noto Sans Khmer', `url(${DEFAULT_KHMER_FONT_URL})`);
    font.load().then(f => {
      document.fonts.add(f);
      setFontLoaded(true);
    }).catch(() => setFontLoaded(true));
  }, []);

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

  const handlePartClick = (part) => {
    if (status === 'success') return;

    const sound = char_audio_map?.[part] || char_audio_map?.[target_char];
    if (sound) playAudio(sound);

    if (part.includes(target_char.trim())) {
      setStatus('success');
      playAudio('success.mp3');
      if (word_audio) setTimeout(() => playAudio(word_audio), 1000);
      onComplete();
    } else {
      playAudio('error.mp3');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">

      <div className={`mb-12 relative transition-all duration-700 ${status === 'success' ? 'scale-110' : ''}`}>
         {status === 'success' && <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse rounded-full"/>}

         {!fontLoaded && <div className="text-cyan-400 animate-pulse">Loading...</div>}

         {fontLoaded && (
            <InteractivePixelWord
                word={word}
                parts={parts}
                onPartClick={handlePartClick}
                fontSize={130}
            />
         )}

         <div className="mt-6 flex justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => playAudio(word_audio)}>
            <div className="bg-white/5 border border-white/10 rounded-full p-2 hover:bg-cyan-500/20 hover:text-cyan-400">
                <Volume2 size={24} />
            </div>
         </div>
      </div>

      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
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