import React, { useEffect, useState, useRef } from 'react';
import opentype from 'opentype.js';

// Путь к шрифту. Убедись, что файл лежит в public/fonts/
const DEFAULT_FONT_URL = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

const COLORS = {
  CONSONANT: '#ffb020', // Оранжевый
  VOWEL: '#ff4081',     // Розовый
  SUBSCRIPT: '#6b5cff', // Синий
  OTHER: '#34d399'      // Зеленый
};

function getCharColor(charPart) {
  const code = charPart.codePointAt(0);
  if (code >= 0x1780 && code <= 0x17a2) return COLORS.CONSONANT;
  if (code >= 0x17a3 && code <= 0x17b5) return COLORS.VOWEL;
  if (code >= 0x17b6 && code <= 0x17c5) return COLORS.VOWEL;
  if (charPart.length > 1 || code === 0x17d2) return COLORS.SUBSCRIPT;
  return COLORS.OTHER;
}

export default function InteractiveVectorWord({
  word,
  parts,
  onPartClick,
  fontSize = 120
}) {
  const [font, setFont] = useState(null);
  const [svgPaths, setSvgPaths] = useState([]);
  const [viewBox, setViewBox] = useState('0 0 100 100');
  const containerRef = useRef(null);

  // 1. Загрузка шрифта
  useEffect(() => {
    opentype.load(DEFAULT_FONT_URL, (err, loadedFont) => {
      if (err) {
        console.error('Font loading failed:', err);
      } else {
        setFont(loadedFont);
      }
    });
  }, []);

  // 2. Генерация векторов
  useEffect(() => {
    if (!font || !parts.length) return;

    const paths = [];
    let currentX = 0;
    // Базовая линия для кхмерского шрифта
    const baseline = fontSize * 1.2;

    parts.forEach((part, index) => {
      // Превращаем часть текста в кривые
      const path = font.getPath(part, currentX, baseline, fontSize);

      paths.push({
        d: path.toPathData(2),
        char: part,
        index: index,
        color: getCharColor(part)
      });

      // Сдвигаем курсор на ширину этой части
      currentX += font.getAdvanceWidth(part, fontSize);
    });

    const totalWidth = currentX;
    const totalHeight = fontSize * 1.8;
    setViewBox(`0 0 ${totalWidth} ${totalHeight}`);
    setSvgPaths(paths);

  }, [font, parts, fontSize]);

  if (!font) {
    return <div className="text-cyan-400 animate-pulse">Loading Vector Engine...</div>;
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <svg
        viewBox={viewBox}
        width={viewBox.split(' ')[2]}
        height={viewBox.split(' ')[3]}
        className="overflow-visible drop-shadow-2xl select-none touch-none"
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        {svgPaths.map((p, i) => (
          <path
            key={i}
            d={p.d}
            onClick={() => onPartClick(p.char, p.index)}
            fill="white"
            className="transition-all duration-200 cursor-pointer hover:scale-[1.02]"
            onMouseEnter={(e) => {
              e.currentTarget.style.fill = p.color;
              e.currentTarget.style.filter = `drop-shadow(0 0 15px ${p.color})`;
              // Поднимаем слой наверх
              e.currentTarget.parentElement.appendChild(e.currentTarget);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.fill = "white";
              e.currentTarget.style.filter = "none";
            }}
          />
        ))}
      </svg>
    </div>
  );
}