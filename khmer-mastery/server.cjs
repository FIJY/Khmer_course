// server.cjs – ПОСИМВОЛЬНЫЙ ЛЕЙАУТ (РЕКОМЕНДОВАНО)
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

// ----------------------------------------------------------------------
// НОВЫЙ ПОДХОД: обрабатываем каждый символ отдельно
// ----------------------------------------------------------------------
app.get("/api/shape", (req, res) => {
  const rawText = req.query.text;
  if (!rawText) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    // 1. Нормализуем текст и разбиваем на символы
    const decodedText = decodeURIComponent(rawText);
    const text = decodedText.normalize("NFC");
    const textChars = Array.from(text); // важно для работы с суррогатными парами

    console.log("\n=== SHAPING (per char) ===");
    console.log("Input text:", text);
    console.log("Characters:", textChars.map(c => c.codePointAt(0).toString(16)).join(' '));

    const scale = FONT_SIZE / unitsPerEm;
    const glyphsData = [];
    let cursorX = 50; // начальная позиция X

    // 2. Для каждого символа делаем отдельный layout
    for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
      const char = textChars[charIdx];

      // Layout только этого символа
      const run = fkFont.layout(char);

      // Собираем все глифы этого символа
      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let maxAdvance = 0;

      for (let i = 0; i < run.glyphs.length; i++) {
        const glyph = run.glyphs[i];
        const pos = run.positions[i];

        const otGlyph = otFont.glyphs.get(glyph.id);
        const x = cursorX + (pos.xOffset || 0) * scale;
        const y = 200 - (pos.yOffset || 0) * scale;

        const path = otGlyph.getPath(x, y, FONT_SIZE);
        const d = path.toPathData(3);
        if (d && d.length > 5) {
          paths.push(d);
        }

        const bb = path.getBoundingBox();
        minX = Math.min(minX, bb.x1);
        minY = Math.min(minY, bb.y1);
        maxX = Math.max(maxX, bb.x2);
        maxY = Math.max(maxY, bb.y2);

        maxAdvance = Math.max(maxAdvance, pos.xAdvance * scale);
      }

      // Если глифы есть – создаём один объект на символ
      if (paths.length > 0) {
        // Определяем тип символа
        const cp = char.codePointAt(0);
        const isConsonant = cp >= 0x1780 && cp <= 0x17A2;
        const isVowel = (cp >= 0x17B6 && cp <= 0x17C5) || (cp >= 0x17A3 && cp <= 0x17B3);
        const isSubscript = cp === 0x17D2;
        const isDiacritic = cp >= 0x17C6 && cp <= 0x17D1 && cp !== 0x17D2;

        glyphsData.push({
          id: glyphsData.length,
          char: char,
          d: paths.join(" "),
          bb: {
            x1: minX === Infinity ? cursorX : minX,
            y1: minY === Infinity ? 0 : minY,
            x2: maxX === -Infinity ? cursorX + 50 : maxX,
            y2: maxY === -Infinity ? 200 : maxY,
          },
          isConsonant,
          isVowel,
          isSubscript,
          isDiacritic,
          glyphCount: run.glyphs.length,
        });
      }

      // Сдвигаем курсор на ширину символа
      cursorX += maxAdvance || 50;
    }

    console.log(`→ Отправлено ${glyphsData.length} объектов (по одному на символ)`);
    res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

init()
  .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server on port ${PORT}`)))
  .catch((e) => { console.error("Init failed:", e); process.exit(1); });