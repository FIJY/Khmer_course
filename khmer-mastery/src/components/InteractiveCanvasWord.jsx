import React, { useRef, useEffect, useState } from 'react';

// Цветовая палитра (как в твоем Анализаторе)
const COLORS = {
  CONSONANT: '#ffb020', // Оранжевый
  VOWEL: '#ff4081',     // Розовый
  SUBSCRIPT: '#6b5cff', // Синий/Индиго
  OTHER: '#34d399'      // Зеленый (дефолт)
};

// Хелпер: Определяем тип буквы для цвета
function getCharColor(char) {
  const code = char.codePointAt(0);
  // Согласные (K-A2)
  if (code >= 0x1780 && code <= 0x17a2) return COLORS.CONSONANT;
  // Независимые гласные (A3-B5)
  if (code >= 0x17a3 && code <= 0x17b5) return COLORS.VOWEL;
  // Зависимые гласные (B6-C5)
  if (code >= 0x17b6 && code <= 0x17c5) return COLORS.VOWEL;
  // Подписные (обычно начинаются с 17D2, но мы проверяем проще)
  // В разбивке подписная часто идет как "្" + буква.
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

    // 1. РАСЧЕТ ЗОН (Слайсы)
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
        color: getCharColor(part) // Вычисляем цвет сразу
      });
      currentX = currW;
    });
    setClickZones(zones);

    // 2. НАСТРОЙКА CANVAS
    const dpr = window.devicePixelRatio || 1;
    // Добавляем padding по краям, чтобы широкие буквы не резались
    const paddingX = 20;
    const width = currentX + (paddingX * 2);
    const height = fontSize * 1.8;

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
      const y = height / 2 + (fontSize * 0.1);
      const startX = paddingX;

      // СЛОЙ А: Базовый текст (Белый)
      // Рисуем всё слово целиком. Это база.
      ctx.fillStyle = defaultColor;
      ctx.fillText(word, startX, y);

      // СЛОЙ Б: Подсветка частей
      // Мы проходимся по зонам. Если мышь на зоне - рисуем её цветной.
      zones.forEach((zone, i) => {
        const isHovered = i === hoveredIndex;
        const isClicked = i === clickedIndex;

        if (isHovered || isClicked) {
           ctx.save();

           // Магия: Создаем "окно" (clip) только для этой буквы
           ctx.beginPath();
           // Расширяем зону на 1px, чтобы перекрыть стыки
           ctx.rect(startX + zone.x - 0.5, 0, zone.width + 1, height);
           ctx.clip();

           // Рисуем ВСЁ слово нужным цветом.
           // Из-за clip мы увидим только нужный кусочек.
           ctx.fillStyle = zone.color;
           ctx.fillText(word, startX, y);

           // Добавляем свечение того же цвета
           ctx.shadowColor = zone.color;
           ctx.shadowBlur = 20;
           ctx.fillText(word, startX, y);

           ctx.restore();
        }
      });
    };

    draw();

  }, [word, parts, fontSize, hoveredIndex, clickedIndex, defaultColor]);

  // ОБРАБОТЧИКИ
  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const paddingX = 20; // Тот же padding, что при рисовании
    const x = e.clientX - rect.left - paddingX;

    // Ищем зону
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
      className="touch-none select-none transition-transform active:scale-95"
    />
  );
}