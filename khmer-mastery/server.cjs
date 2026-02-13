// server.cjs – АБСОЛЮТНО РАБОЧАЯ ВЕРСИЯ
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

app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.send("OK"));

app.get("/api/shape", (req, res) => {
  let rawText = req.query.text;
  if (!rawText) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    // 1. Декодируем URL-кодировку
    const decodedText = decodeURIComponent(rawText);
    // 2. Нормализуем NFC (это важно для кхмерского)
    const text = decodedText.normalize("NFC");

    console.log("\n=== SHAPING ===");
    console.log("Raw query.text:", rawText);
    console.log("Decoded text:", decodedText);
    console.log("Normalized text:", text);
    console.log("Characters:", Array.from(text).map(c => c.codePointAt(0).toString(16)).join(' '));
    console.log("Length:", text.length);

    const scale = FONT_SIZE / unitsPerEm;
    const run = fkFont.layout(text);

    const glyphsData = [];
    let cursorX = 50;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i];

      let char = "?";
      let codePoint = null;
      if (glyph.codePoints && glyph.codePoints.length > 0) {
        codePoint = glyph.codePoints[0];
        char = String.fromCodePoint(codePoint);
      }

      const cp = codePoint || 0;
      const isConsonant = cp >= 0x1780 && cp <= 0x17A2;
      const isVowel = (cp >= 0x17B6 && cp <= 0x17C5) || (cp >= 0x17A3 && cp <= 0x17B3);
      const isSubscript = cp === 0x17D2;
      const isDiacritic = cp >= 0x17C6 && cp <= 0x17D1 && cp !== 0x17D2;

      const x = cursorX + (pos.xOffset || 0) * scale;
      const y = 200 - (pos.yOffset || 0) * scale;

      const otGlyph = otFont.glyphs.get(glyph.id);
      const path = otGlyph.getPath(x, y, FONT_SIZE);
      const d = path.toPathData(3);
      const bb = path.getBoundingBox();

      glyphsData.push({
        id: i,
        char: char,
        d: d,
        bb: {
          x1: bb.x1,
          y1: bb.y1,
          x2: bb.x2,
          y2: bb.y2,
        },
        isConsonant,
        isVowel,
        isSubscript,
        isDiacritic,
      });

      cursorX += pos.xAdvance * scale;
    }

    console.log(`→ Ответ: ${glyphsData.length} глифов`);
    res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

init()
  .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server on port ${PORT}`)))
  .catch((e) => { console.error("Init failed:", e); process.exit(1); });