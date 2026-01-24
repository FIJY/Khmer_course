import React, { useRef, useState, useLayoutEffect } from 'react';

const COLORS = {
  CONSONANT: '#ffb020', // Оранжевый
  VOWEL: '#ff4081',     // Розовый
  SUBSCRIPT: '#6b5cff', // Синий
  OTHER: '#34d399'      // Зеленый
};

function getCharColor(char) {
  const code = char.codePointAt(0);
  if (code >= 0x1780 && code <= 0x17a2) return COLORS.CONSONANT;
  if (code >= 0x17a3 && code <= 0x17b5) return COLORS.VOWEL;
  if (code >= 0x17b6 && code <= 0x17c5) return COLORS.VOWEL;
  if (char.length > 1 || code === 0x17d2) return COLORS.SUBSCRIPT;
  return COLORS.OTHER;
}

export default function InteractiveOverlayWord({
  word,
  parts,
  onPartClick,
  fontSize = 120
}) {
  const containerRef = useRef(null);
  const textRef = useRef(null);

  const [zones, setZones] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // 1. ВЫЧИСЛЯЕМ КООРДИНАТЫ БУКВ
  useLayoutEffect(() => {
    if (!textRef.current) return;

    const timer = setTimeout(() => {
        const textNode = textRef.current.firstChild;
        if (!textNode) return;

        const range = document.createRange();
        const newZones = [];
        let currentIndex = 0;

        const containerRect = containerRef.current.getBoundingClientRect();

        parts.forEach((part, index) => {
            const len = part.length;
            try {
                range.setStart(textNode, currentIndex);
                range.setEnd(textNode, currentIndex + len);
                const rects = range.getClientRects();

                if (rects.length > 0) {
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    for (const r of rects) {
                        minX = Math.min(minX, r.left);
                        minY = Math.min(minY, r.top);
                        maxX = Math.max(maxX, r.right);
                        maxY = Math.max(maxY, r.bottom);
                    }

                    newZones.push({
                        index,
                        char: part,
                        color: getCharColor(part),
                        left: minX - containerRect.left,
                        top: minY - containerRect.top,
                        width: maxX - minX,
                        height: maxY - minY
                    });
                }
            } catch (e) { console.error(e); }
            currentIndex += len;
        });

        setZones(newZones);
    }, 100);

    return () => clearTimeout(timer);
  }, [word, parts, fontSize]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = zones.find(z =>
        x >= z.left && x <= z.left + z.width &&
        y >= z.top && y <= z.top + z.height
    );

    setHoveredIndex(hit ? hit.index : null);
  };

  const getClipPath = () => {
    if (hoveredIndex === null) return 'inset(100%)';
    const zone = zones[hoveredIndex];
    if (!zone) return 'inset(100%)';

    const top = zone.top;
    const right = (containerRef.current?.offsetWidth || 0) - (zone.left + zone.width);
    const bottom = (containerRef.current?.offsetHeight || 0) - (zone.top + zone.height);
    const left = zone.left;

    return `inset(${top}px ${right}px ${bottom}px ${left}px)`;
  };

  const activeZone = hoveredIndex !== null ? zones[hoveredIndex] : null;

  return (
    <div
        ref={containerRef}
        className="relative inline-block select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => activeZone && onPartClick(activeZone.char, activeZone.index)}
        style={{ cursor: hoveredIndex !== null ? 'pointer' : 'default' }}
    >
      {/* СЛОЙ 1: БЕЛЫЙ ТЕКСТ */}
      <div
        ref={textRef}
        className="text-white font-khmer relative z-10"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
      >
        {word}
      </div>

      {/* СЛОЙ 2: ЦВЕТНОЙ ТЕКСТ (Обрезается маской) */}
      <div
        className="absolute inset-0 font-khmer z-20 pointer-events-none"
        style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.5,
            color: activeZone ? activeZone.color : 'transparent',
            clipPath: getClipPath(),
            filter: activeZone ? `drop-shadow(0 0 10px ${activeZone.color})` : 'none',
            transition: 'clip-path 0.1s ease-out, color 0.2s'
        }}
        aria-hidden="true"
      >
        {word}
      </div>
    </div>
  );
}
