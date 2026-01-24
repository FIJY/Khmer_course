import React, { useEffect, useState } from 'react';
import { getKhmerGlyphData } from '../lib/khmerGlyphRenderer';

const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function InteractiveKhmerWord({
  word,
  targetChar,
  onPartClick,
  fontSize = 120
}) {
  const [vectorData, setVectorData] = useState(null);

  useEffect(() => {
    let active = true;
    getKhmerGlyphData({
      text: word,
      fontUrl: DEFAULT_KHMER_FONT_URL,
      fontSize: fontSize
    }).then(data => {
      if (active) setVectorData(data);
    });
    return () => { active = false; };
  }, [word, fontSize]);

  if (!vectorData) return <div className="animate-pulse h-32 bg-gray-800/30 rounded-xl w-64 mx-auto"></div>;

  return (
    <div className="relative inline-block select-none filter drop-shadow-2xl">
      <svg
        width={vectorData.width}
        height={vectorData.height}
        viewBox={vectorData.viewBox}
        className="overflow-visible"
      >
        {vectorData.paths.map((p, i) => {
          // Определяем, является ли эта часть целью
          const isTarget = p.char === targetChar;

          return (
            <path
              key={i}
              d={p.d}
              onClick={() => onPartClick(p.char, i)}

              // Стилизация и Ховер
              className="transition-all duration-300 cursor-pointer"
              fill="white"
              style={{
                fill: 'white', // Базовый цвет
                opacity: 0.9,
              }}

              // CSS-события для смены цвета при наведении
              onMouseEnter={(e) => {
                e.target.style.fill = "#22d3ee"; // Cyan при наведении
                e.target.style.filter = "drop-shadow(0 0 10px rgba(34,211,238,0.8))";
                e.target.style.transform = "scale(1.1) translateY(-5px)";
                e.target.style.zIndex = "10";
              }}
              onMouseLeave={(e) => {
                e.target.style.fill = "white";
                e.target.style.filter = "none";
                e.target.style.transform = "none";
                e.target.style.zIndex = "1";
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}