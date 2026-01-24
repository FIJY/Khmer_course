import React, { useState, useEffect } from 'react';
import { Volume2, ScanSearch } from 'lucide-react';
import KhmerWordReader from '../KhmerWordReader';
import KhmerWordAnalyzer from '../KhmerWordAnalyzer';

// Ссылка на шрифт
const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function AnalysisSlide({ data, onPlayAudio }) {
  // Если в данных есть начальное слово, выбираем его, иначе первое слово из текста
  const [selectedWord, setSelectedWord] = useState('');

  // При загрузке слайда выбираем первое слово автоматически
  useEffect(() => {
    if (data.text && !selectedWord) {
      const firstWord = data.text.split(' ')[0];
      setSelectedWord(firstWord);
    }
  }, [data.text]);

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ЗАГОЛОВОК */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 text-cyan-400 mb-2">
          <ScanSearch size={24} />
          <span className="font-black uppercase tracking-widest text-xs">Deep Dive</span>
        </div>
        <h2 className="text-2xl font-black text-white italic uppercase">{data.title}</h2>
        <p className="text-slate-400 text-sm">{data.subtitle}</p>
      </div>

      {/* 1. READER (ЧИТАЛКА) - Кликабельное предложение */}
      <div className="bg-gray-900 border border-white/10 rounded-[2rem] p-6 mb-4 shadow-lg">
        <div className="flex justify-between items-start mb-4">
           <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tap a word to analyze</span>
           {data.audio && (
             <button onClick={() => onPlayAudio(data.audio)} className="text-cyan-400 hover:text-white transition-colors">
               <Volume2 size={20} />
             </button>
           )}
        </div>

        {/* Компонент, который ты загрузила */}
        <div className="text-2xl md:text-3xl font-khmer leading-relaxed text-center">
          <KhmerWordReader
            text={data.text}
            selectedWord={selectedWord}
            onSelectWord={setSelectedWord}
          />
        </div>

        <div className="mt-4 pt-4 border-t border-white/5 text-center">
           <p className="text-white font-medium text-lg">{data.translation}</p>
        </div>
      </div>

      {/* 2. ANALYZER (РАЗБОР) - Детали выбранного слова */}
      {selectedWord && (
        <div className="flex-1 bg-black/40 border border-white/10 rounded-[2rem] p-6 animate-in fade-in zoom-in duration-300">
           <div className="mb-4 flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Glyph Breakdown</span>
              <span className="text-2xl font-khmer text-cyan-400">{selectedWord}</span>
           </div>

           {/* Компонент, который ты загрузила */}
           <KhmerWordAnalyzer
              word={selectedWord}
              fontUrl={DEFAULT_KHMER_FONT_URL}
           />
        </div>
      )}
    </div>
  );
}