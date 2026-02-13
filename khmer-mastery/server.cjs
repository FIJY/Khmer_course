// server.cjs
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");
const opentype = require("opentype.js");

console.log("SERVER VERSION: 2026-02-13 glyph-per-shaped-glyph"); // <-- должно появиться в логах

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

/**
 * Returns 1 object per SHAPED GLYPH (run.glyphs[i]).
 * This is the only robust model for Khmer (base + marks, 0 advance marks, etc).
 */
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const normalizedText = String(text).normalize("NFC");

    console.log("\n=== SHAPING (glyph-per-shaped-glyph) ===");
    console.log("Input text:", normalizedText);
    console.log(
      "Characters:",
      Array.from(normalizedText)
        .map((c) => c.codePointAt(0).toString(16))
        .join(" ")
    );

    const scale = FONT_SIZE / unitsPerEm;
    const run = fkFont.layout(normalizedText);

    console.log("run.glyphs.length:", run.glyphs.length);

    const glyphsData = [];
    let cursorX = 50;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i] || {};
      const codePoints = Array.isArray(glyph.codePoints) ? glyph.codePoints : [];

      // ✅ advance fallback (prevents overlay when xAdvance is 0/undefined)
      const advUnits =
        (typeof pos.xAdvance === "number" ? pos.xAdvance : null) ??
        (typeof glyph.advanceWidth === "number" ? glyph.advanceWidth : 0);

      const x = cursorX + (pos.xOffset || 0) * scale;
      const y = 200 - (pos.yOffset || 0) * scale;

      const otGlyph = otFont.glyphs.get(glyph.id);
      const pathObj = otGlyph.getPath(x, y, FONT_SIZE);
      const d = pathObj.toPathData(3);
      const bb = pathObj.getBoundingBox();

      const primaryChar =
        codePoints.length > 0 ? String.fromCodePoint(codePoints[0]) : "";

      glyphsData.push({
        id: i,
        glyphIdx: i,
        char: primaryChar,
        codePoints,
        cluster: typeof pos.cluster === "number" ? pos.cluster : i,
        d,
        bb: { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 },
        advance: advUnits * scale,
      });

      console.log(
        `  glyph ${i}: cluster=${typeof pos.cluster === "number" ? pos.cluster : i
        }, xAdv=${pos.xAdvance}, advWidth=${glyph.advanceWidth}, codePoints=[${codePoints
          .map((cp) => "U+" + cp.toString(16).toUpperCase())
          .join(", ")}], primaryChar="${primaryChar}"`
      );

      cursorX += advUnits * scale;
    }

    console.log(`→ Sending ${glyphsData.length} shaped glyph objects`);
    res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

init()
  .then(() =>
    app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server on port ${PORT}`))
  )
  .catch((e) => {
    console.error("Init failed:", e);
    process.exit(1);
  });
