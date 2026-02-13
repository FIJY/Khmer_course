// server.cjs - ПОЛНЫЙ РАБОЧИЙ ФАЙЛ
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");
const opentype = require("opentype.js");

const app = express(); // 👈 ЭТОЙ СТРОКИ НЕ ХВАТАЛО!
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;

// ---- Paths / constants ----
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const FONT_SIZE = 120;

// ---- Font state ----
let fkFont = null;
let otFont = null;
let unitsPerEm = 1000;

async function init() {
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(`Font not found: ${FONT_PATH}`);
  }

  fkFont = fontkit.openSync(FONT_PATH);
  unitsPerEm = fkFont.unitsPerEm || 1000;

  const fontBuffer = fs.readFileSync(FONT_PATH);
  const arrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );

  otFont = opentype.parse(arrayBuffer);
  console.log("✅ Fonts loaded. Shaping engine ready.");
}

// ---- Health routes ----
app.get("/", (req, res) => res.status(200).send("OK"));
app.get("/health", (req, res) => res.status(200).send("OK"));

// ---- Main API ----
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not initialized yet" });

  try {
    const scale = FONT_SIZE / unitsPerEm;

    // Шейпим ВЕСЬ текст целиком
    const run = fkFont.layout(text);

    // Группируем глифы в кластеры
    const clusters = [];
    let currentCluster = [];
    let lastAdvance = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i];

      if (pos.xAdvance > 5 && currentCluster.length > 0) {
        clusters.push(currentCluster);
        currentCluster = [];
      }

      currentCluster.push({ glyph, pos });
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    // Отрисовываем кластеры
    const glyphsData = [];
    let cursorX = 50;

    clusters.forEach((cluster, idx) => {
      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let maxAdvance = 0;

      cluster.forEach(({ glyph, pos }) => {
        const otGlyph = otFont.glyphs.get(glyph.id);

        const x = cursorX + (pos.xOffset || 0) * scale;
        const y = 200 - (pos.yOffset || 0) * scale;

        const path = otGlyph.getPath(x, y, FONT_SIZE);
        paths.push(path.toPathData(3));

        const bb = path.getBoundingBox();
        minX = Math.min(minX, bb.x1);
        minY = Math.min(minY, bb.y1);
        maxX = Math.max(maxX, bb.x2);
        maxY = Math.max(maxY, bb.y2);

        maxAdvance = Math.max(maxAdvance, pos.xAdvance * scale);
      });

      glyphsData.push({
        id: idx,
        char: text[idx] || '?',
        d: paths.join(' '),
        bb: {
          x1: minX === Infinity ? 0 : minX,
          y1: minY === Infinity ? 0 : minY,
          x2: maxX === -Infinity ? 0 : maxX,
          y2: maxY === -Infinity ? 0 : maxY
        }
      });

      cursorX += maxAdvance || 50;
    });

    res.json(glyphsData);

  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---- Boot ----
init()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Glyph Server listening on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.error("❌ Init failed:", e);
    process.exit(1);
  });