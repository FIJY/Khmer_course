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

  // 1. ИЗМЕРЕНИЕ (Спрашиваем у браузера: "Где буквы?")
  useEffect(() => {
    if (!measureRef.current) return;

    // Даем браузеру 50мс на отрисовку шрифта, потом измеряем
    const timer = setTimeout(() => {
        const container = measureRef.current;
        const textNode = container.firstChild;

        if (!textNode) return;

        const range = document.createRange();
        const newZones = [];
        let currentIndex = 0;
        const containerRect = container.getBoundingClientRect();

        parts.forEach((part, index) => {
            const len = part.length;
            try {
                // Выделяем конкретный кусок текста
                range.setStart(textNode, currentIndex);
                range.setEnd(textNode, currentIndex + len);

                // Получаем его реальные координаты на экране
                const rects = range.getClientRects();

                // Если буква сложная (состоит из 2 частей), берем их общий бокс
                if (rects.length > 0) {
                    // Объединяем все прямоугольники части (для сложных лигатур)
                    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

                    for (let i = 0; i < rects.length; i++) {
                        const r = rects[i];
                        if (r.left < minX) minX = r.left;
                        if (r.top < minY) minY = r.top;
                        if (r.right > maxX) maxX = r.right;
                        if (r.bottom > maxY) maxY = r.bottom;
                    }

                    // Сохраняем координаты относительно контейнера
                    newZones.push({
                        x: minX - containerRect.left,
                        y: minY - containerRect.top,
                        width: maxX - minX,
                        height: maxY - minY,
                        char: part,
                        index: index,
                        color: getCharColor(part)
                    });
                }
            } catch (e) {
                console.warn("Measurement fail:", part);
            }
            currentIndex += len;
        });

        setZones(newZones);
    }, 100);

    return () => clearTimeout(timer);
  }, [word, parts, fontSize]);

  // 2. ОТРИСОВКА (Используем координаты от браузера)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || zones.length === 0) return;
    const ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;
    // Размеры берем строго по размеру невидимого контейнера
    const width = measureRef.current.offsetWidth;
    const height = measureRef.current.offsetHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    // Важно: настройки шрифта должны совпадать с CSS на 100%
    ctx.font = `${fontSize}px "Noto Sans Khmer", serif`;
    ctx.textBaseline = 'top'; // Рисуем от верха, как DOM

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Рисуем базовый белый текст
      // Нам нужно найти смещение, так как DOM и Canvas рендерят чуть по-разному вертикально
      // Хитрость: мы рисуем слово в Canvas, используя координату Y первой найденной зоны
      // Обычно первая зона (К) начинается почти с Y=0 или небольшим отступом.

      // Чтобы не гадать, мы просто нарисуем текст в координатах (0, 0 + padding)
      // В CSS padding 20px.
      const padding = 20;

      // СЛОЙ 1: Белый
      ctx.fillStyle = defaultColor;
      // Корректируем Y вручную, так как textBaseline top не идеален для кхмерского
      // Но zones.y уже содержит padding.
      // Самый надежный способ: рисовать текст там же, где он в DOM.
      ctx.fillText(word, padding, padding);

      // СЛОЙ 2: Подсветка
      zones.forEach((zone, i) => {
        const isHovered = i === hoveredIndex;
        const isClicked = i === clickedIndex;

        if (isHovered || isClicked) {
           ctx.save();

           // Вырезаем маску по координатам, которые дал браузер
           ctx.beginPath();
           // Чуть расширяем (1px), чтобы перекрыть швы
           ctx.rect(zone.x, 0, zone.width + 1, height);
           ctx.clip();

           // Рисуем цветной текст поверх
           ctx.fillStyle = zone.color;
           ctx.fillText(word, padding, padding);

           // Свечение
           ctx.shadowColor = zone.color;
           ctx.shadowBlur = 15;
           ctx.fillText(word, padding, padding);

           ctx.restore();
        }
      });
    };

    draw();

  }, [word, zones, fontSize, hoveredIndex, clickedIndex, defaultColor]);

  // 3. ОБРАБОТКА МЫШИ (По зонам от браузера)
  const handleMouseMove = (e) => {
    if (!zones.length) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Проверяем, попала ли мышь в прямоугольник буквы
    const index = zones.findIndex(z =>
       x >= z.x && x <= z.x + z.width
       // Y проверку можно отключить, если хотим кликать по всей высоте,
       // или оставить для точности. Для удобства лучше брать всю высоту.
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
      {/* НЕВИДИМЫЙ ТЕКСТ (ЭТАЛОН) */}
      <div
        ref={measureRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none whitespace-nowrap"
        style={{
            fontFamily: '"Noto Sans Khmer", serif',
            fontSize: `${fontSize}px`,
            padding: '20px', // Отступ, чтобы высокие буквы не резались
            lineHeight: '1.5' // Фиксируем высоту строки
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