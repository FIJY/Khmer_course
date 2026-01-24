import React, { useEffect, useState } from 'react';
import { getKhmerGlyphData } from '../lib/khmerGlyphRenderer';

const DEFAULT_FONT = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function InteractiveKhmerWord({ word, targetChar, onPartClick }) {
  const [vectorData, setVectorData] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let active = true;
    setUseFallback(false);

    getKhmerGlyphData({ text: word, fontUrl: DEFAULT_FONT, fontSize: 130 })
      .then(data => {
        if (!active) return;
        if (data) setVectorData(data);
        else setUseFallback(true); // Движок упал -> включаем фоллбек
      })
      .catch(() => {
        if (active) setUseFallback(true);
      });

    return () => { active = false; };
  }, [word]);

  // ПЛАН Б: Если движок не сработал, рисуем просто буквы кнопками
  if (useFallback) {
    return (
      <div className="flex justify-center items-center">
        {word.split('').map((char, i) => (
          <button
            key={i}
            onClick={() => onPartClick(char)}
            className="text-7xl font-khmer text-white hover:text-cyan-400 active:scale-95 transition-transform px-1"
          >
            {char}
          </button>
        ))}
      </div>
    );
  }

  // ПЛАН А: Векторная красота (пока грузится или если сработал)
  if (!vectorData) return <div className="text-6xl font-khmer animate-pulse text-gray-500">{word}</div>;

  return (
    <svg
      viewBox={vectorData.viewBox}
      width={vectorData.width}
      height={vectorData.height}
      className="overflow-visible drop-shadow-2xl"
    >
      {vectorData.paths.map((p, i) => {
        return (
          <path
            key={i}
            d={p.d}
            onClick={() => onPartClick(p.char)}
            fill="white"
            // Расширяем зону клика (strokeWidth)
            stroke="transparent"
            strokeWidth="30"
            className="transition-all duration-200 cursor-pointer hover:fill-cyan-400 hover:scale-110 origin-center"
          />
        );
      })}
    </svg>
  );
}