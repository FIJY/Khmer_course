// server.cjs
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");
const opentype = require("opentype.js");

const app = express();
app.use(cors());

// ✅ Render expects you to listen on process.env.PORT
const PORT = Number(process.env.PORT) || 3001;

// ---- Paths / constants ----
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
 * IMPORTANT CHANGE:
 * We now return 1 clickable object per SHAPED GLYPH (run.glyphs),
 * NOT "1 object per Unicode character".
 *
 * This fixes:
 * - overlay/stacking when grouping merges glyphs incorrectly
 * - inability to click vowels/diacritics that are separate glyphs (marks)
 */
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const normalizedText = String(text).normalize("NFC");
    const scale = FONT_SIZE / unitsPerEm;

    const run = fkFont.layout(normalizedText);

    const glyphsData = [];
    let cursorX = 50;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i] || {};
      const codePoints = Array.isArray(glyph.codePoints) ? glyph.codePoints : [];

      // ✅ advance fallback (key to avoid "everything overlaps" issues)
      const advUnits =
        (typeof pos.xAdvance === "number" ? pos.xAdvance : null) ??
        (typeof glyph.advanceWidth === "number" ? glyph.advanceWidth : 0);

      const x = cursorX + (pos.xOffset || 0) * scale;
      const y = 200 - (pos.yOffset || 0) * scale;

      const otGlyph = otFont.glyphs.get(glyph.id);
      const pathObj = otGlyph.getPath(x, y, FONT_SIZE);
      const d = pathObj.toPathData(3);
      const bb = pathObj.getBoundingBox();

      // Primary char (first codepoint) for quick UI categorization
      const primaryChar =
        codePoints.length > 0 ? String.fromCodePoint(codePoints[0]) : "";

      glyphsData.push({
        id: i,
        glyphIdx: i,

        // primary "char" for this shaped glyph (can be mark or base)
        char: primaryChar,

        // ALL codepoints this glyph is associated with (important for target matching)
        codePoints,

        // cluster index from shaping (fallback to i if missing)
        cluster: typeof pos.cluster === "number" ? pos.cluster : i,

        d,
        bb: { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 },

        // rendered advance in px (not used by client right now, but useful for debugging)
        advance: advUnits * scale,
      });

      cursorX += advUnits * scale;
    }

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
