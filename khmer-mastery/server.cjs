// server.cjs - Smart grouping by codePoints
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");
const opentype = require("opentype.js");

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

app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const normalizedText = text.normalize("NFC");
    const textChars = Array.from(normalizedText);
    const textCodePoints = textChars.map(c => c.codePointAt(0));

    console.log("\n=== SHAPING:", normalizedText);
    console.log("Text chars:", textChars.map((c, i) => `${i}:"${c}"(U+${c.codePointAt(0).toString(16).toUpperCase()})`).join(', '));

    const scale = FONT_SIZE / unitsPerEm;
    const run = fkFont.layout(normalizedText);

    console.log("Fontkit glyphs:", run.glyphs.length);

    // STEP 1: Render all glyphs
    const allGlyphs = [];
    let cursorX = 50;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i];
      const codePoints = glyph.codePoints || [];

      const x = cursorX + (pos.xOffset || 0) * scale;
      const y = 200 - (pos.yOffset || 0) * scale;

      const otGlyph = otFont.glyphs.get(glyph.id);
      const path = otGlyph.getPath(x, y, FONT_SIZE);
      const d = path.toPathData(3);
      const bb = path.getBoundingBox();

      allGlyphs.push({
        glyphIdx: i,
        codePoints: codePoints,
        cluster: pos.cluster ?? i,
        d: d,
        bb: bb,
        advance: pos.xAdvance * scale
      });

      cursorX += pos.xAdvance * scale;

      console.log(`  Glyph ${i}: cluster=${pos.cluster}, codePoints=[${codePoints.map(cp => 'U+' + cp.toString(16).toUpperCase()).join(',')}], bbox=[${bb.x1.toFixed(1)}, ${bb.y1.toFixed(1)} -> ${bb.x2.toFixed(1)}, ${bb.y2.toFixed(1)}]`);
    }

    // STEP 2: Smart grouping - match glyphs to text chars
    const textCharToGlyphs = Array.from({ length: textChars.length }, () => []);
    const assignedGlyphs = new Set();

    // First pass: exact codePoint match
    for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
      const targetCP = textCodePoints[charIdx];

      for (let glyphIdx = 0; glyphIdx < allGlyphs.length; glyphIdx++) {
        if (assignedGlyphs.has(glyphIdx)) continue;

        const glyph = allGlyphs[glyphIdx];
        if (glyph.codePoints.includes(targetCP)) {
          textCharToGlyphs[charIdx].push(glyphIdx);
          assignedGlyphs.add(glyphIdx);
          console.log(`  ✓ Glyph ${glyphIdx} → Char ${charIdx} (exact match: U+${targetCP.toString(16).toUpperCase()})`);
        }
      }
    }

    // Second pass: assign remaining glyphs by position
    for (let glyphIdx = 0; glyphIdx < allGlyphs.length; glyphIdx++) {
      if (assignedGlyphs.has(glyphIdx)) continue;

      const glyph = allGlyphs[glyphIdx];

      // Try cluster index first
      let targetCharIdx = glyph.cluster;
      if (targetCharIdx >= textChars.length) {
        targetCharIdx = textChars.length - 1;
      }

      // If that char already has glyphs, put this one there too
      // (probably a multi-component glyph)
      if (textCharToGlyphs[targetCharIdx].length > 0) {
        textCharToGlyphs[targetCharIdx].push(glyphIdx);
        assignedGlyphs.add(glyphIdx);
        console.log(`  ✓ Glyph ${glyphIdx} → Char ${targetCharIdx} (cluster fallback)`);
      } else {
        // Assign to nearest non-empty char
        for (let offset = 1; offset < textChars.length; offset++) {
          const nextIdx = targetCharIdx + offset;
          if (nextIdx < textChars.length && textCharToGlyphs[nextIdx].length > 0) {
            textCharToGlyphs[nextIdx].push(glyphIdx);
            assignedGlyphs.add(glyphIdx);
            console.log(`  ✓ Glyph ${glyphIdx} → Char ${nextIdx} (nearest match)`);
            break;
          }
          const prevIdx = targetCharIdx - offset;
          if (prevIdx >= 0 && textCharToGlyphs[prevIdx].length > 0) {
            textCharToGlyphs[prevIdx].push(glyphIdx);
            assignedGlyphs.add(glyphIdx);
            console.log(`  ✓ Glyph ${glyphIdx} → Char ${prevIdx} (nearest match)`);
            break;
          }
        }
      }
    }

    // Third pass: AGGRESSIVE FALLBACK - if still unassigned, distribute evenly
    const stillUnassigned = [];
    for (let glyphIdx = 0; glyphIdx < allGlyphs.length; glyphIdx++) {
      if (!assignedGlyphs.has(glyphIdx)) {
        stillUnassigned.push(glyphIdx);
      }
    }

    if (stillUnassigned.length > 0) {
      console.log(`\n⚠️ Still ${stillUnassigned.length} unassigned glyphs - using aggressive fallback`);

      // Find empty char slots
      const emptyCharSlots = [];
      for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
        if (textCharToGlyphs[charIdx].length === 0) {
          emptyCharSlots.push(charIdx);
        }
      }

      // Assign to empty slots first
      for (let i = 0; i < stillUnassigned.length && i < emptyCharSlots.length; i++) {
        const glyphIdx = stillUnassigned[i];
        const charIdx = emptyCharSlots[i];
        textCharToGlyphs[charIdx].push(glyphIdx);
        assignedGlyphs.add(glyphIdx);
        console.log(`  ✓ Glyph ${glyphIdx} → Char ${charIdx} (aggressive: empty slot)`);
      }

      // If still have unassigned, distribute to last char
      for (let glyphIdx of stillUnassigned) {
        if (!assignedGlyphs.has(glyphIdx)) {
          const lastCharIdx = textChars.length - 1;
          textCharToGlyphs[lastCharIdx].push(glyphIdx);
          assignedGlyphs.add(glyphIdx);
          console.log(`  ✓ Glyph ${glyphIdx} → Char ${lastCharIdx} (aggressive: last char)`);
        }
      }
    }

    console.log("\nFinal grouping:");
    textCharToGlyphs.forEach((glyphIdxs, charIdx) => {
      console.log(`  Char ${charIdx} "${textChars[charIdx]}": glyphs [${glyphIdxs.join(',')}]`);
    });

    // STEP 3: Create one object per text character
    const glyphsData = [];

    for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
      const char = textChars[charIdx];
      const glyphIndices = textCharToGlyphs[charIdx];

      if (glyphIndices.length === 0) {
        console.log(`⚠️ No glyphs for char ${charIdx}: "${char}"`);
        continue;
      }

      const paths = glyphIndices.map(idx => allGlyphs[idx].d).filter(d => d && d.length > 5);

      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const idx of glyphIndices) {
        const g = allGlyphs[idx];
        minX = Math.min(minX, g.bb.x1);
        minY = Math.min(minY, g.bb.y1);
        maxX = Math.max(maxX, g.bb.x2);
        maxY = Math.max(maxY, g.bb.y2);
      }

      const cp = char.codePointAt(0);
      const isConsonant = cp >= 0x1780 && cp <= 0x17A2;
      const isVowel = (cp >= 0x17B6 && cp <= 0x17C5) || (cp >= 0x17A3 && cp <= 0x17B3);
      const isSubscript = cp === 0x17D2;
      const isDiacritic = cp >= 0x17C6 && cp <= 0x17D1 && cp !== 0x17D2;

      glyphsData.push({
        id: glyphsData.length,
        char: char,
        d: paths.join(" "),
        bb: { x1: minX, y1: minY, x2: maxX, y2: maxY },
        isConsonant,
        isVowel,
        isSubscript,
        isDiacritic,
        glyphCount: paths.length
      });

      console.log(`📝 Created: id=${glyphsData.length - 1}, char="${char}", ${paths.length} paths, type: ${isConsonant ? 'consonant' : isVowel ? 'vowel' : 'other'}`);
    }

    console.log(`\n✅ Final: ${glyphsData.length} clickable glyphs`);
    res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});

init()
  .then(() => app.listen(PORT, "0.0.0.0", () => console.log(`✅ Server on port ${PORT}`)))
  .catch((e) => { console.error("Init failed:", e); process.exit(1); });
