/* scripts/generate-shaped-from-content.cjs */
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

// === НАСТРОЙКИ ПУТЕЙ (под твою структуру) ===
const FONT_PATH = path.join(__dirname, "../public/fonts/NotoSansKhmer-Regular.ttf");
const OUTPUT_FILE = path.join(__dirname, "../src/data/shaped-text.json");

// ❗️ВАЖНО: укажи папку, где лежит весь контент уроков (json)
// Примеры (выбери один и оставь):
const CONTENT_DIR = path.join(__dirname, "../src/data");          // если уроки в src/data
// const CONTENT_DIR = path.join(__dirname, "../content");        // если уроки в content/
// const CONTENT_DIR = path.join(__dirname, "../content_json");   // если уроки в content_json/

const FONT_SIZE = 120;
const COENG = 0x17d2; // Khmer sign coeng

// --- Regex: находим любые последовательности кхмерских символов
// Khmer block: 1780–17FF, Khmer Symbols: 19E0–19FF
const KHMER_SEQ_RE = /[\u1780-\u17FF\u19E0-\u19FF]+/g;

function walkFiles(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkFiles(p, out);
    else if (e.isFile() && p.toLowerCase().endsWith(".json")) out.push(p);
  }
  return out;
}

function collectKhmerStringsFromAnyJsonValue(value, set) {
  if (value == null) return;

  if (typeof value === "string") {
    const matches = value.match(KHMER_SEQ_RE);
    if (matches) matches.forEach((m) => set.add(m));
    return;
  }

  if (Array.isArray(value)) {
    for (const v of value) collectKhmerStringsFromAnyJsonValue(v, set);
    return;
  }

  if (typeof value === "object") {
    for (const k of Object.keys(value)) collectKhmerStringsFromAnyJsonValue(value[k], set);
  }
}

async function loadHarfBuzz() {
  try {
    const lib = require("harfbuzzjs");
    let hbjs;
    if (lib instanceof Promise) hbjs = (await lib).default || (await lib);
    else hbjs = lib.default || lib;

    // hbjs может быть функцией-инициализатором, либо готовым объектом
    if (typeof hbjs === "function") {
      // Путь к wasm — чаще всего hb-subset.wasm
      const wasmPath = path.join(__dirname, "../node_modules/harfbuzzjs/hb-subset.wasm");
      if (!fs.existsSync(wasmPath)) {
        throw new Error(`Не найден hb-subset.wasm: ${wasmPath}`);
      }
      const wasmBuffer = fs.readFileSync(wasmPath);
      return await hbjs(wasmBuffer);
    }

    if (typeof hbjs === "object" && hbjs) return hbjs;

    throw new Error("harfbuzzjs загрузился, но формат неизвестен");
  } catch (e) {
    console.error("❌ HarfBuzz load error:", e?.message || e);
    console.error("   Установи: npm i harfbuzzjs");
    process.exit(1);
  }
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function main() {
  console.log("🚀 GENERATE shaped-text.json from content…");
  console.log("   CONTENT_DIR:", CONTENT_DIR);

  // 1) Собираем все кхмерские строки из всех json в контенте
  const jsonFiles = walkFiles(CONTENT_DIR);
  if (!jsonFiles.length) {
    console.error("❌ Не найдено ни одного .json в", CONTENT_DIR);
    process.exit(1);
  }

  const wordsSet = new Set();
  for (const f of jsonFiles) {
    try {
      const raw = fs.readFileSync(f, "utf8");
      const data = JSON.parse(raw);
      collectKhmerStringsFromAnyJsonValue(data, wordsSet);
    } catch (e) {
      console.warn("⚠️ Skip invalid JSON:", f, e?.message || e);
    }
  }

  const WORDS = Array.from(wordsSet).sort((a, b) => a.localeCompare(b));
  console.log(`✅ Found Khmer strings: ${WORDS.length}`);
  if (WORDS.length === 0) {
    console.error("❌ В контенте не найдено кхмерского текста.");
    process.exit(1);
  }

  // 2) Грузим HarfBuzz + шрифт
  const hb = await loadHarfBuzz();

  if (!fs.existsSync(FONT_PATH)) {
    console.error("❌ Font not found:", FONT_PATH);
    process.exit(1);
  }
  const fontBuffer = fs.readFileSync(FONT_PATH);
  const font = opentype.parse(fontBuffer.buffer);

  const blob = hb.createBlob(fontBuffer);
  const face = hb.createFace(blob, 0);
  const hbFont = hb.createFont(face);
  hbFont.setScale(face.upem, face.upem);

  // 3) Шейпим каждую строку
  const output = {};

  for (const text of WORDS) {
    const buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();

    // Для кхмерского полезно включать ccmp; можно добавить и остальные фичи по желанию
    hb.shape(hbFont, buffer, "ccmp=1");

    const result = buffer.json();
    const scale = FONT_SIZE / face.upem;
    let cursorX = 50;

    const glyphsData = [];

    for (let i = 0; i < result.length; i++) {
      const g = result[i];

      const glyph = font.glyphs.get(g.g);
      if (!glyph || !glyph.getPath) {
        cursorX += (g.ax * scale);
        continue;
      }

      const x = cursorX + (g.dx * scale);
      const y = 200 - (g.dy * scale);

      const p = glyph.getPath(x, y, FONT_SIZE);
      const d = p.toPathData(3);

      // SMART mapping char
      let assignedChar = text[g.cl];

      // границы кластера
      let nextClusterIndex = text.length;
      for (let j = i + 1; j < result.length; j++) {
        if (result[j].cl !== g.cl) {
          nextClusterIndex = result[j].cl;
          break;
        }
      }
      const clusterText = text.slice(g.cl, nextClusterIndex);

      if (clusterText.length > 1) {
        let found = false;

        // A) прямое совпадение glyph id
        for (const ch of clusterText) {
          const standardGlyphIndex = font.charToGlyph(ch).index;
          if (standardGlyphIndex === g.g) {
            assignedChar = ch;
            found = true;
            break;
          }
        }

        // B) coeng => subscript буква после лапки
        if (!found) {
          for (let k = 0; k < clusterText.length - 1; k++) {
            if (clusterText.charCodeAt(k) === COENG) {
              const subChar = clusterText[k + 1];
              const mainCharGlyph = font.charToGlyph(clusterText[0]).index;
              if (g.g !== mainCharGlyph) assignedChar = subChar;
              break;
            }
          }
        }
      }

      if (d && d.length > 5) {
        glyphsData.push({
          id: glyphsData.length,
          char: assignedChar,
          clusterIndex: g.cl,
          d,
          bb: p.getBoundingBox(),
        });
      }

      cursorX += (g.ax * scale);
    }

    output[text] = glyphsData;
    buffer.destroy();
  }

  // 4) Сохраняем
  ensureDirForFile(OUTPUT_FILE);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf8");
  console.log("✅ Saved:", OUTPUT_FILE);

  hbFont.destroy();
  face.destroy();
  blob.destroy();
}

main().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
