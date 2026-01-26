/* scripts/generate-shaped-json.cjs */
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

const WORDS_FILE = path.join(__dirname, "../src/data/words-to-shape.txt");
const OUT_FILE = path.join(__dirname, "../src/data/shaped-words.json");

// Шрифт для получения контуров (opentype)
const FONT_PATH = path.join(__dirname, "../public/fonts/NotoSansKhmer-Regular.ttf");

// HarfBuzz wasm (для shaping)
const HB_WASM_PATH = path.join(__dirname, "../node_modules/harfbuzzjs/hb.wasm");

const FONT_SIZE = 140;
const BASELINE_Y = 220;
const START_X = 40;

function readWords() {
  if (!fs.existsSync(WORDS_FILE)) {
    throw new Error(
      `Не найден файл со словами: ${WORDS_FILE}\nСоздай его и добавь слова (по одному в строке).`
    );
  }
  const raw = fs.readFileSync(WORDS_FILE, "utf8");
  const words = raw
    .split(/\r?\n/g)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("#"));

  // dedupe
  return Array.from(new Set(words));
}

async function loadHB() {
  // В Node harfbuzzjs обычно экспортирует функцию-инициализатор
  // но форматы экспорта могут отличаться, поэтому делаем “универсальный” загрузчик.
  const lib = require("harfbuzzjs");
  const hbFactory =
    (typeof lib === "function" ? lib : null) ||
    (lib && typeof lib.default === "function" ? lib.default : null);

  if (!hbFactory) {
    throw new Error(
      `harfbuzzjs загрузился, но не дал функцию-инициализатор. Проверь версию/установку пакета.`
    );
  }

  if (!fs.existsSync(HB_WASM_PATH)) {
    throw new Error(`Не найден HarfBuzz wasm: ${HB_WASM_PATH}`);
  }

  const wasmBuffer = fs.readFileSync(HB_WASM_PATH);

  // Разные сборки hbjs принимают либо (wasmBuffer), либо ({ wasmBinary })
  let hb;
  try {
    hb = await hbFactory(wasmBuffer);
  } catch (e1) {
    hb = await hbFactory({ wasmBinary: wasmBuffer });
  }

  if (!hb || typeof hb.createBlob !== "function") {
    throw new Error(`HarfBuzz инициализировался, но API не похоже на hbjs.`);
  }

  return hb;
}

function shapeWord(hb, hbFont, faceUpem, text) {
  const buf = hb.createBuffer();
  buf.addText(text);
  buf.guessSegmentProperties();

  // ccmp помогает корректно собирать составные штуки
  hb.shape(hbFont, buf, "ccmp=1");

  const json = buf.json();
  const glyphs = Array.isArray(json) ? json : (json.glyphs || []);
  buf.destroy();

  return glyphs;
}

async function main() {
  console.log("🧩 gen:shapes -> start");

  const words = readWords();
  console.log(`📌 words: ${words.length}`);
  if (!words.length) {
    console.log("⚠️ words-to-shape.txt пустой — нечего генерить");
    return;
  }

  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(`Не найден шрифт: ${FONT_PATH}`);
  }

  const hb = await loadHB();
  console.log("✅ HarfBuzz: OK");

  const fontBuffer = fs.readFileSync(FONT_PATH);
  const font = opentype.parse(fontBuffer.buffer);

  // HB font
  const blob = hb.createBlob(fontBuffer);
  const face = hb.createFace(blob, 0);
  const hbFont = hb.createFont(face);
  hbFont.setScale(face.upem, face.upem);

  const out = {};

  for (const text of words) {
    console.log(`🔨 shape: ${text}`);

    const shaped = shapeWord(hb, hbFont, face.upem, text);
    const scale = FONT_SIZE / face.upem;

    let cursorX = START_X;
    const glyphsData = [];

    for (let i = 0; i < shaped.length; i++) {
      const g = shaped[i];
      const gid = g.g;      // glyph id
      const cl = g.cl;      // cluster (индекс в исходной строке)
      const ax = g.ax || 0; // advance x
      const dx = g.dx || 0; // offset x
      const dy = g.dy || 0; // offset y

      const glyph = font.glyphs.get(gid);
      if (!glyph || typeof glyph.getPath !== "function") {
        cursorX += ax * scale;
        continue;
      }

      const x = cursorX + dx * scale;
      const y = BASELINE_Y - dy * scale;

      const p = glyph.getPath(x, y, FONT_SIZE);
      const d = p.toPathData(3);

      if (d && d.length > 5) {
        glyphsData.push({
          gid,
          cluster: cl,
          d,
          bb: p.getBoundingBox(),
        });
      }

      cursorX += ax * scale;
    }

    out[text] = glyphsData;
  }

  // cleanup HB
  try {
    hbFont.destroy();
    face.destroy();
    blob.destroy();
  } catch (_) {}

  const dir = path.dirname(OUT_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2), "utf8");
  console.log(`✅ wrote: ${OUT_FILE}`);
  console.log("🧩 gen:shapes -> done");
}

main().catch((e) => {
  console.error("❌ gen:shapes failed:", e?.message || e);
  process.exit(1);
});

