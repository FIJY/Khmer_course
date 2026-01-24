import React, { useEffect, useState } from 'react';
import { getKhmerGlyphData } from '../lib/khmerGlyphRenderer';

const DEFAULT_FONT = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function InteractiveKhmerWord({ word, targetChar, onPartClick }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    getKhmerGlyphData({ text: word, fontUrl: DEFAULT_FONT, fontSize: 120 })
      .then(setData);
  }, [word]);

  if (!data) return <div className="text-6xl font-khmer animate-pulse">{word}</div>;

  return (
    <svg
      viewBox={data.viewBox}
      width={data.width}
      height={data.height}
      className="overflow-visible drop-shadow-2xl"
    >
      {data.paths.map((p, i) => {
        // Логика: если это часть целевой буквы (например, нога буквы 'K')
        const isTarget = p.char === targetChar;

        return (
          <path
            key={i}
            d={p.d}
            onClick={() => onPartClick(p.char)}
            fill="white"
            className="transition-all duration-200 cursor-pointer hover:fill-cyan-400 hover:scale-110 origin-center"
            style={{
               fill: 'white',
               stroke: 'transparent',
               strokeWidth: 20 // Увеличивает зону клика
            }}
          />
        );
      })}
    </svg>
  );
}