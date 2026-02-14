// server.cjs
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");
const hbjs = require("harfbuzzjs");

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const HB_WASM_PATH = path.join(__dirname, "hb.wasm");
const FONT_SIZE = 120;

let hb = null;
let otFont = null;
let unitsPerEm = 1000;

async function init() {
  if (!fs.existsSync(FONT_PATH)) throw new Error(`Font not found: ${FONT_PATH}`);
  if (!fs.existsSync(HB_WASM_PATH)) throw new Error(`hb.wasm not found: ${HB_WASM_PATH}`);

  const wasmBinary = fs.readFileSync(HB_WASM_PATH);
  const wasmModule = await WebAssembly.compile(wasmBinary);
  const instance = await WebAssembly.instantiate(wasmModule, hbjs.importObject || {});
  hb = hbjs(instance.exports);

  const fontBuffer = fs.readFileSync(FONT_PATH);
  otFont = opentype.parse(fontBuffer.buffer);
  unitsPerEm = otFont.unitsPerEm || 1000;

  console.log("✅ HarfBuzz + OpenType fonts loaded.");
}

app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.send("OK"));

app.get("/api/shape", async (req, res) => {
  const rawText = req.query.text;
  const mode = req.query.mode || 'normal'; // 'normal' или 'split'
  if (!rawText) return res.status(400).json({ error: "No text provided" });
  if (!hb || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const decodedText = decodeURIComponent(rawText);
    const text = decodedText.normalize("NFC");
    const scale = FONT_SIZE / unitsPerEm;

    // Загружаем шрифт в HarfBuzz
    const fontData = fs.readFileSync(FONT_PATH);
    const blob = hb.createBlob(fontData.buffer);
    const face = hb.createFace(blob, 0);
    const font = hb.createFont(face);
    font.setScale(FONT_SIZE * unitsPerEm, FONT_SIZE * unitsPerEm);

    const buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();

    // Определяем фичи в зависимости от режима
    let features = [];
    if (mode === 'split') {
      features = [
        { tag: 'liga', value: 0 },
        { tag: 'clig', value: 0 },
        { tag: 'ccmp', value: 0 },
        { tag: 'abvf', value: 0 },
        { tag: 'abvs', value: 0 },
        { tag: 'blwf', value: 0 },
        { tag: 'pstf', value: 0 },
        { tag: 'pref', value: 0 },
        { tag: 'pres', value: 0 },
        { tag: 'psts', value: 0 }
      ];
    }

    hb.shape(font, buffer, features);
    const hbOutput = buffer.json();

    const glyphsData = [];
    let cursorX = 50;

    for (let i = 0; i < hbOutput.length; i++) {
      const out = hbOutput[i];
      const glyphId = out.g;
      const x = cursorX + (out.dx || 0) * scale;
      const y = 200 - (out.dy || 0) * scale;

      const otGlyph = otFont.glyphs.get(glyphId);
      if (!otGlyph) continue;

      const pathObj = otGlyph.getPath(x, y, FONT_SIZE);
      const d = pathObj.toPathData(3);
      const bb = pathObj.getBoundingBox();

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
        advance: (out.ax || 0) * scale,
        x, // сохраняем координаты для возможного использования на клиенте
        y,
      });

      cursorX += (out.ax || 0) * scale;
    }

    buffer.destroy();
    font.destroy();
    face.destroy();
    blob.destroy();

    console.log(`→ [${mode}] Отправлено ${glyphsData.length} глифов для "${text}"`);
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