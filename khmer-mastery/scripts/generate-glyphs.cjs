const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

// === СПИСОК СЛОВ ===
const WORDS = [
  "កាហ្វេ", "សួស្តី", "ញ៉ាំ", "ខ្មែរ",
  "កាបូប", "ការងារ", "កា",
  "សាលារៀន", "ភាសា", "ពិសា", "ដើម"
];

const FONT_SIZE = 120;
const FONT_PATH = path.join(__dirname, '../public/fonts/NotoSansKhmer-Regular.ttf');
const OUTPUT_FILE = path.join(__dirname, '../data/shaped-text.json');

// Код знака Coeng (лапка для подстрочных)
const COENG = 0x17D2;

async function main() {
  console.log("🚀 ВОССТАНОВЛЕНИЕ: Генерация глифов с умным маппингом...");

  // 1. Загрузка Harfbuzz
  let hbjs;
  try {
    const lib = require('harfbuzzjs');
    if (lib instanceof Promise) hbjs = (await lib).default || (await lib);
    else hbjs = lib.default || lib;
  } catch (e) {
    console.error("❌ Ошибка загрузки harfbuzzjs:", e);
    process.exit(1);
  }

  // 2. Инициализация Harfbuzz
  let hb;
  if (typeof hbjs === 'function') {
      const wasmPath = path.join(__dirname, '../node_modules/harfbuzzjs/hb-subset.wasm');
      if (!fs.existsSync(wasmPath)) {
         console.error("❌ Не найден hb-subset.wasm по пути:", wasmPath);
         process.exit(1);
      }
      const wasmBuffer = fs.readFileSync(wasmPath);
      hb = await hbjs(wasmBuffer);
  } else if (typeof hbjs === 'object') {
      hb = hbjs;
  }

  // 3. Загрузка шрифта
  if (!fs.existsSync(FONT_PATH)) { console.error("❌ НЕТ ШРИФТА:", FONT_PATH); process.exit(1); }
  const fontBuffer = fs.readFileSync(FONT_PATH);
  const font = opentype.parse(fontBuffer.buffer); // Для проверки глифов
  const blob = hb.createBlob(fontBuffer);
  const face = hb.createFace(blob, 0);
  const hbFont = hb.createFont(face);
  hbFont.setScale(face.upem, face.upem);

  const output = {};

  for (const text of WORDS) {
    const buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();
    hb.shape(hbFont, buffer, "ccmp=1"); // Обязательно включаем ccmp для кхмерского

    const result = buffer.json();
    const scale = FONT_SIZE / face.upem;
    let cursorX = 50;
    const glyphsData = [];

    // Группируем глифы по кластерам для анализа
    // Harfbuzz возвращает result, где каждый элемент имеет .cl (индекс начала кластера в строке)

    for (let i = 0; i < result.length; i++) {
      const g = result[i];

      // Получаем глиф из шрифта для отрисовки
      const glyph = font.glyphs.get(g.g);
      if (!glyph.getPath) { cursorX += (g.ax * scale); continue; }

      const x = cursorX + (g.dx * scale);
      const y = 200 - (g.dy * scale);
      const path = glyph.getPath(x, y, FONT_SIZE);
      const pathData = path.toPathData(3);

      // --- ЛОГИКА УМНОГО МАППИНГА (Smart Mapping) ---
      // По умолчанию берем символ, на который указывает кластер
      let assignedChar = text[g.cl];

      // Определяем границы кластера (от g.cl до следующего кластера или конца строки)
      let nextClusterIndex = text.length;
      for(let j = i + 1; j < result.length; j++) {
          if (result[j].cl !== g.cl) {
              nextClusterIndex = result[j].cl;
              break;
          }
      }

      // Если в кластере больше 1 символа, пытаемся найти точное совпадение
      const clusterText = text.slice(g.cl, nextClusterIndex);

      if (clusterText.length > 1) {
          let foundMatch = false;

          // 1. Попытка прямого совпадения:
          // Проверяем каждый символ в кластере: "А не этот ли символ дает такой глиф?"
          for (const char of clusterText) {
              const standardGlyphIndex = font.charToGlyph(char).index;
              if (standardGlyphIndex === g.g) {
                  assignedChar = char;
                  foundMatch = true;
                  break;
              }
          }

          // 2. Если прямого совпадения нет (это подстрочная буква/Coeng),
          // ищем "скрытый" символ.
          if (!foundMatch) {
             // Обычно подстрочная буква идет после знака 0x17D2 (COENG)
             for (let k = 0; k < clusterText.length - 1; k++) {
                 if (clusterText.charCodeAt(k) === COENG) {
                     // Если мы нашли COENG, то скорее всего этот "неопознанный" глиф
                     // относится к следующей за ним букве (подстрочной)
                     const subChar = clusterText[k+1];
                     // Дополнительная проверка: основной символ кластера (первый) обычно
                     // имеет свой нормальный глиф. Если текущий глиф НЕ совпадает с первым,
                     // это сильный сигнал, что это подстрочная.
                     const mainCharGlyph = font.charToGlyph(clusterText[0]).index;
                     if (g.g !== mainCharGlyph) {
                         assignedChar = subChar;
                         foundMatch = true;
                     }
                     break;
                 }
             }
          }
      }
      // ---------------------------------------------

      if (pathData && pathData.length > 5) {
          glyphsData.push({
            id: glyphsData.length,
            char: assignedChar, // Используем найденный "умный" символ
            clusterIndex: g.cl,
            d: pathData,
            bb: path.getBoundingBox()
          });
      }