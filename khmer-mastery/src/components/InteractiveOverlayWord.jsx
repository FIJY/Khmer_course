import React, { useRef, useState, useLayoutEffect } from 'react';

// Цвета
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
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [zones, setZones] = useState([]);

  // Вычисляем зоны клика ПОСЛЕ рендеринга
  useLayoutEffect(() => {
    if (!textRef.current) return;

    // Даем шрифту мгновение на загрузку геометрии
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
                // Выделяем конкретный кусок текста внутри целого слова
                range.setStart(textNode, currentIndex);
                range.setEnd(textNode, currentIndex + len);

                // Спрашиваем у браузера: "Где этот кусок на экране?"
                const rects = range.getClientRects();

                // Собираем все прямоугольники части (для сложных букв)
                for (const r of rects) {
                    newZones.push({
                        index,
                        char: part,
                        color: getCharColor(part),
                        // Координаты относительно контейнера
                        left: r.left - containerRect.left,
                        top: r.top - containerRect.top,
                        width: r.width,
                        height: r.height
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

    // Проверяем, попала ли мышь в любую из зон
    // (reverse, чтобы верхние слои, например гласные сверху, имели приоритет)
    const hit = [...zones].reverse().find(z =>
        x >= z.left && x <= z.left + z.width &&
        y >= z.top && y <= z.top + z.height
    );

    setHoveredIndex(hit ? hit.index : null);
  };

  // Строим маску (clip-path) для цветного слоя
  const getClipPath = () => {
    if (hoveredIndex === null) return 'polygon(0 0, 0 0, 0 0)';

    // Собираем все прямоугольники, относящиеся к этой части буквы
    // (например, если буква состоит из двух частей)
    const activeZones = zones.filter(z => z.index === hoveredIndex);

    if (activeZones.length === 0) return 'polygon(0 0, 0 0, 0 0)';

    // Формируем CSS polygon для вырезания
    // Это позволяет подсвечивать сложные формы из нескольких кусков
    const paths = activeZones.map(z => {
        const t = z.top;
        const r = z.left + z.width;
        const b = z.top + z.height;
        const l = z.left;
        return `polygon(${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px)`;
    });

    // В CSS clip-path можно использовать только одну фигуру,
    // поэтому для простоты берем inset для главного прямоугольника,
    // или используем хитрость с наложением.
    // Для надежности сейчас используем inset первого блока (обычно буква цельная)
    const z = activeZones[0];
    const top = z.top;
    const right = (containerRef.current?.offsetWidth || 0) - (z.left + z.width);
    const bottom = (containerRef.current?.offsetHeight || 0) - (z.top + z.height);
    const left = z.left;

    return `inset(${top}px ${right}px ${bottom}px ${left}px)`;
  };

  const activePart = hoveredIndex !== null ? parts[hoveredIndex] : null;
  const activeColor = activePart ? getCharColor(activePart) : 'transparent';

  return (
    <div
        ref={containerRef}
        className="relative inline-block select-none cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => hoveredIndex !== null && onPartClick(parts[hoveredIndex], hoveredIndex)}
    >
      {/* СЛОЙ 1: БАЗА (Белый текст) */}
      <div
        ref={textRef}
        className="text-white font-khmer relative z-10"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}
      >
        {word}
      </div>

      {/* СЛОЙ 2: ПОДСВЕТКА (Цветной текст с маской) */}
      <div
        className="absolute inset-0 font-khmer z-20 pointer-events-none"
        style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.5,
            color: activeColor,
            // Магия: показываем цветной текст только в квадратике буквы
            clipPath: getClipPath(),
            // Добавляем outline, чтобы контур был четким
            WebkitTextStroke: activePart ? `1px ${activeColor}` : '0',
            // Свечение
            filter: activePart ? `drop-shadow(0 0 8px ${activeColor})` : 'none',
            transition: 'clip-path 0.05s linear, color 0.1s'
        }}
      >
        {word}
      </div>
    </div>
  );
}