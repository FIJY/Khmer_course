const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const opentype = require('opentype.js');

const app = express();
app.use(cors()); // Разрешаем React-у обращаться к серверу

const PORT = 3001; // Запустим на порту 3001, чтобы не мешать React (5173)

// === НАСТРОЙКИ ===
const FONT_PATH = path.join(__dirname, 'public/fonts/NotoSansKhmer-Regular.ttf');
const FONT_SIZE = 120;
const COENG = 0x17d2;

// Логика принудительного разделения (твоя v6)
function shouldForceSplit(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  const splitList = [0x17B6, 0x17C1, 0x17C2, 0x17C3, 0x17C4, 0x17C5];
  return splitList.includes(code);
}

// Глобальные переменные для кэширования
let hbInstance = null;
let fontInstance = null;
let hbFontInstance = null;
let faceInstance = null;
let blobInstance = null;

// Инициализация (загружаем один раз при старте)
async function init() {
  try {
    const lib = require('harfbuzzjs');
    const hbjs = lib.default || lib; // Обработка разных импортов

    const wasmPath = path.join(__dirname, 'node_modules/harfbuzzjs/hb-subset.wasm');
    const wasmBuffer = fs.readFileSync(wasmPath);
    hbInstance = await hbjs(wasmBuffer);

    const fontBuffer = fs.readFileSync(FONT_PATH);
    fontInstance = opentype.parse(fontBuffer.buffer);

    blobInstance = hbInstance.createBlob(fontBuffer);
    faceInstance = hbInstance.createFace(blobInstance, 0);
    hbFontInstance = hbInstance.createFont(faceInstance);
    hbFontInstance.setScale(faceInstance.upem, faceInstance.upem);

    console.log("✅ Glyph Server ready on port " + PORT);
  } catch (e) {
    console.error("❌ Init failed:", e);
    process.exit(1);
  }
}

// === API ENDPOINT ===
app.get('/api/shape', (req, res) => {
  const text = req.query.text;

  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!hbInstance) return res.status(503).json({ error: "Server not ready" });

  try {
    const buffer = hbInstance.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();
    hbInstance.shape(hbFontInstance, buffer, "ccmp=1");

    const result = buffer.json();
    const scale = FONT_SIZE / faceInstance.upem;
    let cursorX = 50;
    const glyphsData = [];
    let skipClusterIndex = -1;

    for (let i = 0; i < result.length; i++) {
      const g = result[i];
      if (g.cl === skipClusterIndex) continue;

      const char = text[g.cl];

      let nextClusterIndex = text.length;
      for (let j = i + 1; j < result.length; j++) {
        if (result[j].cl !== g.cl) { nextClusterIndex = result[j].cl; break; }
      }
      const clusterText = text.slice(g.cl, nextClusterIndex);

      // --- ЛОГИКА FORCE SPLIT ---
      if (clusterText.length === 2 && shouldForceSplit(clusterText[1])) {
          const baseChar = clusterText[0];
          const splitChar = clusterText[1];

          const baseGlyph = fontInstance.charToGlyph(baseChar);
          const basePath = baseGlyph.getPath(cursorX, 200, FONT_SIZE);
          const baseAdv = baseGlyph.advanceWidth * scale;

          glyphsData.push({
             id: glyphsData.length, char: baseChar, clusterIndex: g.cl,
             d: basePath.toPathData(3), bb: basePath.getBoundingBox()
          });

          const splitGlyph = fontInstance.charToGlyph(splitChar);
          const splitPath = splitGlyph.getPath(cursorX + baseAdv, 200, FONT_SIZE);
          const splitAdv = splitGlyph.advanceWidth * scale;

          glyphsData.push({
             id: glyphsData.length, char: splitChar, clusterIndex: g.cl+1,
             d: splitPath.toPathData(3), bb: splitPath.getBoundingBox()
          });

          cursorX += (baseAdv + splitAdv);
          skipClusterIndex = g.cl;
          continue;
      }

      // --- ОБЫЧНАЯ ЛОГИКА + DETECTIVE ---
      const glyph = fontInstance.glyphs.get(g.g);
      if (!glyph || !glyph.getPath) { cursorX += (g.ax * scale); continue; }

      const x = cursorX + (g.dx * scale);
      const y = 200 - (g.dy * scale);
      const p = glyph.getPath(x, y, FONT_SIZE);
      const d = p.toPathData(3);

      let assignedChar = text[g.cl];
      if (clusterText.length > 1) {
          let found = false;
          for (const ch of clusterText) {
            if (fontInstance.charToGlyph(ch).index === g.g) {
              assignedChar = ch; found = true; break;
            }
          }
          if (!found) {
            for (let k = 0; k < clusterText.length - 1; k++) {
              if (clusterText.charCodeAt(k) === COENG) {
                if (g.g !== fontInstance.charToGlyph(clusterText[0]).index) {
                   assignedChar = clusterText[k + 1];
                }
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

    buffer.destroy();
    // Отправляем JSON клиенту
    res.json(glyphsData);

  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Запуск
init().then(() => {
  app.listen(PORT);
});