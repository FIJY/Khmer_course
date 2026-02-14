const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");
const fontkit = require("fontkit");

const app = express();
app.use(cors());

const PORT = Number(process.env.PORT) || 3001;
const FONT_PATH = path.join(__dirname, "public/fonts/KhmerOS_siemreap.ttf");
const FONT_SIZE = 120;

let hb = null;              // optional
let otFont = null;          // required
let fkFont = null;          // fallback
let unitsPerEm = 1000;
let shapingEngine = "unknown"; // "harfbuzz" | "fontkit"

// -------------------------
// Khmer helpers / ranges
// -------------------------
const KHMER_BASE_CONS_START = 0x1780;
const KHMER_BASE_CONS_END = 0x17a2;
const KHMER_DEP_VOWEL_START = 0x17b6;
const KHMER_DEP_VOWEL_END = 0x17c5;
const KHMER_COENG = 0x17d2;

function isBaseConsonant(cp) {
  return cp >= KHMER_BASE_CONS_START && cp <= KHMER_BASE_CONS_END;
}
function isDependentVowel(cp) {
  return cp >= KHMER_DEP_VOWEL_START && cp <= KHMER_DEP_VOWEL_END;
}
function isKhmerDiacriticOrSign(cp) {
  return (
    (cp >= 0x17c6 && cp <= 0x17d3) ||
    cp === 0x17dd ||
    (cp >= 0x17d4 && cp <= 0x17dc)
  );
}

function pickPrimaryChar(chars) {
  if (!chars || chars.length === 0) return "";
  const base = chars.find((ch) => isBaseConsonant(ch.codePointAt(0)));
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

  return { hasCoeng, hasSubscriptConsonant, hasDependentVowel, hasDiacritic };
}

function toUint8ArrayExact(buffer) {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
function toArrayBufferExact(uint8) {
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
}

function getFontInfo(ot, fk) {
  try {
    const names = ot?.names || {};
    return {
      fontName:
        names.fontFamily?.en ||
        names.fullName?.en ||
        fk?.familyName ||
        null,
      fontVersion:
        names.version?.en ||
        names.uniqueID?.en ||
        null,
      unitsPerEm: ot?.unitsPerEm || fk?.unitsPerEm || null,
    };
  } catch {
    return {
      fontName: fk?.familyName || null,
      fontVersion: null,
      unitsPerEm: ot?.unitsPerEm || fk?.unitsPerEm || null,
    };
  }
}

// -------------------------
// HarfBuzz loading (best effort)
// -------------------------
function ensureHbApi(hbObj) {
  const required = ["createBlob", "createFace", "createFont", "createBuffer", "shape"];
  const missing = required.filter((k) => typeof hbObj?.[k] !== "function");
  if (missing.length) {
    throw new Error(
      `HB API incomplete. Missing: ${missing.join(", ")}. Keys: ${Object.keys(hbObj || {}).join(",")}`
    );
  }
}

async function tryLoadHarfBuzz() {
  // 1) package entrypoint
  try {
    // eslint-disable-next-line global-require
    const pkg = require("harfbuzzjs");

    if (pkg && typeof pkg.then === "function") {
      const resolved = await pkg;
      ensureHbApi(resolved);
      return resolved;
    }
    if (pkg && typeof pkg === "object") {
      ensureHbApi(pkg);
      return pkg;
    }
    if (typeof pkg === "function") {
      const v = await pkg();
      ensureHbApi(v);
      return v;
    }
  } catch (e) {
    console.warn("[HB] entrypoint failed:", e.message);
  }

  // 2) manual wiring
  try {
    // eslint-disable-next-line global-require
    const createHbModule = require("harfbuzzjs/hb.js");
    // eslint-disable-next-line global-require
    const hbjsWrapMod = require("harfbuzzjs/hbjs.js");
    const hbjsWrap =
      typeof hbjsWrapMod === "function"
        ? hbjsWrapMod
        : typeof hbjsWrapMod?.default === "function"
          ? hbjsWrapMod.default
          : null;

    if (!hbjsWrap) throw new Error("hbjs wrapper is not a function");

    const mod = await createHbModule();
    const obj = hbjsWrap(mod);
    ensureHbApi(obj);
    return obj;
  } catch (e) {
    console.warn("[HB] manual wiring failed:", e.message);
  }

  return null;
}

// -------------------------
// Cluster helpers for HB result
// -------------------------
function buildClusterRangesFromHb(text, hbOutput) {
  const offsets = new Set([0, text.length]);
  for (const g of hbOutput) {
    if (typeof g.cl === "number") {
      offsets.add(Math.max(0, Math.min(text.length, g.cl)));
    }
  }
  const sorted = Array.from(offsets).sort((a, b) => a - b);
  const ranges = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const s = sorted[i];
    const e = sorted[i + 1];
    if (e > s) ranges.push([s, e]);
  }
  return ranges;
}

