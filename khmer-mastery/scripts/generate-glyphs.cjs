const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

// === СПИСОК СЛОВ ===
// Просто добавь сюда слова, которые сейчас нужны, чтобы проверить работу.
const WORDS = [
  "កាហ្វេ", "សួស្តី", "ញ៉ាំ", "ខ្មែរ",
  "កាបូប", "ការងារ", "កា",
  "សាលារៀន", "ភាសា", "ពិសា", "ដើម"
];

const FONT_SIZE = 120;
// Ссылка на твой Regular шрифт
const FONT_PATH = path.join(__dirname, '../public/fonts/NotoSansKhmer-Regular.ttf');
const OUTPUT_FILE = path.join(__dirname, '../src/data/shaped-text.json');

// Функция проверки "липких" гласных (Unicode Range)
function isDependentVowelOrSign(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  // Исключаем Плюс (Coeng, 17D2), его оставляем шрифту для ножек
  if (code === 0x17D2) return false;
  // Диапазон кхмерских зависимых знаков
  return (code >= 0x17B4 && code <= 0x17D3);
}

async function main() {
  console.log("🚀 ВОССТАНОВЛЕНИЕ: Генерация глифов...");

  // Загрузка библиотеки
  let hbjs;
  try {
    const lib = require('harfbuzzjs');
    if (lib instanceof Promise) hbjs = (await lib).default || (await lib);
    else hbjs = lib.default || lib;
  } catch (e) { process.exit(1); }

  let hb;
  if (typeof hbjs === 'function') {
      const wasmPath = path.join(__dirname, '../node_modules/harfbuzzjs/hb-subset.wasm');
      const wasmBuffer = fs.readFileSync(wasmPath);
      hb = await hbjs(wasmBuffer);
  } else if (typeof hbjs === 'object') hb = hbjs;

  if (!fs.existsSync(FONT_PATH)) { console.error("❌ НЕТ ШРИФТА Regular!"); process.exit(1); }
  const fontBuffer = fs.readFileSync(FONT_PATH);
  const font = opentype.parse(fontBuffer.buffer);

  const blob = hb.createBlob(fontBuffer);
  const face = hb.createFace(blob, 0);
  const hbFont = hb.createFont(face);
  hbFont.setScale(face.upem, face.upem);

  const output = {};

  for (const text of WORDS) {
    const buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();

    // Стандартный режим (ccmp=1)
    hb.shape(hbFont, buffer, "ccmp=1");

    const jsonOutput = buffer.json();
    let result = Array.isArray(jsonOutput) ? jsonOutput : (jsonOutput.glyphs || []);
    const scale = FONT_SIZE / face.upem;
    let cursorX = 50;
    const glyphsData = [];

    for (let i = 0; i < result.length; i++) {
      const g = result[i];
      const char = text[g.cl];
      const nextChar = text[g.cl + 1];

      // АВТО-РЕЗКА ГЛАСНЫХ
      let needsSurgery = false;
      if (nextChar && isDependentVowelOrSign(nextChar)) {
          const cleanGlyphIndex = font.charToGlyph(char).index;
          if (g.g !== cleanGlyphIndex) needsSurgery = true;
      }

      if (needsSurgery) {
          // Рисуем вручную: Согласная + Гласная
          const fontGlyph = font.charToGlyph(char);
          const advanceWidth = fontGlyph.advanceWidth * scale;

          const cleanPath = font.getPath(char, cursorX, 200, FONT_SIZE);
          glyphsData.push({
            id: glyphsData.length, char: char, clusterIndex: g.cl,
            d: cleanPath.toPathData(3), bb: cleanPath.getBoundingBox()
          });

          const vowelPath = font.getPath(nextChar, cursorX + advanceWidth, 200, FONT_SIZE);
          glyphsData.push({
            id: glyphsData.length, char: nextChar, clusterIndex: g.cl + 1,
            d: vowelPath.toPathData(3), bb: vowelPath.getBoundingBox()
          });

          cursorX += (g.ax * scale);
          continue;
      }

      // Обычный режим
      const glyph = font.glyphs.get(g.g);
      if (!glyph.getPath) { cursorX += (g.ax * scale); continue; }

      const x = cursorX + (g.dx * scale);
      const y = 200 - (g.dy * scale);
      const path = glyph.getPath(x, y, FONT_SIZE);
      const pathData = path.toPathData(3);

      if (pathData && pathData.length > 5) {
          let realChar = text[g.cl];
          if (realChar && realChar.charCodeAt(0) === 0x17D2 && text[g.cl + 1]) {
             realChar = text[g.cl + 1];
          }
          glyphsData.push({
            id: glyphsData.length, char: realChar, clusterIndex: g.cl,
            d: pathData, bb: path.getBoundingBox()
          });
      }
      cursorX += (g.ax * scale);
    }
    output[text] = glyphsData;
    buffer.destroy();
  }

  const dataDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`✅ ГОТОВО: Файл shaped-text.json обновлен.`);

  hbFont.destroy(); face.destroy(); blob.destroy();
}
main().catch(console.error);