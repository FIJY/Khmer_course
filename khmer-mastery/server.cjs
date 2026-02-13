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

    // STEP 1: Analyze all glyphs and determine matches
    const glyphAnalysis = [];

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i] || {};
      const codePoints = Array.isArray(glyph.codePoints) ? glyph.codePoints : [];

      console.log(`  Glyph ${i}: cluster=${pos.cluster}, codePoints=[${codePoints.map(cp => `U+${cp.toString(16).toUpperCase()}`).join(',')}]`);

      // Find which text chars this glyph represents
      const matchedTextChars = [];
      for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
        const charCP = textCodePoints[charIdx];
        if (codePoints.includes(charCP)) {
          matchedTextChars.push(charIdx);
        }
      }

      console.log(`    Matched text chars: [${matchedTextChars.join(',')}]`);

      glyphAnalysis.push({
        glyphIdx: i,
        glyph,
        pos,
        codePoints,
        matchedTextChars
      });
    }

    // STEP 2: Assign clusters to unmatched glyphs
    for (let i = 0; i < glyphAnalysis.length; i++) {
      const analysis = glyphAnalysis[i];

      if (analysis.matchedTextChars.length === 0) {
        // Check if this is a component glyph (left/top parts of composite vowels)
        const COMPONENT_CPS = [0x17C1, 0x17C4, 0x17C5]; // េ, ី, ៅ
        const isComponent = analysis.codePoints.some(cp => COMPONENT_CPS.includes(cp));

        if (isComponent) {
          // Component glyphs belong to vowels, which are usually last
          analysis.assignedCluster = textChars.length - 1;
          console.log(`    → Assigning component glyph ${i} to cluster ${analysis.assignedCluster} (last char - likely vowel)`);
        } else {
          // Look for next glyph that has a match
          let found = false;
          for (let j = i + 1; j < glyphAnalysis.length; j++) {
            if (glyphAnalysis[j].matchedTextChars.length > 0) {
              // If next glyph matches multiple chars, use the LAST one (likely vowel)
              const nextMatches = glyphAnalysis[j].matchedTextChars;
              analysis.assignedCluster = nextMatches[nextMatches.length - 1];
              console.log(`    → Assigning unmatched glyph ${i} to cluster ${analysis.assignedCluster} (from next glyph)`);
              found = true;
              break;
            }
          }

          // If still no match, use last text char
          if (!found) {
            analysis.assignedCluster = textChars.length - 1;
            console.log(`    → Assigning unmatched glyph ${i} to cluster ${analysis.assignedCluster} (last char)`);
          }
        }
      }
    }

    // STEP 3: Render glyphs
    for (const analysis of glyphAnalysis) {
      const { glyphIdx, glyph, pos, codePoints, matchedTextChars, assignedCluster } = analysis;

      const advUnits =
        (typeof pos.xAdvance === "number" ? pos.xAdvance : null) ??
        (typeof glyph.advanceWidth === "number" ? glyph.advanceWidth : 0);

      const x = cursorX + (pos.xOffset || 0) * scale;
      const y = 200 - (pos.yOffset || 0) * scale;

      const otGlyph = otFont.glyphs.get(glyph.id);
      const path = otGlyph.getPath(x, y, FONT_SIZE);
      const d = path.toPathData(3);
      const bb = path.getBoundingBox();

      if (matchedTextChars.length > 1) {
        // SPLIT: Create separate glyph entry for each text char
        console.log(`    → Splitting into ${matchedTextChars.length} separate glyphs`);

        for (const charIdx of matchedTextChars) {
          const charCP = textCodePoints[charIdx];
          glyphsData.push({
            id: outputId++,
            glyphIdx,
            char: textChars[charIdx],
            codePoints: [charCP],
            cluster: charIdx,
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
          glyphIdx,
          char: textChars[charIdx],
          codePoints: [textCodePoints[charIdx]],
          cluster: charIdx,
          d,
          bb: { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 },
          advance: advUnits * scale,
        });
        console.log(`    → Output glyph ${outputId - 1}: char="${textChars[charIdx]}", cluster=${charIdx}`);
      } else {
        // FALLBACK: Use assigned cluster
        const primaryChar = codePoints.length > 0 ? String.fromCodePoint(codePoints[0]) : "";
        glyphsData.push({
          id: outputId++,
          glyphIdx,
          char: primaryChar,
          codePoints,
          cluster: assignedCluster,
          d,
          bb: { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 },
          advance: advUnits * scale,
        });
        console.log(`    → Output glyph ${outputId - 1}: char="${primaryChar}", cluster=${assignedCluster}`);
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
