import React, { useRef, useEffect, useState } from 'react';

// Цвета для типов букв
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
  // Если строка длиннее 1 символа (например, ្ + ម) или это знак подписки
  if (char.length > 1 || code === 0x17d2) return COLORS.SUBSCRIPT;
  return COLORS.OTHER;
}

export default function InteractiveCanvasWord({
  word,
  parts,
  onPartClick,
  fontSize = 100,
  defaultColor = 'white'
}) {
  const canvasRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [clickZones, setClickZones] = useState([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Настраиваем шрифт
    const fontStr = `${fontSize}px "Noto Sans Khmer", serif`;
    ctx.font = fontStr;

    // 1. РАСЧЕТ ЗОН
    const zones = [];
    let currentX = 0;
    let accumStr = "";

    parts.forEach((part, i) => {
      const prevW = ctx.measureText(accumStr).width;
      accumStr += part;
      const currW = ctx.measureText(accumStr).width;
      const partW = currW - prevW;

      zones.push({
        char: part,
        x: prevW,
        width: partW,
        index: i,
        color: getCharColor(part)
      });
      currentX = currW;
    });
    setClickZones(zones);

    // 2. НАСТРОЙКА РАЗМЕРОВ
    const dpr = window.devicePixelRatio || 1;
    // Больше отступов, чтобы высокие буквы не резались
    const paddingX = 40;
    const width = currentX + (paddingX * 2);
    const height = fontSize * 2.2; // Увеличили высоту для подписных

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.font = fontStr;
    ctx.textBaseline = 'middle';

    // 3. ОТРИСОВКА
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      // Смещаем центр чуть ниже, так как кхмерский шрифт "высокий"
      const y = height / 2 + (fontSize * 0.15);
      const startX = paddingX;

      // СЛОЙ 1: Белый текст (Основа)
      ctx.fillStyle = defaultColor;
      ctx.fillText(word, startX, y);

      // СЛОЙ 2: Цветные части
      zones.forEach((zone, i) => {
        const isHovered = i === hoveredIndex;
        const isClicked = i === clickedIndex;

        if (isHovered || isClicked) {
           ctx.save();

           // МАГИЯ НАХЛЕСТА (Overlap)
           // Мы расширяем зону обрезки (Clip) на 2px влево и вправо,
           // чтобы захватить стыки букв и не оставлять белых щелей.
           const overlap = 2;

           ctx.beginPath();
           ctx.rect(
             startX + zone.x - overlap,
             0,
             zone.width + (overlap * 2),
             height
           );
           ctx.clip();

           // Рисуем слово ЦВЕТОМ
           ctx.fillStyle = zone.color;
           ctx.fillText(word, startX, y);

           // Свечение
           ctx.shadowColor = zone.color;
           ctx.shadowBlur = 25;
           ctx.fillText(word, startX, y);

           ctx.restore();
        }
      });
    };

    draw();

  }, [word, parts, fontSize, hoveredIndex, clickedIndex, defaultColor]);

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const paddingX = 40;
    // Корректируем X с учетом масштаба Canvas (если он сжат CSS)
    const scaleX = canvasRef.current.width / (canvasRef.current.clientWidth * (window.devicePixelRatio || 1));
    const x = (e.clientX - rect.left) * scaleX - paddingX;

    // Ищем зону с небольшим допуском
    const index = clickZones.findIndex(z => x >= z.x && x <= z.x + z.width);
    setHoveredIndex(index !== -1 ? index : null);
    canvasRef.current.style.cursor = index !== -1 ? 'pointer' : 'default';
  };

  const handleClick = () => {
    if (hoveredIndex !== null) {
      setClickedIndex(hoveredIndex);
      onPartClick(clickZones[hoveredIndex].char, hoveredIndex);
      setTimeout(() => setClickedIndex(null), 300);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={() => setHoveredIndex(null)}
      className="touch-none select-none transition-transform active:scale-95 max-w-full h-auto"
    />
  );
}