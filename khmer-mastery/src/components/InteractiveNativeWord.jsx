import React, { useState } from 'react';

// Цвета
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

export default function InteractiveNativeWord({
  word,
  parts,
  onPartClick,
  fontSize = 120
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div
      className="relative inline-block select-none"
      style={{
        fontFamily: '"Noto Sans Khmer", serif',
        fontSize: `${fontSize}px`,
        lineHeight: 1.6, // Чуть больше воздуха, чтобы свечение не перекрывало соседей
        cursor: 'default'
      }}
    >
      {parts.map((part, index) => {
        const color = getCharColor(part);
        const isHovered = hoveredIndex === index;

        return (
          <span
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={(e) => {
              e.stopPropagation();
              onPartClick(part, index);
            }}
            style={{
              display: 'inline-block', // Важно для трансформаций
              transition: 'all 0.2s ease-out',
              position: 'relative',

              // 1. ЦВЕТ БУКВЫ
              // Если навели - берем цвет категории. Если нет - белый.
              color: isHovered ? color : 'white',

              // 2. НЕОНОВОЕ СВЕЧЕНИЕ (По форме буквы!)
              // Это убирает ощущение "квадрата". Светится только контур.
              textShadow: isHovered
                ? `0 0 10px ${color}, 0 0 20px ${color}, 0 0 40px ${color}`
                : 'none',

              // 3. ЭФФЕКТ "ВСПЛЫТИЯ"
              // Буква чуть-чуть увеличивается и всплывает, отделяясь от слова
              transform: isHovered ? 'scale(1.1) translateY(-5px)' : 'scale(1) translateY(0)',
              zIndex: isHovered ? 10 : 1, // Поверх соседей
              cursor: 'pointer'
            }}
          >
            {part}
          </span>
        );
      })}
    </div>
  );
}