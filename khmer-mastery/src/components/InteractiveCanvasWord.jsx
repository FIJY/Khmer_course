import React, { useRef, useEffect, useState } from 'react';

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

export default function InteractiveCanvasWord({
  word,
  parts,
  onPartClick,
  fontSize = 120,
  defaultColor = 'white'
}) {
  const canvasRef = useRef(null);
  const measureRef = useRef(null); // Ссылка на невидимый HTML-текст
  const [zones, setZones] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 1. ИЗМЕРЕНИЕ (Спрашиваем у браузера: "Где именно буквы?")
  useEffect(() => {
    if (!measureRef.current) return;

    // Даем браузеру время на отрисовку шрифта
    const timer = setTimeout(() => {
        const container = measureRef.current;
        const textNode = container.firstChild;
        if (!textNode) return;

        // Сохраняем размеры контейнера
        const cRect = container.getBoundingClientRect();
        setContainerSize({ width: container.offsetWidth, height: container.offsetHeight });

        const range = document.createRange();
        const newZones = [];
        let currentIndex = 0;

        parts.forEach((part, index) => {
            const len = part.length;
            try {
                range.setStart(textNode, currentIndex);
                range.setEnd(textNode, currentIndex + len);

                const rects = range.getClientRects();

                if (rects.length > 0) {
                    // Находим общий bounding box для всех частей буквы
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                    for (let i = 0; i < rects.length; i++) {
                        minX = Math.min(minX, rects[i].left);
                        minY = Math.min(minY, rects[i].top);
                        maxX = Math.max(maxX, rects[i].right);
                        maxY = Math.max(maxY, rects[i].bottom);
                    }

                    // Сохраняем координаты относительно контейнера
                    newZones.push({
                        x: minX - cRect.left,
                        y: minY - cRect.top,
                        width: maxX - minX,
                        height: maxY - minY,
                        char: part,
                        index: index,
                        color: getCharColor(part)
                    });
                }
            } catch (e) { console.warn("Error measuring", part); }
            currentIndex += len;
        });
        setZones(newZones);
    }, 150); // Чуть увеличил таймаут для надежности

    return () => clearTimeout(timer);
  }, [word, parts, fontSize]);

  // 2. ОТРИСОВКА (Используем точные координаты)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || zones.length === 0 || containerSize.width === 0) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    const { width, height } = containerSize;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Настройки шрифта должны совпадать с CSS
    ctx.font = `${fontSize}px "Noto Sans Khmer", serif`;
    ctx.textBaseline = 'top';

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Отступ должен совпадать с padding в CSS (20px)
      const padding = 20;

      // СЛОЙ 1: Белый текст (База)
      ctx.fillStyle = defaultColor;
      // Рисуем текст с учетом паддинга.
      // Небольшая ручная коррекция Y (+ fontSize*0.05) может понадобиться для разных браузеров,
      // чтобы Canvas текст идеально лег на DOM текст.
      ctx.fillText(word, padding, padding + (fontSize * 0.05));

      // СЛОЙ 2: Подсветка (Маска)
      zones.forEach((zone, i) => {
        const isHovered = i === hoveredIndex;
        const isClicked = i === clickedIndex;

        if (isHovered || isClicked) {
           ctx.save();

           // ВАЖНЫЙ ФИКС: Используем ТОЧНЫЕ координаты X, Y, Width, Height от браузера.
           ctx.beginPath();
           // Добавляем 1px нахлест для мягкости стыков
           ctx.rect(zone.x - 0.5, zone.y - 0.5, zone.width + 1, zone.height + 1);
           ctx.clip();

           // Рисуем цветной текст в ТОЙ ЖЕ позиции
           ctx.fillStyle = zone.color;
           ctx.fillText(word, padding, padding + (fontSize * 0.05));

           // Свечение
           ctx.shadowColor = zone.color;
           ctx.shadowBlur = 15;
           ctx.fillText(word, padding, padding + (fontSize * 0.05));

           ctx.restore();
        }
      });
    };

    draw();

  }, [word, zones, containerSize, fontSize, hoveredIndex, clickedIndex, defaultColor]);

  // 3. ОБРАБОТКА МЫШИ (По точным зонам)
  const handleMouseMove = (e) => {
    if (!zones.length) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Проверяем попадание в точный прямоугольник буквы
    const index = zones.findIndex(z =>
       x >= z.x && x <= z.x + z.width &&
       y >= z.y && y <= z.y + z.height
    );

    setHoveredIndex(index !== -1 ? index : null);
    canvasRef.current.style.cursor = index !== -1 ? 'pointer' : 'default';
  };

  const handleClick = () => {
    if (hoveredIndex !== null) {
      setClickedIndex(hoveredIndex);
      onPartClick(zones[hoveredIndex].char, hoveredIndex);
      setTimeout(() => setClickedIndex(null), 200);
    }
  };

  return (
    <div className="relative inline-block">
      {/* НЕВИДИМЫЙ ЭТАЛОН */}
      <div
        ref={measureRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none whitespace-nowrap font-khmer"
        style={{
            fontSize: `${fontSize}px`,
            padding: '20px',
            lineHeight: '1.5' // Важно фиксировать line-height
        }}
      >
        {word}
      </div>

      {/* ВИДИМЫЙ CANVAS */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={handleClick}
        className="touch-none select-none transition-transform active:scale-95 block"
      />
    </div>
  );
}