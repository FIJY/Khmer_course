const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");
const hbjs = require("harfbuzzjs");

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const FONT_SIZE = 120;

let hb = null;
let otFont = null;
let unitsPerEm = 1000;

// -------------------------
// Khmer helpers / ranges
// -------------------------
const KHMER_BASE_CONS_START = 0x1780;
const KHMER_BASE_CONS_END = 0x17a2;
const KHMER_DEP_VOWEL_START = 0x17b6;
const KHMER_DEP_VOWEL_END = 0x17c5;
const KHMER_COENG = 0x17d2;

// Khmer signs/diacritics (covers common combining marks and signs in Khmer block)
function isKhmerDiacriticOrSign(cp) {
  // Vowel inherents / diacritics / signs / punctuation in Khmer block (pragmatic range)
  // Includes 17C6..17D3 and 17DD plus Khmer symbols/punct often treated as signs.
  return (
    (cp >= 0x17c6 && cp <= 0x17d3) ||
    cp === 0x17dd ||
    (cp >= 0x17d4 && cp <= 0x17dc) ||
    (cp >= 0x17e0 && cp <= 0x17e9)
  );
}

function isBaseConsonant(cp) {
  return cp >= KHMER_BASE_CONS_START && cp <= KHMER_BASE_CONS_END;
}

function isDependentVowel(cp) {
  return cp >= KHMER_DEP_VOWEL_START && cp <= KHMER_DEP_VOWEL_END;
}

function pickPrimaryChar(chars) {
  if (!chars || chars.length === 0) return "";
  const base = chars.find((ch) => {
    const cp = ch.codePointAt(0);
    return isBaseConsonant(cp);
  });
  return base || chars[0];
}

function detectClusterFlags(codePoints) {
  let hasCoeng = false;
  let hasDependentVowel = false;
  let hasDiacritic = false;
  let hasSubscriptConsonant = false;

  for (let i = 0; i < codePoints.length; i += 1) {
    const cp = codePoints[i];

    if (cp === KHMER_COENG) {
      hasCoeng = true;
      const next = codePoints[i + 1];
      if (typeof next === "number" && isBaseConsonant(next)) {
        hasSubscriptConsonant = true;
      }
    }

    if (isDependentVowel(cp)) hasDependentVowel = true;
    if (isKhmerDiacriticOrSign(cp)) hasDiacritic = true;
  }

  return {
    hasCoeng,
    hasSubscriptConsonant,
    hasDependentVowel,
    hasDiacritic,
  };
}

// Build robust cluster boundaries from ALL hb cluster offsets.
// This avoids relying on "next glyph cl" only.
function buildClusterRangesFromHb(text, hbOutput) {
  const offsets = new Set([0, text.length]);

  for (const g of hbOutput) {
    if (typeof g.cl === "number") {
      // Clamp to valid range just in case
      const clamped = Math.max(0, Math.min(text.length, g.cl));
      offsets.add(clamped);
    }
  }

  const sorted = Array.from(offsets).sort((a, b) => a - b);

  // ranges: [start, end)
  const ranges = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const start = sorted[i];
    const end = sorted[i + 1];
    if (end > start) ranges.push([start, end]);
  }

  return ranges;
}

function findClusterEnd(clusterStart, clusterRanges, textLength) {
  for (const [start, end] of clusterRanges) {
    if (start === clusterStart) return end;
  }
  return textLength;
}

function getFontInfo(ot) {
  try {
    const names = ot?.names || {};
    const fontFamily =
      names.fontFamily?.en ||
      names.fullName?.en ||
      names.preferredFamily?.en ||
      null;
    const version =
      names.version?.en ||
      names.uniqueID?.en ||
      null;

    return {
      fontName: fontFamily,
      fontVersion: version,
      unitsPerEm: ot?.unitsPerEm || null,
    };
  } catch {
    return {
      fontName: null,
      fontVersion: null,
      unitsPerEm: ot?.unitsPerEm || null,
    };
  }
}

