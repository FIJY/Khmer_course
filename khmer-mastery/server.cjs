// server.cjs
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");
const hbjs = require("harfbuzzjs");  // ← Use the wrapper for importObject

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const HB_WASM_PATH = path.join(__dirname, "hb.wasm");  // Ensure this file exists!
const FONT_SIZE = 120;

let hb = null;  // Will hold the HarfBuzz instance
let otFont = null;
let unitsPerEm = 1000;

async function init() {
  if (!fs.existsSync(FONT_PATH)) throw new Error(`Font not found: ${FONT_PATH}`);
  if (!fs.existsSync(HB_WASM_PATH)) throw new Error(`hb.wasm not found: ${HB_WASM_PATH}`);

  // Load WASM binary in Node.js
  const wasmBinary = fs.readFileSync(HB_WASM_PATH);

  // Compile and instantiate with importObject from hbjs to handle WASI
  const wasmModule = await WebAssembly.compile(wasmBinary);
  const instance = await WebAssembly.instantiate(wasmModule, hbjs.importObject || {});

  // Create HarfBuzz instance from exports
  hb = hbjs(instance.exports);

  // Load OpenType font
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
  if (!hb || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const decodedText = decodeURIComponent(rawText);
    const text = decodedText.normalize("NFC");

    const scale = FONT_SIZE / unitsPerEm;

    // Load font data into HarfBuzz blob
    const fontData = fs.readFileSync(FONT_PATH);
    const blob = hb.createBlob(fontData.buffer);
    const face = hb.createFace(blob, 0);
    const font = hb.createFont(face);
    font.setScale(FONT_SIZE * unitsPerEm, FONT_SIZE * unitsPerEm);  // Correct scaling

    // HarfBuzz shaping
    const buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();  // Auto script/language/dir

    hb.shape(font, buffer, []);  // Default features

    const hbOutput = buffer.json();  // Array of shaped glyphs

    const glyphsData = [];
    let cursorX = 50;  // Starting position

    for (let i = 0; i < hbOutput.length; i++) {
      const out = hbOutput[i];
      const glyphId = out.g;

      // Position from HarfBuzz (scaled)
      const x = cursorX + (out.dx || 0) * scale;
      const y = 200 - (out.dy || 0) * scale;  // Baseline adjustment

      // Get path and bb from opentype.js
      const otGlyph = otFont.glyphs.get(glyphId);
      if (!otGlyph) continue;

      const pathObj = otGlyph.getPath(x, y, FONT_SIZE);
      const d = pathObj.toPathData(3);
      const bb = pathObj.getBoundingBox();

      // Cluster info
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
      });

      cursorX += (out.ax || 0) * scale;
    }

    // Cleanup HarfBuzz resources
    buffer.destroy();
    font.destroy();
    face.destroy();
    blob.destroy();

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