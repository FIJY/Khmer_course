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

const COENG = 0x17d2;
const KHMER_CONSONANT_START = 0x1780;
const KHMER_CONSONANT_END = 0x17a2;

// ---- Helpers ----
function isKhmerConsonantCodePoint(cp) {
  return cp >= KHMER_CONSONANT_START && cp <= KHMER_CONSONANT_END;
}

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
    const run = fkFont.layout(text);
    const scale = FONT_SIZE / unitsPerEm;

    console.log("\n=== SHAPING:", text);
    console.log("Input chars:", Array.from(text).map(c => `${c} (U+${c.codePointAt(0).toString(16)})`).join(", "));
    console.log("Total glyphs from fontkit:", run.glyphs.length);

    const textChars = Array.from(text);
    const charToGlyphs = new Map(); // Map<textIndex, glyphData[]>

    // Initialize map for each text position
    textChars.forEach((_, idx) => charToGlyphs.set(idx, []));

    let cursorX = 50;

    // Process each glyph and assign to text position
    for (let i = 0; i < run.glyphs.length; i++) {
      const fkGlyph = run.glyphs[i];
      const position = run.positions[i];
      const codePoints = fkGlyph.codePoints || [];

      console.log(`\nGlyph ${i}:`, {
        codePoints: codePoints.map(cp => `U+${cp.toString(16)}`),
        cluster: position.cluster
      });

      // Determine which text position this glyph belongs to
      let textIndex = -1;

      // Strategy: Find which text character these codePoints came from
      for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
        const charCP = textChars[charIdx].codePointAt(0);

        // If any codePoint matches the text char, it belongs to that position
        if (codePoints.includes(charCP)) {
          textIndex = charIdx;
          console.log(`  → Belongs to text position ${charIdx} (${textChars[charIdx]})`);
          break;
        }
      }

      // Fallback: use cluster index if we couldn't determine from codePoints
      if (textIndex === -1 && position.cluster !== undefined) {
        textIndex = Math.min(position.cluster, textChars.length - 1);
        console.log(`  → Using cluster index ${textIndex}`);
      }

      // Fallback: sequential assignment
      if (textIndex === -1) {
        textIndex = Math.min(i, textChars.length - 1);
        console.log(`  → Using sequential index ${textIndex}`);
      }

      const otGlyph = otFont.glyphs.get(fkGlyph.id);
      const x = cursorX + position.xOffset * scale;
      const y = 200 - position.yOffset * scale;
      const path = otGlyph.getPath(x, y, FONT_SIZE);
      const d = path.toPathData(3);

      if (d && d.length > 5) {
        charToGlyphs.get(textIndex).push({
          d,
          bb: path.getBoundingBox(),
          xAdvance: position.xAdvance * scale
        });
      }

      cursorX += position.xAdvance * scale;
    }

    // Build final output - one entry per text character
    const glyphsData = [];

    for (let textIdx = 0; textIdx < textChars.length; textIdx++) {
      const char = textChars[textIdx];
      const glyphParts = charToGlyphs.get(textIdx);

      console.log(`\nText position ${textIdx} (${char}): ${glyphParts.length} glyph(s)`);

      if (glyphParts.length === 0) continue;

      // Merge all paths for this character
      const mergedPath = glyphParts.map(g => g.d).join(" ");

      // Calculate combined bounding box
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const part of glyphParts) {
        minX = Math.min(minX, part.bb.x1);
        minY = Math.min(minY, part.bb.y1);
        maxX = Math.max(maxX, part.bb.x2);
        maxY = Math.max(maxY, part.bb.y2);
      }

      glyphsData.push({
        id: glyphsData.length,
        char,
        d: mergedPath,
        bb: { x1: minX, y1: minY, x2: maxX, y2: maxY },
        textIndex: textIdx
      });

      console.log(`  → Created glyph: id=${glyphsData.length - 1}, pathCount=${glyphParts.length}`);
    }

    console.log(`\nFinal output: ${glyphsData.length} clickable glyphs\n`);

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