async function init() {
  if (!fs.existsSync(FONT_PATH)) throw new Error(`Font not found: ${FONT_PATH}`);

  hb = await hbjs();

  const fontBuffer = fs.readFileSync(FONT_PATH);
  // Keep robust buffer view for opentype parse
  const arr = new Uint8Array(
    fontBuffer.buffer,
    fontBuffer.byteOffset,
    fontBuffer.byteLength
  );
  otFont = opentype.parse(arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength));
  unitsPerEm = otFont.unitsPerEm || 1000;

  console.log("✅ HarfBuzz + OpenType fonts loaded.");
}

app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => res.send("OK"));

app.get("/api/shape", async (req, res) => {
  const rawText = req.query.text;
  const mode = req.query.mode || "normal";

  if (!rawText) return res.status(400).json({ error: "No text provided" });
  if (!hb || !otFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const decodedText = decodeURIComponent(rawText);
    const text = decodedText.normalize("NFC");
    const scale = FONT_SIZE / unitsPerEm;

    const fontData = fs.readFileSync(FONT_PATH);
    const blob = hb.createBlob(fontData.buffer);
    const face = hb.createFace(blob, 0);
    const font = hb.createFont(face);
    font.setScale(FONT_SIZE * unitsPerEm, FONT_SIZE * unitsPerEm);

    const buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();

    let features = [];
    if (mode === "split") {
      features = [
        { tag: "liga", value: 0 },
        { tag: "clig", value: 0 },
        { tag: "ccmp", value: 0 },
        { tag: "abvf", value: 0 },
        { tag: "abvs", value: 0 },
        { tag: "blwf", value: 0 },
        { tag: "pstf", value: 0 },
        { tag: "pref", value: 0 },
        { tag: "pres", value: 0 },
        { tag: "psts", value: 0 },
      ];
    }

    hb.shape(font, buffer, features);
    const hbOutput = buffer.json();

    const clusterRanges = buildClusterRangesFromHb(text, hbOutput);
    const fontInfo = getFontInfo(otFont);

    const glyphsData = [];
    let cursorX = 50;

    for (let i = 0; i < hbOutput.length; i += 1) {
      const out = hbOutput[i];
      const glyphId = out.g;

      const x = cursorX + (out.dx || 0) * scale;
      const y = 200 - (out.dy || 0) * scale;

      const otGlyph = otFont.glyphs.get(glyphId);
      if (!otGlyph) {
        cursorX += (out.ax || 0) * scale;
        continue;
      }

      const pathObj = otGlyph.getPath(x, y, FONT_SIZE);
      const d = pathObj.toPathData(3);
      const bb = pathObj.getBoundingBox();

      const clusterStart = typeof out.cl === "number" ? out.cl : 0;
      const clusterEnd = findClusterEnd(clusterStart, clusterRanges, text.length);

      const clusterText = text.slice(clusterStart, clusterEnd);
      const chars = Array.from(clusterText);
      const codePoints = chars.map((c) => c.codePointAt(0));
      const primaryChar = pickPrimaryChar(chars);

      const {
        hasCoeng,
        hasSubscriptConsonant,
        hasDependentVowel,
        hasDiacritic,
      } = detectClusterFlags(codePoints);

      glyphsData.push({
        id: i,
        glyphIdx: i,

        // legacy-compatible fields
        char: primaryChar,
        cluster: clusterStart,

        // requested metadata
        clusterStart,
        clusterEnd,
        clusterText,
        chars,
        codePoints,
        primaryChar,

        hasCoeng,
        hasSubscriptConsonant,
        hasDependentVowel,
        hasDiacritic,

        hbGlyphId: glyphId,
        fontInfo,

        d,
        bb: bb ? { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 } : null,
        advance: (out.ax || 0) * scale,
        x,
        y,
      });

      cursorX += (out.ax || 0) * scale;
    }

    buffer.destroy();
    font.destroy();
    face.destroy();
    blob.destroy();

    console.log(`→ [${mode}] Отправлено ${glyphsData.length} глифов для "${text}"`);
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
