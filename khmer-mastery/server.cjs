
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");
const opentype = require("opentype.js");

// ⚠️⚠️⚠️ ВАЖНО: app ДОЛЖЕН БЫТЬ ПЕРВЫМ ПОСЛЕ require !!!
const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const FONT_SIZE = 120;

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
  console.log("✅ Fonts loaded");
}

// Health check
app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.send("OK"));

// Main API
// server.cjs - ПРАВИЛЬНАЯ ГРУППИРОВКА ДЛЯ КХМЕРСКОГО
// server.cjs - ПРАВИЛЬНАЯ ГРУППИРОВКА ПО CLUSTER
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not initialized yet" });

  try {
    const scale = FONT_SIZE / unitsPerEm;

    console.log("\n=== SHAPING:", text);

    // Шейпим ВЕСЬ текст
    const run = fkFont.layout(text);
    console.log(`Всего глифов: ${run.glyphs.length}`);

    // ✅ ПРАВИЛЬНО: группируем по run.positions[i].cluster
    const clusters = new Map(); // cluster ID -> массив глифов

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const position = run.positions[i];

      // У каждой позиции ЕСТЬ cluster - ЭТО КЛЮЧ!
      // В fontkit позиции имеют .cluster
      const clusterId = position.cluster;

      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, []);
      }

      clusters.get(clusterId).push({ glyph, position });
    }

    // Преобразуем Map в массив и сортируем по clusterId
    const sortedClusters = Array.from(clusters.entries())
      .sort(([idA], [idB]) => idA - idB)
      .map(([_, glyphs]) => glyphs);

    console.log(`Кластеров: ${sortedClusters.length}`);

    // Отрисовываем кластеры
    const glyphsData = [];
    let cursorX = 50;

    sortedClusters.forEach((cluster, idx) => {
      // Собираем ВСЕ символы кластера
      let clusterChars = '';
      let hasConsonant = false;
      let hasVowel = false;
      let hasSubscript = false;
      let hasDiacritic = false;

      cluster.forEach(({ glyph }) => {
        if (glyph.codePoints && glyph.codePoints.length > 0) {
          // Берем ВСЕ codePoints глифа
          for (const codePoint of glyph.codePoints) {
            const char = String.fromCodePoint(codePoint);
            clusterChars += char;

            // Классификация
            if (codePoint >= 0x1780 && codePoint <= 0x17A2) hasConsonant = true;
            else if (codePoint >= 0x17B6 && codePoint <= 0x17C5) hasVowel = true;
            else if (codePoint === 0x17D2) hasSubscript = true;
            else if (codePoint >= 0x17C6 && codePoint <= 0x17D1) hasDiacritic = true;
          }
        }
      });

      // Если символы не собрались, берем из исходного текста
      if (!clusterChars) {
        clusterChars = text[cluster[0].position.cluster] || '?';
      }

      // ✅ ВАЖНО: ВСЕ глифы кластера рисуются относительно ОДНОЙ точки!
      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let maxAdvance = 0;

      cluster.forEach(({ glyph, position }) => {
        const otGlyph = otFont.glyphs.get(glyph.id);

        // Все глифы используют ОДИН cursorX!
        const x = cursorX + (position.xOffset || 0) * scale;
        const y = 200 - (position.yOffset || 0) * scale;

        const path = otGlyph.getPath(x, y, FONT_SIZE);
        paths.push(path.toPathData(3));

        const bb = path.getBoundingBox();
        minX = Math.min(minX, bb.x1);
        minY = Math.min(minY, bb.y1);
        maxX = Math.max(maxX, bb.x2);
        maxY = Math.max(maxY, bb.y2);

        maxAdvance = Math.max(maxAdvance, position.xAdvance * scale);
      });

      glyphsData.push({
        id: idx,
        char: clusterChars,
        d: paths.join(" "),
        bb: {
          x1: minX === Infinity ? cursorX : minX,
          y1: minY === Infinity ? 0 : minY,
          x2: maxX === -Infinity ? cursorX + 50 : maxX,
          y2: maxY === -Infinity ? 200 : maxY
        },
        isConsonant: hasConsonant,
        isVowel: hasVowel,
        isSubscript: hasSubscript,
        isDiacritic: hasDiacritic,
        glyphCount: cluster.length
      });

      // Сдвигаем курсор на ширину ВСЕГО кластера
      cursorX += maxAdvance || 50;

      console.log(`Кластер ${idx}: "${clusterChars}" (${cluster.length} глифов)`);
    });

    console.log(`✅ Отправлено кластеров: ${glyphsData.length}`);
    res.json(glyphsData);

  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Запуск
init().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
}).catch(console.error);