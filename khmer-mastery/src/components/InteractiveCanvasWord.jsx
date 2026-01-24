import React, { useRef, useEffect, useState } from 'react';

// Цветовая палитра
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
  const measureRef = useRef(null); // Ссылка на невидимый текст для замеров
  const [zones, setZones] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [clickedIndex, setClickedIndex] = useState(null);

  // 1. ИЗМЕРЕНИЕ (DOM Range API)
  useEffect(() => {
    if (!measureRef.current) return;

    // Ждем чуть-чуть, чтобы шрифт точно применился к DOM
    const timer = setTimeout(() => {
        const textNode = measureRef.current.firstChild;
        if (!textNode) return;

        const range = document.createRange();
        const newZones = [];
        let currentIndex = 0;

        // Проходимся по частям и измеряем их реальное положение
        parts.forEach((part, partIndex) => {
            const partLength = part.length;

            try {
                // Выделяем конкретные символы в тексте
                range.setStart(textNode, currentIndex);
                range.setEnd(textNode, currentIndex + partLength);

                // Получаем координаты прямоугольника
                const rects = range.getClientRects();

                // Берем первый прямоугольник (обычно буква одна)
                if (rects.length > 0) {
                    const rect = rects[0];
                    // Корректируем относительно контейнера
                    const containerRect = measureRef.current.getBoundingClientRect();

                    newZones.push({
                        x: rect.left - containerRect.left,
                        y: rect.top - containerRect.top,
                        width: rect.width,
                        height: rect.height,
                        char: part,
                        index: partIndex,
                        color: getCharColor(part)
                    });
                }
            } catch (e) {
                console.warn("Measurement failed for", part);
            }
            currentIndex += partLength;
        });

        setZones(newZones);
    }, 100); // Небольшая задержка для надежности рендеринга шрифта

    return () => clearTimeout(timer);
  }, [word, parts, fontSize]); // Пересчитываем при смене слова

  // 2. ОТРИСОВКА (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || zones.length === 0) return;
    const ctx = canvas.getContext('2d');

    // Настройки
    const dpr = window.devicePixelRatio || 1;
    // Размеры берем прямо из измеренного контейнера
    const containerWidth = measureRef.current.offsetWidth;
    const containerHeight = measureRef.current.offsetHeight;

    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;

    ctx.scale(dpr, dpr);

    // Шрифт должен ИДЕАЛЬНО совпадать с CSS
    ctx.font = `${fontSize}px "Noto Sans Khmer", serif`;
    ctx.textBaseline = 'top'; // Важно: DOM измеряет от верха, Canvas по дефолту от baseline

    const draw = () => {
      ctx.clearRect(0, 0, containerWidth, containerHeight);

      // СЛОЙ 1: Белый текст (База)
      ctx.fillStyle = defaultColor;
      // Рисуем текст с небольшим смещением, которое мы компенсировали при замерах?
      // Нет, DOM rects абсолютны внутри контейнера.
      // Но у Canvas textBaseline 'top' может чуть отличаться от line-height DOM.
      // Трюк: Мы не рисуем текст заново по координатам x/y. Мы рисуем слово ОДИН РАЗ в 0,0?
      // Нет, DOM text отцентрирован или нет?
      // Проще нарисовать текст ровно там, где он лежит в DOM.
      // Но проще: рисовать слово целиком в координатах 0,0 (если padding контейнера 0).

      // В DOM у нас display: inline-block, line-height: 1.5.
      // Canvas textBaseline: top.
      // Нужно поймать вертикальное смещение.
      // Вместо гадания, мы нарисуем текст, используя первую зону как якорь?
      // Или просто подберем offset.

      // ЧЕСТНЫЙ МЕТОД:
      // Мы используем координаты зон для КЛИПИНГА.
      // А текст рисуем один раз в позиции (0, смещение).
      // Смещение (ascent) сложно получить.

      // ХАК: Мы будем рисовать каждую букву отдельно в её зоне? НЕТ, это сломает лигатуры.

      // ДАВАЙТЕ ПОДГОНИМ:
      // В CSS line-height: 1.5 * fontSize.
      // Текст в DOM обычно центрирован вертикально в line-box или сидит на baseline.
      // Методом проб: смещение по Y обычно около (lineHeight - fontSize) / 2?
      // Или используем textBaseline = 'alphabetic' и находим baseline.

      // ПРОСТОЙ ПУТЬ ДЛЯ ОТРИСОВКИ:
      // Рисуем слово целиком.
      // x = 0 (если text-align left).
      // y = ?
      // Возьмем y первой зоны и добавим высоту буквы (~0.8 fontSize)?

      // ЧТОБЫ ИЗБЕЖАТЬ СМЕЩЕНИЯ МЕЖДУ СЛОЯМИ (Белым и Цветным):
      // Неважно, где мы нарисуем текст, главное, чтобы Белый и Цветной были в ОДНОМ месте.
      // А зоны клипинга (от DOM) должны совпасть с этим местом.

      // Решение:
      // Рисуем текст в Canvas в координатах (0, offset).
      // offset подбираем так, чтобы он визуально совпал с DOM rects.
      // offset ≈ zones[0].y + (fontSize * 0.2) // Эвристика для Khmer Noto Sans

      const yOffset = zones[0]?.y + (fontSize * 0.22); // Подгон под Noto Sans
      const xOffset = zones[0]?.x; // Обычно 0

      ctx.fillStyle = defaultColor;
      ctx.fillText(word, xOffset, yOffset);

      // СЛОЙ 2: Подсветка
      zones.forEach((zone, i) => {
        const isHovered = i === hoveredIndex;
        const isClicked = i === clickedIndex;

        if (isHovered || isClicked) {
           ctx.save();

           // Используем точные координаты от браузера
           ctx.beginPath();
           // Добавляем микро-нахлест (1px)
           ctx.rect(zone.x - 1, 0, zone.width + 2, containerHeight);
           ctx.clip();

           ctx.fillStyle = zone.color;
           ctx.fillText(word, xOffset, yOffset);

           // Свечение
           ctx.shadowColor = zone.color;
           ctx.shadowBlur = 15;
           ctx.fillText(word, xOffset, yOffset);

           ctx.restore();
        }
      });
    };

    draw();

  }, [word, zones, fontSize, hoveredIndex, clickedIndex, defaultColor]);

  // ОБРАБОТЧИКИ
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Проверяем попадание в зоны
    const index = zones.findIndex(z =>
        x >= z.x && x <= z.x + z.width &&
        y >= 0 && y <= rect.height // По Y берем всю высоту
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
      {/* 1. НЕВИДИМЫЙ DOM (Для точных измерений) */}
      <div
        ref={measureRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none whitespace-nowrap"
        style={{
            fontFamily: '"Noto Sans Khmer", serif',
            fontSize: `${fontSize}px`,
            lineHeight: '1.5', // Важно зафиксировать line-height
            padding: '20px'    // Отступы, чтобы буквы не резались
        }}
      >
        {word}
      </div>

      {/* 2. ВИДИМЫЙ CANVAS (Рисует и ловит клики) */}
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