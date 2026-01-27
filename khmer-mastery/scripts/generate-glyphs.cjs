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
// НОВАЯ ВЕРСИЯ ФАЙЛА - v5
const OUTPUT_FILE = path.join(__dirname, '../src/data/shaped-text-v5.json');

const COENG = 0x17D2; // Знак лапки

// Проверка на зависимую гласную (исключая Coeng)
function isDependentVowel(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  if (code === 0x17D2) return false;
  return (code >= 0x17B4 && code <= 0x17D3);
}

async function main() {
  console.log("🚀 ГЕНЕРАЦИЯ v5: Force Split + Smart Mapping...");

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

  if (!fs.existsSync(FONT_PATH)) { console.error("❌ НЕТ ШРИФТА!"); process.exit(1); }
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
    hb.shape(hbFont, buffer, "ccmp=1");

    const result = buffer.json();
    const scale = FONT_SIZE / face.upem;
    let cursorX = 50;
    const glyphsData = [];
    let skipClusterIndex = -1;

    for (let i = 0; i < result.length; i++) {
      const g = result[i];

      // 1. Пропускаем, если уже нарисовали этот кластер вручную
      if (g.cl === skipClusterIndex) continue;

      const char = text[g.cl];
      const nextChar = text[g.cl + 1];

      // 2. FORCE SPLIT: Если это простая пара "Согласная + Гласная" (как в Ka)
      // Мы рисуем их сами, чтобы они визуально разделились
      if (nextChar && isDependentVowel(nextChar)) {
          // А. Согласная
          const baseGlyph = font.charToGlyph(char);
          const basePath = baseGlyph.getPath(cursorX, 200, FONT_SIZE);
          const baseAdvance = baseGlyph.advanceWidth * scale;

          glyphsData.push({
             id: glyphsData.length,
             char: char,
             clusterIndex: g.cl,
             d: basePath.toPathData(3),
             bb: basePath.getBoundingBox()
          });

          // Б. Гласная
          const vowelGlyph = font.charToGlyph(nextChar);
          const vowelPath = vowelGlyph.getPath(cursorX + baseAdvance, 200, FONT_SIZE);
          const vowelAdvance = vowelGlyph.advanceWidth * scale;

          glyphsData.push({
             id: glyphsData.length,
             char: nextChar,
             clusterIndex: g.cl + 1,
             d: vowelPath.toPathData(3),
             bb: vowelPath.getBoundingBox()
          });

          cursorX += (baseAdvance + vowelAdvance);
          skipClusterIndex = g.cl;
          continue;
      }

      // 3. ОБЫЧНЫЙ РЕЖИМ + SMART MAPPING (Детектив)
      // Сюда попадают сложные слова типа "Кофе" (Ho + Coeng + Vo + E)
      const glyph = font.glyphs.get(g.g);
      if (!glyph.getPath) { cursorX += (g.ax * scale); continue; }

      const x = cursorX + (g.dx * scale);
      const y = 200 - (g.dy * scale);
      const path = glyph.getPath(x, y, FONT_SIZE);
      const pathData = path.toPathData(3);

      // --- Детектив: Чей это глиф? ---
      let realChar = text[g.cl]; // По умолчанию верим Harfbuzz (часто врет для подстрочных)

      // Ищем границы текущего кластера
      let nextClusterIdx = text.length;
      for(let j = i + 1; j < result.length; j++) {
         if (result[j].cl !== g.cl) { nextClusterIdx = result[j].cl; break; }
      }
      const clusterText = text.slice(g.cl, nextClusterIdx);

      if (clusterText.length > 1) {
          let found = false;
          // А. Точное совпадение (например для гласной E)
          for (const ch of clusterText) {
              if (font.charToGlyph(ch).index === g.g) {
                  realChar = ch;
                  found = true;
                  break;
              }
          }
          // Б. Если не нашли, и есть лапка (Coeng) -> значит это подстрочная
          if (!found) {
              for (let k = 0; k < clusterText.length - 1; k++) {
                  if (clusterText.charCodeAt(k) === COENG) {
                      const subChar = clusterText[k+1];
                      // Проверяем, что это не основная буква
                      if (g.g !== font.charToGlyph(clusterText[0]).index) {
                          realChar = subChar;
                      }
                      break;
                  }
              }
          }
      }

      if (pathData && pathData.length > 5) {
          glyphsData.push({
            id: glyphsData.length,
            char: realChar, // <-- Теперь здесь правильная буква!
            clusterIndex: g.cl,
            d: pathData,
            bb: path.getBoundingBox()
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
  console.log(`✅ ГОТОВО: Файл ${path.basename(OUTPUT_FILE)} создан.`);

  hbFont.destroy(); face.destroy(); blob.destroy();
}
main().catch(console.error);