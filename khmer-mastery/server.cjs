// server.cjs
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fontkit = require("fontkit");     // shaping
const opentype = require("opentype.js"); // rendering

const app = express();
app.use(cors());

// ✅ Render expects you to listen on process.env.PORT
const PORT = Number(process.env.PORT) || 3001;

// ---- Paths / constants ----
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const FONT_SIZE = 120;

const COENG = 0x17d2;
const KHMER_CONSONANT_START = 0x1780;
const KHMER_CONSONANT_END = 0x17a2;

// ---- Helpers ----
function shouldForceSplit(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  const splitList = [0x17b6, 0x17c1, 0x17c2, 0x17c3, 0x17c4, 0x17c5];
  return splitList.includes(code);
}

function isKhmerConsonantCodePoint(cp) {
  return cp >= KHMER_CONSONANT_START && cp <= KHMER_CONSONANT_END;
}

function resolveCharFromCodePoints(codePoints = []) {
  if (!Array.isArray(codePoints) || codePoints.length === 0) return "";

  const consonant = codePoints.find((cp) => isKhmerConsonantCodePoint(cp));
  if (consonant) return String.fromCodePoint(consonant);

  const nonCoeng = codePoints.find((cp) => cp !== COENG);
  if (nonCoeng) return String.fromCodePoint(nonCoeng);

  return String.fromCodePoint(codePoints[0]);
}

function findNextConsonantAfterCoeng(textChars, startIndex) {
  let coengIndex = -1;
  for (let i = startIndex; i < textChars.length; i++) {
    if (textChars[i].codePointAt(0) === COENG) {
      coengIndex = i;
      break;
    }
  }

  const searchStart = coengIndex >= 0 ? coengIndex + 1 : startIndex;
  for (let i = searchStart; i < textChars.length; i++) {
    if (isKhmerConsonantCodePoint(textChars[i].codePointAt(0))) {
      return { char: textChars[i], index: i };
    }
  }

  return { char: "", index: -1 };
}

// ---- Font state ----
let fkFont = null; // fontkit instance
let otFont = null; // opentype instance
let unitsPerEm = 1000;

async function init() {
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(`Font not found: ${FONT_PATH}`);
  }

  // fontkit (sync)
  fkFont = fontkit.openSync(FONT_PATH);
  unitsPerEm = fkFont.unitsPerEm || 1000;

  // opentype parse — safer to pass Buffer directly (not .buffer)
  const fontBuffer = fs.readFileSync(FONT_PATH);

  // Buffer -> exact ArrayBuffer slice (важно!)
  const arrayBuffer = fontBuffer.buffer.slice(
    fontBuffer.byteOffset,
    fontBuffer.byteOffset + fontBuffer.byteLength
  );

  otFont = opentype.parse(arrayBuffer);

  console.log("✅ Fonts loaded. Shaping engine ready.");
}

// ---- Health routes (so / is not 404) ----
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
    let cursorX = 50;
    const glyphsData = [];

    const textChars = Array.from(text);
    let textIndex = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const fkGlyph = run.glyphs[i];
      const position = run.positions[i];

      const codePoints = fkGlyph.codePoints || [];

      // Convert fontkit glyph id -> opentype glyph for path rendering
      const otGlyph = otFont.glyphs.get(fkGlyph.id);

      const x = cursorX + position.xOffset * scale;
      const y = 200 - position.yOffset * scale; // SVG Y flip

      const p = otGlyph.getPath(x, y, FONT_SIZE);
      const d = p.toPathData(3);

      // Determine "char" for audio mapping / logic
      let char = resolveCharFromCodePoints(codePoints);

      if (char === String.fromCodePoint(COENG)) {
        const { char: fallbackChar, index } = findNextConsonantAfterCoeng(textChars, textIndex);
        if (fallbackChar) {
          char = fallbackChar;
          textIndex = index + 1;
        }
      } else if (char) {
        const nextIndex = textChars.indexOf(char, textIndex);
        if (nextIndex !== -1) textIndex = nextIndex + 1;
      }

      // Force split for certain vowels (Ka + Aa etc.)
      if (codePoints.length > 1 && shouldForceSplit(String.fromCharCode(codePoints[1]))) {
        const baseChar = String.fromCharCode(codePoints[0]);
        const vowelChar = String.fromCharCode(codePoints[1]);

        // 1) base
        const baseOtGlyph = otFont.charToGlyph(baseChar);
        const basePath = baseOtGlyph.getPath(cursorX, 200, FONT_SIZE);
        const baseAdv = baseOtGlyph.advanceWidth * scale;

        glyphsData.push({
          id: glyphsData.length,
          char: baseChar,
          d: basePath.toPathData(3),
          bb: basePath.getBoundingBox(),
        });

        // 2) vowel
        const vowelOtGlyph = otFont.charToGlyph(vowelChar);
        const vowelPath = vowelOtGlyph.getPath(cursorX + baseAdv, 200, FONT_SIZE);
        const vowelAdv = vowelOtGlyph.advanceWidth * scale;

        glyphsData.push({
          id: glyphsData.length,
          char: vowelChar,
          d: vowelPath.toPathData(3),
          bb: vowelPath.getBoundingBox(),
        });

        cursorX += baseAdv + vowelAdv;
        continue;
      }

      if (d && d.length > 5) {
        glyphsData.push({
          id: glyphsData.length,
          char,
          d,
          bb: p.getBoundingBox(),
        });
      }

      cursorX += position.xAdvance * scale;
    }

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
