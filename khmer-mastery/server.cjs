// server.cjs – ФИНАЛЬНАЯ РАБОЧАЯ ВЕРСИЯ
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");
const opentype = require("opentype.js");

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const FONT_SIZE = 120;

let fkFont = null;
let otFont = null;
let unitsPerEm = 1000;

async function init() {
  if (!fs.existsSync(FONT_PATH)) throw new Error(`Font not found: ${FONT_PATH}`);
  fkFont = fontkit.openSync(FONT_PATH);
  unitsPerEm = fkFont.unitsPerEm || 1000;
  const fontBuffer = fs.readFileSync(FONT_PATH);
  const arrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );
  otFont = opentype.parse(arrayBuffer);
  console.log("✅ Fonts loaded.");
}

// Health checks
app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.send("OK"));

// ----------------------------------------------------------------------
// ГЛАВНОЕ: отдаём КАЖДЫЙ ГЛИФ как отдельный кликабельный объект
// ----------------------------------------------------------------------
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const scale = FONT_SIZE / unitsPerEm;
    const run = fkFont.layout(text);   // шейпим ВСЁ сразу – правильно!

    const glyphsData = [];
    let cursorX = 50;                  // начальная позиция

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i];

      // --- Определяем, какой символ представляет этот глиф ---
      let char = "?";
      let codePoint = null;
      if (glyph.codePoints && glyph.codePoints.length > 0) {
        codePoint = glyph.codePoints[0];
        char = String.fromCodePoint(codePoint);
      }

      // --- Классификация для удобства клиента ---
      const cp = codePoint || 0;
      const isConsonant = cp >= 0x1780 && cp <= 0x17A2;
      const isVowel = (cp >= 0x17B6 && cp <= 0x17C5) || (cp >= 0x17A3 && cp <= 0x17B3);
      const isSubscript = cp === 0x17D2; // сам коенг, но клиент сам определит подписную
      const isDiacritic = cp >= 0x17C6 && cp <= 0x17D1 && cp !== 0x17D2;

      // --- Позиция глифа (xOffset, yOffset могут быть отрицательными!) ---
      const x = cursorX + (pos.xOffset || 0) * scale;
      const y = 200 - (pos.yOffset || 0) * scale;

      // --- Получаем Path2D через opentype.js ---
      const otGlyph = otFont.glyphs.get(glyph.id);
      const path = otGlyph.getPath(x, y, FONT_SIZE);
      const d = path.toPathData(3);

      // --- Bounding box этого глифа ---
      const bb = path.getBoundingBox();

      glyphsData.push({
        id: i,                         // уникальный индекс в этом запросе
        char: char,
        d: d,
        bb: {
          x1: bb.x1,
          y1: bb.y1,
          x2: bb.x2,
          y2: bb.y2,
        },
        // Полезные флаги – клиент может использовать или игнорировать
        isConsonant,
        isVowel,
        isSubscript,
        isDiacritic,
      });

      // --- Сдвигаем курсор на ширину этого глифа (xAdvance) ---
      cursorX += pos.xAdvance * scale;
    }

    console.log(`→ Текст: "${text}" → ${glyphsData.length} глифов`);
    res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

init()
  .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server on port ${PORT}`)))
  .catch((e) => { console.error("Init failed:", e); process.exit(1); });