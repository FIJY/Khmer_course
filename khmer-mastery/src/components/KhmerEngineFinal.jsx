import React, { useState } from 'react';
// Импортируем файл, который мы только что сгенерировали
import shapedData from '../data/shaped-text.json';

export default function KhmerEngineFinal({ text = "កាហ្វេ", onLetterClick }) {
  // Ищем слово в файле данных
  const glyphs = shapedData[text];
  const [selectedId, setSelectedId] = useState(null);

  // Если слова нет в файле (мы его не сгенерировали), показываем ошибку
  if (!glyphs) {
    return (
      <div className="text-red-500 border border-red-500 p-4">
        Ошибка: Слово "{text}" не найдено в shaped-text.json.
        <br/>
        Запустите: node scripts/generate-glyphs.cjs
      </div>
    );
  }

  // Вычисляем размеры SVG
  const allX = glyphs.map(g => g.bb.x2);
  const width = Math.max(...allX) + 50;

  return (
    <div className="flex justify-center items-center bg-gray-900 p-6 rounded-xl">
      <svg
        viewBox={`0 -50 ${width} 300`}
        className="max-h-[200px] w-full overflow-visible"
      >
        {glyphs.map((glyph, i) => {
           const isSelected = selectedId === i;
           return (
            <g
              key={i}
              onClick={() => {
                setSelectedId(i);
                if (onLetterClick) onLetterClick(glyph.char);
                console.log("Буква:", glyph.char);
              }}
              className="cursor-pointer hover:opacity-80"
            >
              <path
                d={glyph.d}
                fill={isSelected ? "#22d3ee" : "white"} // Голубой при клике
                stroke={isSelected ? "#22d3ee" : "none"}
                strokeWidth="2"
                style={{ transition: "all 0.2s" }}
              />
            </g>
           );
        })}
      </svg>
    </div>
  );
}