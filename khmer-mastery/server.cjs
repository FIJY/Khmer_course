// server.cjs - Split glyphs with multiple text chars
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");
const opentype = require("opentype.js");

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;
const FONT_PATH = path.join(__dirname, "public/fonts/NotoSansKhmer-Regular.ttf");

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

app.get("/api/shape", (req, res) => {
  const rawText = req.query.text;
  if (!rawText) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const decodedText = decodeURIComponent(rawText);
    const text = decodedText.normalize("NFC");
    const textChars = Array.from(text);
    const textCodePoints = textChars.map(c => c.codePointAt(0));

    console.log("\n=== SHAPING:", text);
    console.log("Text chars:", textChars.map((c, i) => `${i}:"${c}"(U+${c.codePointAt(0).toString(16).toUpperCase()})`).join(', '));

    const scale = FONT_SIZE / unitsPerEm;
    const run = fkFont.layout(text);

    console.log("Fontkit glyphs:", run.glyphs.length);

    const glyphsData = [];
    let cursorX = 50;
    let outputId = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i] || {};
      const codePoints = Array.isArray(glyph.codePoints) ? glyph.codePoints : [];

      console.log(`\n  Glyph ${i}: cluster=${pos.cluster}, codePoints=[${codePoints.map(cp => `U+${cp.toString(16).toUpperCase()}`).join(',')}]`);

      const advUnits =
        (typeof pos.xAdvance === "number" ? pos.xAdvance : null) ??
        (typeof glyph.advanceWidth === "number" ? glyph.advanceWidth : 0);

      const x = cursorX + (pos.xOffset || 0) * scale;
      const y = 200 - (pos.yOffset || 0) * scale;

      const otGlyph = otFont.glyphs.get(glyph.id);
      const path = otGlyph.getPath(x, y, FONT_SIZE);
      const d = path.toPathData(3);
      const bb = path.getBoundingBox();

      // Check if this glyph contains multiple text characters
      const matchedTextChars = [];
      for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
        const charCP = textCodePoints[charIdx];
        if (codePoints.includes(charCP)) {
          matchedTextChars.push(charIdx);
        }
      }

      console.log(`    Matched text chars: [${matchedTextChars.join(',')}]`);

      if (matchedTextChars.length > 1) {
        // SPLIT: Create separate glyph entry for each text char
        console.log(`    → Splitting into ${matchedTextChars.length} separate glyphs`);

        for (const charIdx of matchedTextChars) {
          const charCP = textCodePoints[charIdx];
          glyphsData.push({
            id: outputId++,
            glyphIdx: i,
            char: textChars[charIdx],
            codePoints: [charCP],
            cluster: charIdx,  // ← Each gets its own cluster!
            d,
            bb: { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 },
            advance: advUnits * scale,
          });
          console.log(`      → Output glyph ${outputId - 1}: char="${textChars[charIdx]}", cluster=${charIdx}`);
        }
      } else if (matchedTextChars.length === 1) {
        // NORMAL: Single text char
        const charIdx = matchedTextChars[0];
        glyphsData.push({
          id: outputId++,
          glyphIdx: i,
          char: textChars[charIdx],
          codePoints: [textCodePoints[charIdx]],
          cluster: charIdx,
          d,
          bb: { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 },
          advance: advUnits * scale,
        });
        console.log(`    → Output glyph ${outputId - 1}: char="${textChars[charIdx]}", cluster=${charIdx}`);
      } else {
        // FALLBACK: No match, use fontkit cluster
        const primaryChar = codePoints.length > 0 ? String.fromCodePoint(codePoints[0]) : "";
        const fallbackCluster = typeof pos.cluster === "number" ? pos.cluster : i;
        glyphsData.push({
          id: outputId++,
          glyphIdx: i,
          char: primaryChar,
          codePoints,
          cluster: fallbackCluster,
          d,
          bb: { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 },
          advance: advUnits * scale,
        });
        console.log(`    → Output glyph ${outputId - 1}: char="${primaryChar}", cluster=${fallbackCluster} (fallback)`);
      }

      cursorX += advUnits * scale;
    }

    console.log(`\n✅ Final: ${glyphsData.length} output glyphs from ${run.glyphs.length} fontkit glyphs`);
    res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

init()
  .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server on port ${PORT}`)))
  .catch((e) => { console.error("Init failed:", e); process.exit(1); });