function findClusterEnd(clusterStart, clusterRanges, textLength) {
  for (const [s, e] of clusterRanges) {
    if (s === clusterStart) return e;
  }
  return textLength;
}

// -------------------------
// Engine implementations
// -------------------------
function shapeWithHarfBuzz(text, mode) {
  const scale = FONT_SIZE / unitsPerEm;
  const fontBuffer = fs.readFileSync(FONT_PATH);
  const fontBytes = toUint8ArrayExact(fontBuffer);

  let blob = null;
  let face = null;
  let font = null;
  let buffer = null;

  try {
    blob = hb.createBlob(fontBytes);
    face = hb.createFace(blob, 0);
    font = hb.createFont(face);
    font.setScale(FONT_SIZE * unitsPerEm, FONT_SIZE * unitsPerEm);

    buffer = hb.createBuffer();
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
    if (!Array.isArray(hbOutput)) throw new Error("HB returned non-array json");

    const clusterRanges = buildClusterRangesFromHb(text, hbOutput);
    const fontInfo = getFontInfo(otFont, fkFont);

    const glyphsData = [];
    let cursorX = 50;

    for (let i = 0; i < hbOutput.length; i += 1) {
      const out = hbOutput[i];
      const glyphId = out.g;

      const x = cursorX + (out.dx || 0) * scale;
      const y = 200 - (out.dy || 0) * scale;
      const advance = (out.ax || 0) * scale;

      const otGlyph = otFont.glyphs.get(glyphId);
      if (!otGlyph) {
        cursorX += advance;
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
      const flags = detectClusterFlags(codePoints);

      glyphsData.push({
        id: i,
        glyphIdx: i,

        // backward compatibility
        char: primaryChar,
        cluster: clusterStart,

        // enriched metadata
        clusterStart,
        clusterEnd,
        clusterText,
        chars,
        codePoints,
        primaryChar,

        hasCoeng: flags.hasCoeng,
        hasSubscriptConsonant: flags.hasSubscriptConsonant,
        hasDependentVowel: flags.hasDependentVowel,
        hasDiacritic: flags.hasDiacritic,

        hbGlyphId: glyphId,
        fontInfo,

        d,
        bb: bb ? { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 } : null,
        advance,
        x,
        y,
      });

      cursorX += advance;
    }

    return glyphsData;
  } finally {
    try { buffer?.destroy?.(); } catch (_) {}
    try { font?.destroy?.(); } catch (_) {}
    try { face?.destroy?.(); } catch (_) {}
    try { blob?.destroy?.(); } catch (_) {}
  }
}

function shapeWithFontkit(text) {
  // fallback engine: no full HB cluster intelligence, but stable + no 500
  const run = fkFont.layout(text);
  const scale = FONT_SIZE / (fkFont.unitsPerEm || 1000);
  const fontInfo = getFontInfo(otFont, fkFont);

  const glyphsData = [];
  let cursorX = 50;

  // Use glyph i -> character i fallback cluster mapping
  // not perfect for complex script, but keeps UI alive.
  for (let i = 0; i < run.glyphs.length; i += 1) {
    const g = run.glyphs[i];
    const pos = run.positions[i] || { xAdvance: 0, xOffset: 0, yOffset: 0 };

    const x = cursorX + (pos.xOffset || 0) * scale;
    const y = 200 - (pos.yOffset || 0) * scale;
    const advance = (pos.xAdvance || 0) * scale;

    // Build path through opentype glyph id when possible
    const glyphId = g.id;
    const otGlyph = otFont.glyphs.get(glyphId);
    if (!otGlyph) {
      cursorX += advance;
      continue;
    }

    const pathObj = otGlyph.getPath(x, y, FONT_SIZE);
    const d = pathObj.toPathData(3);
    const bb = pathObj.getBoundingBox();

    const clusterStart = Math.min(i, text.length);
    const clusterEnd = Math.min(i + 1, text.length);
    const clusterText = text.slice(clusterStart, clusterEnd);
    const chars = Array.from(clusterText);
    const codePoints = chars.map((c) => c.codePointAt(0));
    const primaryChar = pickPrimaryChar(chars);
    const flags = detectClusterFlags(codePoints);

    glyphsData.push({
      id: i,
      glyphIdx: i,

      char: primaryChar,
      cluster: clusterStart,

      clusterStart,
      clusterEnd,
      clusterText,
      chars,
      codePoints,
      primaryChar,

      hasCoeng: flags.hasCoeng,
      hasSubscriptConsonant: flags.hasSubscriptConsonant,
      hasDependentVowel: flags.hasDependentVowel,
      hasDiacritic: flags.hasDiacritic,

      hbGlyphId: glyphId, // keep field for compatibility
      fontInfo,

      d,
      bb: bb ? { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 } : null,
      advance,
      x,
      y,
    });

    cursorX += advance;
  }

  return glyphsData;
}

// -------------------------
// Init
// -------------------------
async function init() {
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(`Font not found: ${FONT_PATH}`);
  }

  const fontBuffer = fs.readFileSync(FONT_PATH);
  const fontBytes = toUint8ArrayExact(fontBuffer);

  otFont = opentype.parse(toArrayBufferExact(fontBytes));
  fkFont = fontkit.openSync(FONT_PATH);
  unitsPerEm = otFont.unitsPerEm || fkFont.unitsPerEm || 1000;

  // Try HB, but do not die if it fails
  hb = await tryLoadHarfBuzz();
  if (hb) {
    shapingEngine = "harfbuzz";
    console.log("✅ Shaping engine: harfbuzz");
  } else {
    shapingEngine = "fontkit";
    console.warn("⚠️ HarfBuzz unavailable, fallback shaping engine: fontkit");
  }

  console.log("✅ Fonts loaded.");
}

