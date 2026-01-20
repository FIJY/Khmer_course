import React from 'react';
import { Puzzle, Volume2, LayoutGrid } from 'lucide-react';
import KhmerColoredText from '../KhmerColoredText';

const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function InventorySlide({ data, onPlayAudio }) {
  return (
    <div className="w-full flex flex-col items-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex items-center gap-2 text-gray-500 mb-2">
        <Puzzle size={16} />
        <span className="font-black uppercase tracking-[0.2em] text-[10px]">The Inventory</span>
      </div>

      {/* Главная карточка слова */}
      <div className="bg-gray-900 border border-white/10 rounded-[2.5rem] p-8 w-full text-center relative overflow-hidden">

        <div className="flex justify-center mb-6">
          <KhmerColoredText
             text={data.word}
             fontUrl={DEFAULT_KHMER_FONT_URL}
             fontSize={64}
          />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-white">{data.pronunciation}</h2>
          <p className="text-cyan-400 text-lg italic font-medium">{data.translation}</p>
        </div>

         {data.audio && (
           <button
             onClick={() => onPlayAudio(data.audio)}
             className="absolute top-4 right-4 p-2 bg-gray-800/80 rounded-full text-cyan-400 border border-white/5 hover:bg-gray-700 transition-colors"
           >
             <Volume2 size={20} />
           </button>
        )}
      </div>

      {/* Чертеж (Blueprint) - Разбивка на буквы */}
      <div className="w-full bg-black/20 rounded-3xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid size={14} className="text-gray-600" />
          <p className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">
            Blueprint
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {(data.chars || []).map((char, idx) => (
            <div key={idx} className="bg-gray-800 border border-white/10 rounded-2xl w-16 h-20 flex items-center justify-center shadow-lg relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
               <KhmerColoredText
                 text={char}
                 fontUrl={DEFAULT_KHMER_FONT_URL}
                 fontSize={32}
               />
               <span className="absolute bottom-1 right-2 text-[8px] text-gray-600 font-mono">{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}