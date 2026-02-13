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
    const scale = FONT_SIZE / unitsPerEm;
    const textChars = Array.from(text);

    console.log("\n=== SHAPING:", text);
    console.log("Text characters:", textChars.length);

    const glyphsData = [];
    let cursorX = 50;

    // ✅ RELIABLE APPROACH: Layout each character separately
    for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
      const char = textChars[charIdx];

      console.log(`\n📝 Character ${charIdx}: "${char}" (U+${char.codePointAt(0).toString(16).toUpperCase()})`);

      // Shape this single character
      const run = fkFont.layout(char);

      console.log(`  Fontkit returned ${run.glyphs.length} glyph(s)`);

      // Collect all paths for this character
      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let totalAdvance = 0;

      for (let i = 0; i < run.glyphs.length; i++) {
        const fkGlyph = run.glyphs[i];
        const position = run.positions[i];

        const otGlyph = otFont.glyphs.get(fkGlyph.id);

        const x = cursorX + position.xOffset * scale;
        const y = 200 - position.yOffset * scale;

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

        totalAdvance = Math.max(totalAdvance, position.xAdvance * scale);
      }

      if (paths.length > 0) {
        glyphsData.push({
          id: glyphsData.length,
          char: char,
          d: paths.join(" "),
          bb: { x1: minX, y1: minY, x2: maxX, y2: maxY }
        });

        console.log(`  ✅ Created glyph: id=${glyphsData.length - 1}, ${paths.length} paths`);
        console.log(`     bbox: [${minX.toFixed(1)}, ${minY.toFixed(1)} -> ${maxX.toFixed(1)}, ${maxY.toFixed(1)}]`);
        console.log(`     advance: ${totalAdvance.toFixed(1)}`);
      }

      cursorX += totalAdvance;
    }

    console.log(`\n✅ Final: ${glyphsData.length} clickable glyphs`);

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
