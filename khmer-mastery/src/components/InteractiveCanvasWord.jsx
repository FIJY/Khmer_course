import React, { useRef, useEffect, useState } from 'react';

export default function InteractiveCanvasWord({
  word,
  parts, // ["ក", "ា", "ហ្វ", "េ"]
  onPartClick,
  fontSize = 100,
  color = 'white',
  highlightColor = '#34d399' // Emerald-400
}) {
  const canvasRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [clickedIndex, setClickedIndex] = useState(null); // Чтобы подсветить клик
  const [clickZones, setClickZones] = useState([]);

  // Отрисовка и расчет зон
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Настраиваем шрифт
    // Важно: используем тот же шрифт, что и на сайте, чтобы метрики совпали
    ctx.font = `${fontSize}px "Noto Sans Khmer", serif`;

    // 1. Рассчитываем зоны клика для каждой части
    let currentX = 0;
    const zones = [];

    // Чтобы узнать ширину части внутри слова, мы измеряем "Слово до" и "Слово после"
    // Пример: ширина("ា") = ширина("កា") - ширина("ក")
    let accumulatedString = "";

    parts.forEach((part, index) => {
      const prevWidth = ctx.measureText(accumulatedString).width;
      accumulatedString += part;
      const currentWidth = ctx.measureText(accumulatedString).width;

      const partWidth = currentWidth - prevWidth;

      zones.push({
        char: part,
        x: prevWidth,
        width: partWidth,
        index: index
      });

      currentX = currentWidth;
    });

    setClickZones(zones);

    // 2. Настраиваем размеры Canvas (с учетом Retina экранов)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = currentX * dpr;
    canvas.height = (fontSize * 1.5) * dpr;

    canvas.style.width = `${currentX}px`;
    canvas.style.height = `${fontSize * 1.5}px`;

    ctx.scale(dpr, dpr);
    ctx.font = `${fontSize}px "Noto Sans Khmer", serif`;
    ctx.textBaseline = 'middle';

    // 3. Функция рисования
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Рисуем слово целиком (Базовый слой) - ИДЕАЛЬНЫЙ ВИЗУАЛ
      ctx.fillStyle = color;
      ctx.fillText(word, 0, fontSize * 0.8);

      // Рисуем подсветку (поверх)
      zones.forEach((zone, i) => {
        const isHovered = i === hoveredIndex;
        const isClicked = i === clickedIndex;

        if (isHovered || isClicked) {
          // Трюк: Чтобы подсветить только часть, мы используем compositing
          // Но для простоты в Canvas можно просто перерисовать эту часть другим цветом
          // ВНИМАНИЕ: Простая перерисовка части может сломать лигатуры на стыках.
          // Но для подсветки "при наведении" это обычно приемлемо.

          ctx.fillStyle = isClicked ? '#ef4444' : highlightColor; // Красный при клике (если ошибка) или зеленый
          if (isClicked && word.includes(zone.char)) ctx.fillStyle = highlightColor; // Если это правильная буква - зеленый

          // Рисуем только эту часть в нужном месте
          ctx.fillText(zone.char, zone.x, fontSize * 0.8);
        }
      });
    };

    draw();

  }, [word, parts, fontSize, hoveredIndex, clickedIndex, color, highlightColor]);

  // Обработчики мыши
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Ищем, в какую зону попали
    // Добавляем небольшой запас (padding) для узких букв (как диакритика)
    const hitIndex = clickZones.findIndex(z => {
      // Расширяем зону клика для очень узких символов (как 'ា')
      const effectiveWidth = Math.max(z.width, 15);
      return x >= z.x && x <= (z.x + effectiveWidth);
    });

    setHoveredIndex(hitIndex !== -1 ? hitIndex : null);
    canvasRef.current.style.cursor = hitIndex !== -1 ? 'pointer' : 'default';
  };

  const handleClick = () => {
    if (hoveredIndex !== null) {
      const zone = clickZones[hoveredIndex];
      // Визуальный отклик
      setClickedIndex(hoveredIndex);
      // Возвращаем результат
      onPartClick(zone.char, hoveredIndex);

      // Сброс визуального клика через 200мс
      setTimeout(() => setClickedIndex(null), 200);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={() => setHoveredIndex(null)}
      className="touch-none select-none transition-transform duration-200 active:scale-95" // touch-none для мобилок
    />
  );
}