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

export default function InteractivePixelWord({
  word,
  parts,
  onPartClick,
  fontSize = 120
}) {
  const canvasRef = useRef(null);
  const measureRef = useRef(null);

  // Храним "слои" для каждой буквы (offscreen canvases)
  const layersRef = useRef([]);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);

  // 1. ИНИЦИАЛИЗАЦИЯ И НАРЕЗКА СЛОВА
  useEffect(() => {
    if (!measureRef.current) return;

    // Ждем рендеринга шрифта в DOM
    const timer = setTimeout(() => {
        const container = measureRef.current;
        const textNode = container.firstChild;
        if (!textNode) return;

        const width = container.offsetWidth;
        const height = container.offsetHeight;
        setContainerSize({ width, height });

        const dpr = window.devicePixelRatio || 1;
        const range = document.createRange();

        // Создаем массив слоев (по одному на каждую часть слова)
        const newLayers = [];
        let currentIndex = 0;

        parts.forEach((part, index) => {
            const len = part.length;

            // А. Получаем прямоугольную зону буквы от браузера
            range.setStart(textNode, currentIndex);
            range.setEnd(textNode, currentIndex + len);
            const rects = range.getClientRects();
            const cRect = container.getBoundingClientRect();

            if (rects.length > 0) {
                // Объединяем rects в один общий box
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                for (let r of rects) {
                    minX = Math.min(minX, r.left);
                    minY = Math.min(minY, r.top);
                    maxX = Math.max(maxX, r.right);
                    maxY = Math.max(maxY, r.bottom);
                }

                // Корректируем относительно контейнера
                const x = minX - cRect.left;
                const y = minY - cRect.top;
                const w = maxX - minX;
                const h = maxY - minY;

                // Б. Создаем мини-холст для этой буквы
                const layerCanvas = document.createElement('canvas');
                layerCanvas.width = width * dpr;
                layerCanvas.height = height * dpr;
                const ctx = layerCanvas.getContext('2d', { willReadFrequently: true });
                ctx.scale(dpr, dpr);

                // В. МАГИЯ МАСКИ (Pixel Perfect)

                // Шаг 1: Рисуем цветной прямоугольник только там, где должна быть буква
                ctx.fillStyle = getCharColor(part);
                // Добавляем микро-нахлест (1px), чтобы закрыть щели
                ctx.fillRect(x - 0.5, 0, w + 1, height);

                // Шаг 2: Включаем режим "Оставить только пересечение"
                ctx.globalCompositeOperation = 'destination-in';

                // Шаг 3: Рисуем всё слово поверх.
                // Результат: Цветной прямоугольник обрезается по форме слова!
                ctx.font = `${fontSize}px "Noto Sans Khmer", serif`;
                ctx.textBaseline = 'top';
                ctx.fillStyle = '#000'; // Цвет не важен для маски
                ctx.fillText(word, 20, 20); // 20px - это padding из CSS

                // Сохраняем слой
                newLayers.push({
                    canvas: layerCanvas,
                    char: part,
                    index: index,
                    color: getCharColor(part)
                });
            }
            currentIndex += len;
        });

        layersRef.current = newLayers;
        setIsReady(true);

    }, 200); // Даем шрифту прогрузиться

    return () => clearTimeout(timer);
  }, [word, parts, fontSize]);

  // 2. ОТРИСОВКА ОСНОВНОГО CANVAS
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isReady) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = containerSize.width * dpr;
    canvas.height = containerSize.height * dpr;
    canvas.style.width = `${containerSize.width}px`;
    canvas.style.height = `${containerSize.height}px`;
    ctx.scale(dpr, dpr);

    const draw = () => {
        ctx.clearRect(0, 0, containerSize.width, containerSize.height);

        // СЛОЙ 1: Белое слово (База)
        ctx.font = `${fontSize}px "Noto Sans Khmer", serif`;
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'white';
        ctx.fillText(word, 20, 20); // padding 20

        // СЛОЙ 2: Подсветка (Рисуем подготовленные слои)
        if (hoveredIndex !== null) {
            const layer = layersRef.current.find(l => l.index === hoveredIndex);
            if (layer) {
                ctx.save();
                // Сбрасываем трансформацию, так как слой уже в масштабе DPR
                ctx.setTransform(1, 0, 0, 1, 0, 0);

                // Рисуем слой (это уже вырезанная по форме буква!)
                ctx.drawImage(layer.canvas, 0, 0);

                // Добавляем свечение (Shadow)
                // Трюк: рисуем слой еще раз со смещением тени
                ctx.shadowColor = layer.color;
                ctx.shadowBlur = 20;
                ctx.globalCompositeOperation = 'screen'; // Для красивого свечения
                ctx.drawImage(layer.canvas, 0, 0);

                ctx.restore();
            }
        }
    };

    draw();
  }, [isReady, hoveredIndex, containerSize, fontSize, word]);

  // 3. ХИТ-ДЕТЕКЦИЯ (По пикселям)
  const handleMouseMove = (e) => {
    if (!isReady) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Координаты мыши внутри Canvas (в пикселях устройства)
    const x = (e.clientX - rect.left) * dpr;
    const y = (e.clientY - rect.top) * dpr;

    // Проверяем, попали ли мы в "чернила" какого-либо слоя
    // Мы идем по слоям и проверяем pixel alpha
    let hitIndex = null;

    // Оптимизация: Сначала проверяем грубые rects (если бы сохранили),
    // но для точности лучше проверить пиксели в подготовленных слоях.

    // Для скорости: можно проверять только слой, который был hovered,
    // а если нет - искать новый. Но тут всего 5-10 слоев, пробежимся.

    for (const layer of layersRef.current) {
        const ctx = layer.canvas.getContext('2d');
        // Берем 1 пиксель под курсором
        const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
        // pixel[3] - это Alpha канал
        if (pixel[3] > 0) {
            hitIndex = layer.index;
            break; // Нашли верхний слой (если перекрываются)
        }
    }

    setHoveredIndex(hitIndex);
    canvasRef.current.style.cursor = hitIndex !== null ? 'pointer' : 'default';
  };

  return (
    <div className="relative inline-block">
      {/* ЭТАЛОН (Невидимый) */}
      <div
        ref={measureRef}
        className="absolute top-0 left-0 opacity-0 pointer-events-none whitespace-nowrap"
        style={{
            fontFamily: '"Noto Sans Khmer", serif',
            fontSize: `${fontSize}px`,
            lineHeight: '1.5',
            padding: '20px' // Отступ
        }}
      >
        {word}
      </div>

      {/* ИНТЕРАКТИВНЫЙ ХОЛСТ */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
        onClick={() => hoveredIndex !== null && onPartClick(parts[hoveredIndex], hoveredIndex)}
        className="touch-none select-none transition-transform active:scale-95 block"
      />
    </div>
  );
}