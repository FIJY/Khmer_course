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

  // Если частей нет, просто показываем слово
  if (!parts || parts.length === 0) {
    return <div className="text-white text-9xl font-khmer">{word}</div>;
  }

  return (
    <div
      className="relative inline-block select-none cursor-pointer"
      style={{
        fontFamily: '"Noto Sans Khmer", serif',
        fontSize: `${fontSize}px`,
        lineHeight: 1.5,
        // Важно: display flex может сломать лигатуры, поэтому используем обычный текст
        // Но чтобы ловить наведение на части, используем span
      }}
    >
      {parts.map((part, index) => {
        const color = getCharColor(part);
        const isHovered = hoveredIndex === index;

        return (
          <span
            key={index}
            onClick={() => onPartClick(part, index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              color: isHovered ? color : 'white',
              transition: 'all 0.15s ease-out',
              // Свечение при наведении (создает эффект "Glow" по форме буквы)
              textShadow: isHovered ? `0 0 30px ${color}, 0 0 10px ${color}` : 'none',
              position: 'relative',
              zIndex: isHovered ? 10 : 1,
              // Важно для кхмерского: cursor pointer на буквах
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