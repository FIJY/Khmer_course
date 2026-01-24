import React, { useEffect, useRef, useState } from 'react';
import CanvasKitInit from 'canvaskit-wasm';

const WASM_URL = '/canvaskit.wasm';
const FONT_URL = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function InteractiveSkiaWord({
  word = "កាហ្វេ",
  fontSize = 150
}) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState('Loading engine...');

  // Храним объекты Skia, чтобы они жили между рендерами
  const skiaRef = useRef({
    CK: null,
    fontMgr: null,
    typeface: null,
    fontProvider: null,
    paragraph: null // Храним готовый параграф, чтобы не пересобирать каждый кадр
  });

  const [hoveredIndex, setHoveredIndex] = useState(null);

  // 1. ИНИЦИАЛИЗАЦИЯ (Один раз)
  useEffect(() => {
    async function init() {
      try {
        // А. Загружаем WASM
        const CK = await CanvasKitInit({ locateFile: () => WASM_URL });

        // Б. Загружаем Шрифт (ArrayBuffer)
        const fontBuffer = await fetch(FONT_URL).then(r => r.arrayBuffer());

        // В. Создаем Typeface (Шрифт)
        const typeface = CK.Typeface.MakeFreeTypeFaceFromData(fontBuffer);
        if (!typeface) {
            console.error("Не удалось создать Typeface из данных!");
            return;
        }

        // Г. Создаем Провайдер Шрифтов и регистрируем наш шрифт
        // Это ключевой момент: мы говорим Skia "Вот шрифт Noto Sans Khmer"
        const fontProvider = CK.TypefaceFontProvider.Make();
        fontProvider.registerFont(fontBuffer, 'Noto Sans Khmer');

        skiaRef.current = { CK, typeface, fontProvider };
        setStatus(''); // Готово

        // Запускаем отрисовку
        requestAnimationFrame(drawFrame);

      } catch (e) {
        console.error("Skia crash:", e);
        setStatus('Error loading Skia');
      }
    }
    init();

    // Очистка памяти при уходе со страницы
    return () => {
        const { fontProvider, typeface, paragraph } = skiaRef.current;
        if (paragraph) paragraph.delete();
        if (fontProvider) fontProvider.delete();
        if (typeface) typeface.delete();
    };
  }, []);

  // 2. ОТРИСОВКА И ЛОГИКА
  const drawFrame = () => {
    if (!canvasRef.current || !skiaRef.current.CK) return;
    const { CK, fontProvider } = skiaRef.current;

    const canvasEl = canvasRef.current;
    const surface = CK.MakeCanvasSurface(canvasEl);
    if (!surface) return;

    const canvas = surface.getCanvas();
    canvas.clear(CK.Color.Black); // Черный фон

    // --- СТРОИМ PARAGRAPH (Шейпинг) ---
    // Если параграф уже есть и слово не менялось, можно не пересоздавать.
    // Но для надежности создадим заново (это быстро).

    const paraStyle = new CK.ParagraphStyle({
      textStyle: {
        color: CK.Color.White,
        fontSize: fontSize,
        fontFamilies: ['Noto Sans Khmer'], // Имя, под которым мы зарегистрировали шрифт
      },
    });

    // Важно: передаем fontProvider, чтобы билдер нашел наш шрифт
    const builder = CK.ParagraphBuilder.Make(paraStyle, fontProvider);
    builder.addText(word);
    const paragraph = builder.build();

    // Layout (Раскладка) - вычисляем позиции
    paragraph.layout(canvasEl.width); // Ширина контейнера

    // Центрирование
    const textWidth = paragraph.getMaxWidth(); // Реальная ширина текста
    const textHeight = paragraph.getHeight();
    const startX = (canvasEl.width - textWidth) / 2;
    const startY = (canvasEl.height - textHeight) / 2;

    // --- РИСУЕМ ПОДСВЕТКУ (Если есть hover) ---
    // Мы не храним hover в ref для draw, мы берем его из замыкания или ref.
    // Для анимации лучше использовать ref, но пока возьмем из переменной.
    // (В реальном коде лучше передавать mouseX/Y в draw).

    // --- РИСУЕМ ТЕКСТ ---
    canvas.drawParagraph(paragraph, startX, startY);

    // Сохраняем параграф и координаты для хит-теста
    skiaRef.current.paragraph = paragraph;
    skiaRef.current.layout = { startX, startY };

    surface.flush();

    // Мы не удаляем paragraph здесь, он нужен для хит-теста!
    // surface.dispose(); // Можно не вызывать каждый кадр, если канвас один
  };

  // 3. ХИТ-ТЕСТ (По наведению)
  const handleMouseMove = (e) => {
    const { CK, paragraph, layout } = skiaRef.current;
    if (!CK || !paragraph || !layout) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - layout.startX; // Корректируем на отступ текста
    const y = e.clientY - rect.top - layout.startY;

    // Ищем, в какую букву попали
    // Paragraph API дает нам getRectsForRange.
    // Мы можем пройтись по слову и проверить каждую букву.

    let foundIndex = null;
    let foundRects = [];

    // Просто перебираем символы
    // (Для кхмерского это упрощение, так как один глиф может быть из нескольких char,
    // но RectsForRange вернет правильную коробку для кластера).
    for (let i = 0; i < word.length; i++) {
        // Получаем боксы для i-го символа
        const rects = paragraph.getRectsForRange(i, i + 1, CK.RectHeightStyle.Tight, CK.WidthStyle.Tight);

        for (let r of rects) {
            // rects возвращает Float32Array [left, top, right, bottom]
            if (x >= r.rect[0] && x <= r.rect[2] && y >= r.rect[1] && y <= r.rect[3]) {
                foundIndex = i;
                foundRects = rects; // Запоминаем для отрисовки подсветки
                break;
            }
        }
        if (foundIndex !== null) break;
    }

    if (foundIndex !== hoveredIndex) {
        setHoveredIndex(foundIndex);
        // Перерисовываем с подсветкой
        requestAnimationFrame(() => drawHighlight(foundIndex, foundRects));
    }
  };

  // Отдельная функция для отрисовки с подсветкой (чтобы не дублировать логику)
  const drawHighlight = (index, rects) => {
      const { CK, paragraph, layout } = skiaRef.current;
      const canvasEl = canvasRef.current;
      const surface = CK.MakeCanvasSurface(canvasEl);
      const canvas = surface.getCanvas();

      canvas.clear(CK.Color.Black);

      // 1. Рисуем подсветку (если есть)
      if (index !== null && rects) {
          const paint = new CK.Paint();
          paint.setColor(CK.Color.make(0, 255, 255, 0.4)); // Cyan 40%

          for (let r of rects) {
              // Смещаем rect на позицию текста
              const R = CK.LTRBRect(
                  r.rect[0] + layout.startX,
                  r.rect[1] + layout.startY,
                  r.rect[2] + layout.startX,
                  r.rect[3] + layout.startY
              );
              canvas.drawRect(R, paint);
          }
      }

      // 2. Рисуем текст сверху
      canvas.drawParagraph(paragraph, layout.startX, layout.startY);
      surface.flush();
  };

  return (
    <div className="flex justify-center items-center p-4 bg-gray-900 min-h-[400px]">
        {status && <div className="absolute text-white">{status}</div>}
        <canvas
            ref={canvasRef}
            width={800}
            height={400}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
                setHoveredIndex(null);
                requestAnimationFrame(() => drawHighlight(null, null));
            }}
            style={{ cursor: 'pointer' }}
        />
    </div>
  );
}