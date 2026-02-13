// server.cjs
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");
const opentype = require("opentype.js");

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;

// ---- Paths / constants ----
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const FONT_SIZE = 120;

// ---- Font state ----
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

  console.log("✅ Fonts loaded. Shaping engine ready.");
}

// ---- Health routes ----
app.get("/", (req, res) => res.status(200).send("OK"));
app.get("/health", (req, res) => res.status(200).send("OK"));

// ---- Main API ----
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not initialized yet" });

  try {
    // ✅ NEW STRATEGY: Use fontkit for shaping, then map back to text chars
    const run = fkFont.layout(text);
    const scale = FONT_SIZE / unitsPerEm;

    console.log("\n=== SHAPING:", text);
    const textChars = Array.from(text);
    console.log("Text chars:", textChars.map((c, i) => `${i}:"${c}"`).join(', '));
    console.log("Fontkit glyphs:", run.glyphs.length);

    // Debug: show what fontkit gave us
    for (let i = 0; i < run.glyphs.length; i++) {
      const g = run.glyphs[i];
      const p = run.positions[i];
      console.log(`  Glyph ${i}: id=${g.id}, cluster=${p.cluster}, codePoints=[${(g.codePoints || []).map(cp => 'U+' + cp.toString(16).toUpperCase()).join(',')}]`);
    }

    // ✅ HYBRID: Use fontkit shaping, group by text char via codePoints
    const glyphsData = [];
    let cursorX = 50;

    // Group glyphs by which text character they represent
    const charGroups = Array.from({ length: textChars.length }, () => []);

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i];
      const codePoints = glyph.codePoints || [];

      // Find which text character this glyph represents
      let matchedCharIdx = -1;

      for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
        const charCP = textChars[charIdx].codePointAt(0);
        if (codePoints.includes(charCP)) {
          matchedCharIdx = charIdx;
          break;
        }
      }

      // Fallback: use cluster index
      if (matchedCharIdx === -1) {
        matchedCharIdx = pos.cluster ?? i;
      }

      if (matchedCharIdx >= 0 && matchedCharIdx < textChars.length) {
        charGroups[matchedCharIdx].push({ glyph, pos, idx: i });
      }
    }

    console.log("\nGrouped by text chars:");
    charGroups.forEach((group, idx) => {
      console.log(`  Char ${idx} "${textChars[idx]}": ${group.length} glyphs`);
    });

    // Render each character group
    for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
      const char = textChars[charIdx];
      const glyphGroup = charGroups[charIdx];

      if (glyphGroup.length === 0) {
        console.log(`\n⚠️ No glyphs for char ${charIdx}: "${char}"`);
        continue;
      }

      console.log(`\n📝 Char ${charIdx} "${char}": collecting ${glyphGroup.length} glyphs`);

      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let totalAdvance = 0;

      for (const { glyph, pos } of glyphGroup) {
        const otGlyph = otFont.glyphs.get(glyph.id);

        const x = cursorX + pos.xOffset * scale;
        const y = 200 - pos.yOffset * scale;

        const path = otGlyph.getPath(x, y, FONT_SIZE);
        const d = path.toPathData(3);

        if (d && d.length > 5) {
          paths.push(d);
          const bb = path.getBoundingBox();
          minX = Math.min(minX, bb.x1);
          minY = Math.min(minY, bb.y1);
          maxX = Math.max(maxX, bb.x2);
          maxY = Math.max(maxY, bb.y2);
        }

        totalAdvance = pos.xAdvance * scale;
      }

      if (paths.length > 0) {
        glyphsData.push({
          id: glyphsData.length,
          char: char,
          d: paths.join(" "),
          bb: { x1: minX, y1: minY, x2: maxX, y2: maxY }
        });

        console.log(`  ✅ Created: id=${glyphsData.length - 1}, ${paths.length} paths, bbox=[${minX.toFixed(1)},${minY.toFixed(1)} -> ${maxX.toFixed(1)},${maxY.toFixed(1)}]`);
      }

      cursorX += totalAdvance;
    }

    console.log(`\n✅ Final: ${glyphsData.length} glyphs for ${textChars.length} characters`);

    return res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ---- Boot ----
init()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Glyph Server listening on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.error("❌ Init failed:", e);
    process.exit(1);
  });
