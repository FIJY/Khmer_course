const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const fontkit = require('fontkit');     // Для расчета позиций (Shaping)
const opentype = require('opentype.js'); // Для рисования путей (Rendering)

const app = express();
app.use(cors());

const PORT = 3001;

// Путь к шрифту
const FONT_PATH = path.join(__dirname, 'public/fonts/NotoSansKhmer-Regular.ttf');
const FONT_SIZE = 120;
const COENG = 0x17d2;

// Какие гласные мы хотим отрывать "с мясом" (Force Split)
function shouldForceSplit(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  const splitList = [0x17B6, 0x17C1, 0x17C2, 0x17C3, 0x17C4, 0x17C5];
  return splitList.includes(code);
}

let fkFont = null;       // Fontkit instance
let otFont = null;       // Opentype instance
let unitsPerEm = 1000;

async function init() {
  try {
    if (!fs.existsSync(FONT_PATH)) throw new Error(`Font not found: ${FONT_PATH}`);

    // 1. Загружаем Fontkit (он синхронный, ура!)
    fkFont = fontkit.openSync(FONT_PATH);
    unitsPerEm = fkFont.unitsPerEm;

    // 2. Загружаем Opentype
    const fontBuffer = fs.readFileSync(FONT_PATH);
    otFont = opentype.parse(fontBuffer.buffer);

    console.log("✅ Glyph Server (Pure JS) ready on port " + PORT);
  } catch (e) {
    console.error("❌ Init failed:", e);
    process.exit(1);
  }
}

app.get('/api/shape', (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });

  try {
    // === ЭТАП 1: SHAPING (Расчет позиций) ===
    // Fontkit делает всю грязную работу по кхмерским правилам
    const run = fkFont.layout(text);

    const scale = FONT_SIZE / unitsPerEm;
    let cursorX = 50;
    const glyphsData = [];

    // Мы идем по результатам Fontkit, но следим за исходным текстом
    // Fontkit хранит привязку глифов к индексам строки в glyph.codePoints (примерно)
    // Но проще идти параллельно, используя логику "Force Split"

    let processedCharIndex = -1;

    for (let i = 0; i < run.glyphs.length; i++) {
      const fkGlyph = run.glyphs[i];
      const position = run.positions[i];

      // Fontkit возвращает массив codePoints для этого глифа.
      // Обычно это один символ, но для лигатур может быть несколько.
      const codePoints = fkGlyph.codePoints;

      // Попробуем найти, какой это символ в исходной строке
      // (Упрощенно: считаем, что порядок сохраняется, если это не сложная перестановка)
      // Для целей Force Split нам важнее проверить сам текст.

      // --- ЛОГИКА FORCE SPLIT ---
      // Проверяем: не является ли текущая позиция в тексте парой "Base + SplitVowel"?
      // Нам нужно найти соответствие текущего глифа символу в тексте.
      // Это сложно при перестановках.

      // ПОДХОД B: Просто используем данные Fontkit, но если глиф - это "Палка" (Aa),
      // мы убеждаемся, что она рисуется отдельно.

      // Получаем SVG путь через Opentype (он надежнее для рисования в браузере)
      const otGlyph = otFont.glyphs.get(fkGlyph.id);

      // Координаты от Fontkit
      // xAdvance - сколько отступить ПОСЛЕ рисования
      // xOffset, yOffset - смещение ДЛЯ рисования

      const x = cursorX + (position.xOffset * scale);
      const y = 200 - (position.yOffset * scale); // Y перевернут в SVG

      const path = otGlyph.getPath(x, y, FONT_SIZE);
      const d = path.toPathData(3);

      // Определяем, какой это символ для звука
      // Fontkit дает нам codePoints, берем первый, если есть
      let charCode = codePoints[0];
      let char = String.fromCharCode(charCode);

      // --- DETECTIVE (Исправление "ножек") ---
      // Если глиф похож на Coeng (или это часть сложного кластера),
      // пытаемся найти реальную букву в исходном тексте.
      // В Fontkit `codePoints` обычно уже содержат правильные коды символов, которые образовали этот глиф.
      // Если это лигатура (Kaa), там будет [Ka, Aa].

      if (codePoints.length > 1 && shouldForceSplit(String.fromCharCode(codePoints[1]))) {
         // ОПА! Fontkit склеил Ka и Aa в один глиф.
         // Нам нужно это разорвать вручную.

         const baseChar = String.fromCharCode(codePoints[0]);
         const vowelChar = String.fromCharCode(codePoints[1]);

         // 1. Рисуем Базу
         const baseOtGlyph = otFont.charToGlyph(baseChar);
         const basePath = baseOtGlyph.getPath(cursorX, 200, FONT_SIZE);
         const baseAdv = baseOtGlyph.advanceWidth * scale;

         glyphsData.push({
            id: glyphsData.length, char: baseChar,
            d: basePath.toPathData(3), bb: basePath.getBoundingBox()
         });

         // 2. Рисуем Гласную
         const vowelOtGlyph = otFont.charToGlyph(vowelChar);
         const vowelPath = vowelOtGlyph.getPath(cursorX + baseAdv, 200, FONT_SIZE);
         const vowelAdv = vowelOtGlyph.advanceWidth * scale;

         glyphsData.push({
            id: glyphsData.length, char: vowelChar,
            d: vowelPath.toPathData(3), bb: vowelPath.getBoundingBox()
         });

         cursorX += (baseAdv + vowelAdv);
         continue; // Пропускаем отрисовку "склеенного" глифа
      }

      // Если это не лигатура, просто рисуем
      if (d && d.length > 5) {
          // Если это ножка (Coeng), она часто идет как отдельный глиф в Fontkit
          // Проверим, если char - это Coeng (0x17D2), нам это не поможет для звука.
          // Нам нужен СЛЕДУЮЩИЙ символ.
          // Но Fontkit для ножек обычно возвращает глиф самой буквы (Subscript form),
          // и в codePoints у него код этой буквы! (В отличие от Harfbuzz).
          // Так что char, скорее всего, УЖЕ ПРАВИЛЬНЫЙ.

          glyphsData.push({
            id: glyphsData.length,
            char: char, // Fontkit обычно дает правильный символ здесь
            d: d,
            bb: path.getBoundingBox()
          });
      }

      cursorX += (position.xAdvance * scale);
    }

    res.json(glyphsData);

  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

init().then(() => {
  app.listen(PORT);
});