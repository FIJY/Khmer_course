import React from 'react';
import { Zap, Volume2 } from 'lucide-react';
import KhmerColoredText from '../KhmerColoredText';

// Получаем URL шрифта из переменных окружения или дефолтный
const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function HeroSlide({ data, onPlayAudio }) {
  // data соответствует структуре learn_char из JSON

  return (
    <div className="w-full flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Карточка Героя */}
      <div className="bg-gray-900 border-2 border-cyan-500/20 rounded-[3rem] p-10 w-full relative overflow-hidden mb-6">

        {/* Фоновый эффект свечения */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50" />

        <div className="flex items-center justify-center gap-2 mb-8 opacity-80">
          <Zap size={16} className="text-amber-400 fill-amber-400" />
          <span className="text-amber-400 font-black uppercase tracking-[0.2em] text-[10px]">
            New Hero Unlocked
          </span>
        </div>

        {/* Большая анимированная буква */}
        <div className="mb-8 scale-150 origin-center flex justify-center">
          <KhmerColoredText
            text={data.char}
            fontUrl={DEFAULT_KHMER_FONT_URL}
            fontSize={96}
            className="animate-pulse-slow drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-white italic tracking-tight">{data.name}</h1>
          <p className="text-xs font-bold uppercase tracking-widest">
            Class: <span className={`${data.group === 'high' ? 'text-red-400' : 'text-blue-400'}`}>{data.group?.toUpperCase()}</span>
          </p>
        </div>

        {data.audio && (
           <button
             onClick={() => onPlayAudio(data.audio)}
             className="mt-8 p-4 bg-cyan-500 rounded-full text-black hover:bg-cyan-400 transition-transform active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
           >
             <Volume2 size={32} />
           </button>
        )}
      </div>

      {/* Блок мнемоники (Visual Hook) */}
      <div className="bg-gray-800/40 border border-white/5 rounded-3xl p-6 w-full text-left flex gap-5 items-start">
         <div className="p-3 bg-black/40 rounded-2xl border border-white/5 shrink-0 text-2xl">
           🧠
         </div>
         <div>
           <h3 className="text-white font-bold mb-1 uppercase text-xs tracking-wider text-cyan-500">Visual Hook</h3>
           <p className="text-gray-300 text-sm leading-relaxed font-medium">{data.hook}</p>
         </div>
      </div>
    </div>
  );
}