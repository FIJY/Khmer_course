import React, { useEffect, useRef, useState } from 'react';
import CanvasKitInit from 'canvaskit-wasm';

const FONT_URL = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';
const WASM_URL = '/canvaskit.wasm'; // Мы положили его в public

export default function InteractiveSkiaWord({
  word = "កាហ្វេ",
  fontSize = 150
}) {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Храним инстансы CanvasKit, чтобы не пересоздавать
  const ckInstance = useRef(null);
  const fontMgr = useRef(null);
  const typeface = useRef(null);

  // Состояние наведения
  const hoveredGlyph = useRef(null); // { index, path, x, y }

  useEffect(() => {
    async function init() {
      // 1. Инициализация CanvasKit
      const CanvasKit = await CanvasKitInit({
        locateFile: () => WASM_URL,
      });

      // 2. Загрузка шрифта
      const fontData = await fetch(FONT_URL).then((r) => r.arrayBuffer());

      ckInstance.current = CanvasKit;
      fontMgr.current = CanvasKit.FontMgr.FromData(fontData);
      typeface.current = fontMgr.current.MakeTypefaceFromData(fontData);

      setLoading(false);

      // Запускаем цикл отрисовки
      requestAnimationFrame(() => draw(CanvasKit));
    }

    init();
  }, []);

  // Хендлер движения мыши
  const handleMouseMove = (e) => {
    if (!canvasRef.current || !ckInstance.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Передаем координаты в функцию отрисовки для хит-теста
    // (В реальном проекте хит-тест лучше вынести из draw, но для демо ок)
    draw(ckInstance.current, x, y);
  };

  const draw = (CK, mouseX = -1, mouseY = -1) => {
    if (!canvasRef.current) return;
    const canvasEl = canvasRef.current;

    // Настраиваем поверхность (Surface)
    // В продакшене Surface лучше создать один раз, здесь упрощаем
    const surface = CK.MakeCanvasSurface(canvasEl);
    if (!surface) return;

    const canvas = surface.getCanvas();
    canvas.clear(CK.Color.Black); // Черный фон

    // --- 3. SHAPING (ParagraphBuilder) ---
    const paraStyle = new CK.ParagraphStyle({
      textStyle: {
        color: CK.Color.White,
        fontSize: fontSize,
        fontFamilies: ['Noto Sans Khmer'],
      },
    });

    const builder = CK.ParagraphBuilder.Make(paraStyle, fontMgr.current);
    builder.addText(word);
    const paragraph = builder.build();

    // Раскладка (Layout)
    paragraph.layout(canvasEl.width); // Ширина контейнера

    // Центрируем текст
    const textWidth = paragraph.getMaxWidth();
    const textHeight = paragraph.getHeight();
    const startX = (canvasEl.width - textWidth) / 2; // Примитивное центрирование (для примера)
    const startY = (canvasEl.height - textHeight) / 2;

    // --- 4. РИСУЕМ БАЗОВЫЙ ТЕКСТ ---
    canvas.drawParagraph(paragraph, startX, startY);

    // --- 5. ХИТ-ТЕСТИНГ (GLYPH PATHS) ---
    // Нам нужно "достать" внутренности параграфа
    // CanvasKit в JS не дает getGlyphRuns() так просто, как Flutter.
    // Но мы можем использовать `paragraph.getRectsForRange` или перебрать LineMetrics.

    // ОДНАКО, самый надежный способ в CanvasKit JS для точных путей -
    // использовать Font.getGlyphIDs и Font.getPositions, если Paragraph скрывает детали.
    // Но Paragraph делает шейпинг...

    // В этой версии CanvasKit JS, самый рабочий метод "достать контуры" из Paragraph
    // требует хака или использования TextBlob напрямую (как мы обсуждали про Skia).
    // Давай используем TextBlob для получения путей, так как Paragraph инкапсулирован.

    // ШАГ 3 (АЛЬТЕРНАТИВНЫЙ): Шейпинг через Font.getGlyphIDs (проще достать пути)
    const font = new CK.Font(typeface.current, fontSize);
    const glyphIds = font.getGlyphIDs(word); // Шейпинг на уровне глифов
    // Внимание: базовый getGlyphIDs может не дать идеальный кернинг для кхмерского
    // так хорошо, как Paragraph, но для hit-test путей это база.
    // Для идеального шейпинга нужен SkShaper, но его нет в минимальной сборке.
    // Будем использовать позиции, которые дает шрифт.

    // Получаем позиции
    // getGlyphWidths не дает X/Y смещения.
    // Используем `font.getGlyphIntercepts` или просто рисуем TextBlob и ищем пути.

    const blob = CK.TextBlob.MakeFromText(word, font);
    // К сожалению, JS API CanvasKit TextBlob не дает итерироваться по глифам (C++ opaque object).

    // ВОЗВРАЩАЕМСЯ К ПЛАНУ A:
    // Единственный способ получить Path для хит-теста в JS CanvasKit -
    // это `font.getPath(glyphID)`. Нам нужно знать ID и позицию.

    // Получаем ID глифов и их ширины
    const ids = font.getGlyphIDs(word);
    const widths = font.getGlyphWidths(ids);

    let currentX = 20; // Отступ
    const baseline = 200; // Y позиция

    // Рисуем текст через TextBlob для визуализации (он отшейплен)
    // canvas.drawTextBlob(blob, 20, 200, paint); <--- Так рисуем текст

    // А теперь ПОВЕРХ считаем хит-тест
    let hitFound = false;

    for (let i = 0; i < ids.length; i++) {
        const glyphId = ids[i];
        const w = widths[i];

        // Получаем путь глифа
        const path = font.getPath(glyphId, currentX, baseline, fontSize);
        // path возвращается уже смещенным или в 0,0?
        // Обычно path в 0,0, но `font.getPath` может принимать координаты?
        // Нет, в JS API: font.getPath(glyphID, paint?).
        // Нужно делать path.transform.

        const rawPath = font.getPath(glyphId);
        // Смещаем путь в позицию буквы
        // ВНИМАНИЕ: Простая сумма ширин (currentX) - это упрощение.
        // Для кхмерского реальные позиции сложнее.
        // Но пока Paragraph API закрыт в JS, это лучший доступный метод.
        rawPath.transform([1, 0, currentX, 0, 1, baseline, 0, 0, 1]);

        // Хит-тест
        if (mouseX >= 0 && rawPath.contains(mouseX, mouseY)) {
            // РИСУЕМ ПОДСВЕТКУ (Outline)
            const paint = new CK.Paint();
            paint.setColor(CK.Color.Cyan);
            paint.setStyle(CK.Stroke);
            paint.setStrokeWidth(5);
            canvas.drawPath(rawPath, paint);

            // Заливка (опционально)
            const fillPaint = new CK.Paint();
            fillPaint.setColor(CK.Color.make(0, 255, 255, 0.3));
            canvas.drawPath(rawPath, fillPaint);

            hitFound = true;
        }

        currentX += w;
    }

    surface.flush();
    surface.dispose(); // Очистка (важно для WASM памяти, хотя для одного canvas можно переиспользовать)
    // В реальном коде surface создается 1 раз в useEffect, а flush делается в цикле.
  };

  return (
    <div className="flex justify-center items-center p-10 bg-black min-h-[500px]">
        {loading && <div className="text-white">Loading CanvasKit...</div>}
        <canvas
            ref={canvasRef}
            width={800}
            height={400}
            onMouseMove={handleMouseMove}
            style={{ border: '1px solid #333', cursor: 'crosshair' }}
        />
    </div>
  );
}