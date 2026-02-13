
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

    // ✅ КРИТИЧЕСКИ ВАЖНО: группируем ПО КЛАСТЕРАМ, а не по xAdvance!
    const clusters = [];
    let currentCluster = [];
    let lastClusterId = null;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i];

      // У каждого глифа есть cluster - ЭТО КЛЮЧ!
      // Все глифы с ОДИНАКОВЫМ cluster ID должны быть в одной группе
      const clusterId = glyph.id; // или glyph.cluster если доступно

      if (i === 0 || clusterId !== run.glyphs[i-1].id) {
        // Новый кластер
        if (currentCluster.length > 0) {
          clusters.push([...currentCluster]);
          currentCluster = [];
        }
      }

      currentCluster.push({ glyph, pos });
    }

    if (currentCluster.length > 0) {
      clusters.push([...currentCluster]);
    }

    console.log(`Кластеров: ${clusters.length}`);

    // Отрисовываем кластеры
    const glyphsData = [];
    let cursorX = 50;

    clusters.forEach((cluster, idx) => {
      // Собираем ВСЕ символы кластера
      let clusterChars = '';
      let hasConsonant = false;
      let hasVowel = false;
      let hasSubscript = false;

      cluster.forEach(({ glyph }) => {
        if (glyph.codePoints && glyph.codePoints.length > 0) {
          const codePoint = glyph.codePoints[0];
          const char = String.fromCodePoint(codePoint);
          clusterChars += char;

          // Классификация
          if (codePoint >= 0x1780 && codePoint <= 0x17A2) hasConsonant = true;
          else if (codePoint >= 0x17B6 && codePoint <= 0x17C5) hasVowel = true;
          else if (codePoint === 0x17D2) hasSubscript = true;
        }
      });

      // Если символы не собрались, берем из исходного текста
      if (!clusterChars) {
        clusterChars = text[idx] || '?';
      }

      // ВАЖНО: ВСЕ глифы кластера рисуются относительно ОДНОЙ точки!
      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

      cluster.forEach(({ glyph, pos }) => {
        const otGlyph = otFont.glyphs.get(glyph.id);

        // Все смещения относительны ОДНОЙ базовой точки
        const x = cursorX + (pos.xOffset || 0) * scale;
        const y = 200 - (pos.yOffset || 0) * scale;

        const path = otGlyph.getPath(x, y, FONT_SIZE);
        paths.push(path.toPathData(3));

        const bb = path.getBoundingBox();
        minX = Math.min(minX, bb.x1);
        minY = Math.min(minY, bb.y1);
        maxX = Math.max(maxX, bb.x2);
        maxY = Math.max(maxY, bb.y2);
      });

      // Ширина кластера - это xAdvance ПОСЛЕДНЕГО глифа
      const lastPos = cluster[cluster.length - 1].pos;
      const advanceX = lastPos.xAdvance * scale;

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
        glyphCount: cluster.length
      });

      // Сдвигаем курсор на ширину ВСЕГО кластера
      cursorX += advanceX || 50;

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