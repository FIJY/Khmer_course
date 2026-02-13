// server.cjs
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");
const hbjs = require("harfbuzzjs");  // ← новая библиотека

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const HB_WASM_PATH = path.join(__dirname, "hb.wasm");  // положи файл сюда
const FONT_SIZE = 120;

let hb = null;
let hbFont = null;
let otFont = null;
let unitsPerEm = 1000;

async function init() {
  if (!fs.existsSync(FONT_PATH)) throw new Error(`Font not found: ${FONT_PATH}`);
  if (!fs.existsSync(HB_WASM_PATH)) throw new Error(`hb.wasm not found: ${HB_WASM_PATH}`);

  // Загружаем HarfBuzz WASM
  const wasmBinary = fs.readFileSync(HB_WASM_PATH);
  const hbInstance = await WebAssembly.instantiate(wasmBinary, {});
  hb = hbjs(hbInstance.exports);

  // Загружаем шрифт в HarfBuzz
  const fontData = fs.readFileSync(FONT_PATH);
  const blob = hb.createBlob(fontData);
  const face = hb.createFace(blob, 0);
  hbFont = hb.createFont(face);
  hbFont.setScale(FONT_SIZE * 1000, FONT_SIZE * 1000);  // scale в 1/1000 em

  // opentype.js для path и bounding box
  const fontBuffer = fs.readFileSync(FONT_PATH);
  otFont = opentype.parse(fontBuffer.buffer);
  unitsPerEm = otFont.unitsPerEm || 1000;

  console.log("✅ HarfBuzz + OpenType fonts loaded.");
}

app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.send("OK"));

app.get("/api/shape", async (req, res) => {
  const rawText = req.query.text;
  if (!rawText) return res.status(400).json({ error: "No text provided" });
  if (!hb || !hbFont || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const decodedText = decodeURIComponent(rawText);
    const text = decodedText.normalize("NFC");

    const scale = FONT_SIZE / unitsPerEm;

    // HarfBuzz shaping
    const buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();  // автоопределение script/language/dir
    // Или явно: buffer.setScript(hb.Script.KHMER); buffer.setLanguage("km"); buffer.setDirection("ltr");

    hb.shape(hbFont, buffer, []);  // features: [] — default OpenType features

    const hbOutput = buffer.json();  // [{g: glyphId, cl: cluster, ax, ay, dx, dy, ...}]

    const glyphsData = [];
    let cursorX = 50;  // стартовая позиция

    for (let i = 0; i < hbOutput.length; i++) {
      const out = hbOutput[i];
      const glyphId = out.g;

      // Позиция из HarfBuzz
      const x = cursorX + (out.dx || 0) / 1000 * FONT_SIZE;
      const y = 200 - (out.dy || 0) / 1000 * FONT_SIZE;  // baseline на 200

      // Получаем path и bb из opentype.js
      const otGlyph = otFont.glyphs.get(glyphId);
      if (!otGlyph) continue;

      const path = otGlyph.getPath(x, y, FONT_SIZE);
      const d = path.toPathData(3);  // 3 decimal places
      const bb = path.getBoundingBox();

      // Cluster → определяем, какой кусок текста соответствует
      const clusterStart = out.cl;
      const clusterEnd = i + 1 < hbOutput.length ? hbOutput[i + 1].cl : text.length;
      const clusterText = text.slice(clusterStart, clusterEnd);
      const codePoints = [...clusterText].map(c => c.codePointAt(0));

      const primaryChar = clusterText.length > 0 ? clusterText[0] : "";

      glyphsData.push({
        id: i,
        glyphIdx: i,
        char: primaryChar,
        codePoints,
        cluster: clusterStart,
        d,
        bb: bb ? { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 } : null,
        advance: (out.ax || 0) / 1000 * FONT_SIZE,  // x_advance
      });

      cursorX += (out.ax || 0) / 1000 * FONT_SIZE;
    }

    console.log(`→ Отправлено ${glyphsData.length} глифов для "${text}"`);
    res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

init()
  .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server on port ${PORT}`)))
  .catch((e) => {
    console.error("Init failed:", e);
    process.exit(1);
  });