app.get("/", (req, res) => res.send("OK"));
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    shapingEngine,
    hasHb: !!hb,
    hasOtFont: !!otFont,
    hasFontkit: !!fkFont,
  });
});

app.get("/api/shape", async (req, res) => {
  const rawText = req.query.text;
  const mode = req.query.mode || "normal";

  if (!rawText) return res.status(400).json({ error: "No text provided" });
  if (!otFont || !fkFont) return res.status(503).json({ error: "Fonts not ready" });

  try {
    const decodedText = decodeURIComponent(rawText);
    const text = decodedText.normalize("NFC");

    let glyphsData;
    let engineUsed = shapingEngine;

    if (hb) {
      try {
        glyphsData = shapeWithHarfBuzz(text, mode);
        engineUsed = "harfbuzz";
      } catch (hbErr) {
        console.error("HB shape failed, fallback to fontkit:", hbErr);
        glyphsData = shapeWithFontkit(text);
        engineUsed = "fontkit";
      }
    } else {
      glyphsData = shapeWithFontkit(text);
      engineUsed = "fontkit";
    }

    res.setHeader("X-Shaping-Engine", engineUsed);
    return res.json(glyphsData);
  } catch (err) {
    console.error("Shape fatal error:", err);
    return res.status(500).json({
      error: "Shape failed",
      message: err?.message || "Unknown error",
      details: {
        hasHb: !!hb,
        shapingEngine,
        text: req.query.text || "",
        mode: req.query.mode || "normal",
      },
    });
  }
});

init()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server on port ${PORT}`);
    });
  })
  .catch((e) => {
    console.error("Init failed:", e);
    process.exit(1);
  });
