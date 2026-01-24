import React, { useEffect, useState, useRef } from 'react';

// Прямой путь к шрифту
const DEFAULT_FONT_URL = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';
// Путь к библиотеке в твоей папке vendor
const OPENTYPE_URL = '/vendor/opentype.module.js';

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

  // 1. Загрузка движка Opentype и Шрифта
  useEffect(() => {
    async function loadEngineAndFont() {
      try {
        // А. Загружаем библиотеку из твоей папки vendor
        // /* @vite-ignore */ говорит сборщику: "Не трогай это, файл уже там лежит"
        const opentypeModule = await import(/* @vite-ignore */ OPENTYPE_URL);
        const opentype = opentypeModule.default || opentypeModule;

        // Б. Загружаем шрифт
        opentype.load(DEFAULT_FONT_URL, (err, loadedFont) => {
          if (err) {
            console.error('Font loading failed:', err);
          } else {
            setFont(loadedFont);
          }
        });
      } catch (e) {
        console.error("Failed to load opentype.js from vendor:", e);
      }
    }

    loadEngineAndFont();
  }, []);

  // 2. Генерация векторов (Работает только когда font загружен)
  useEffect(() => {
    if (!font || !parts.length) return;

    const paths = [];
    let currentX = 0;
    const baseline = fontSize * 1.2;

    parts.forEach((part, index) => {
      const path = font.getPath(part, currentX, baseline, fontSize);

      paths.push({
        d: path.toPathData(2),
        char: part,
        index: index,
        color: getCharColor(part)
      });

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