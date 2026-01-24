import React, { useEffect, useState } from 'react';
import { getKhmerGlyphData } from '../lib/khmerGlyphRenderer';

const DEFAULT_FONT = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function InteractiveKhmerWord({
  word,
  targetChar,
  onPartClick,
  revealedIndices, // NEW: Набор индексов, которые надо подсветить зеленым
  fontSize = 120
}) {
  const [vectorData, setVectorData] = useState(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let active = true;
    setUseFallback(false);

    getKhmerGlyphData({ text: word, fontUrl: DEFAULT_FONT, fontSize: fontSize })
      .then(data => {
        if (!active) return;
        if (data) setVectorData(data);
        else setUseFallback(true);
      })
      .catch(() => setUseFallback(true));

    return () => { active = false; };
  }, [word, fontSize]);

  // ПЛАН Б: Обычный текст (если движок упал)
  if (useFallback) {
    return (
      <div className="flex flex-wrap justify-center font-khmer text-white text-6xl gap-1">
        {word.split('').map((char, i) => {
           const isRevealed = revealedIndices?.has(i);
           return (
             <span
                key={i}
                onClick={() => onPartClick(char, i)}
                className={`cursor-pointer ${isRevealed ? 'text-emerald-400' : ''}`}
             >
                {char}
             </span>
           )
        })}
      </div>
    );
  }

  if (!vectorData) return <div className="text-4xl font-khmer animate-pulse text-gray-500">{word}</div>;

  return (
    <svg
      viewBox={vectorData.viewBox}
      width={vectorData.width}
      height={vectorData.height}
      className="overflow-visible drop-shadow-2xl"
    >
      {vectorData.paths.map((p, i) => {
        // Логика подсветки
        // 1. Если это целевая буква (для Декодера)
        // 2. ИЛИ если этот индекс есть в revealedIndices (для Матрицы)
        const isTarget = targetChar && p.char === targetChar;
        const isRevealed = revealedIndices && revealedIndices.has(p.charIndex);

        const fillColor = isRevealed ? "#34d399" : "white";

        return (
          <path
            key={i}
            d={p.d}
            onClick={() => onPartClick(p.char, p.charIndex)}
            fill={fillColor}
            stroke="transparent"
            strokeWidth="30"
            className="transition-all duration-200 cursor-pointer hover:fill-cyan-400 hover:scale-110 origin-center"
            style={{
               fill: fillColor,
               opacity: isRevealed ? 1 : 0.9
            }}
          />
        );
      })}
    </svg>
  );
}