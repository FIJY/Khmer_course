const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

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
  // base consonant first (U+1780..U+17A2), fallback to first char
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

// Build real cluster ranges from unique hb cluster offsets
function buildClusterRangesFromHb(text, hbOutput) {
  const offsets = new Set([0, text.length]);

  for (const g of hbOutput) {
    if (typeof g.cl === "number") {
      const clamped = Math.max(0, Math.min(text.length, g.cl));
      offsets.add(clamped);
    }
  }

  const sorted = Array.from(offsets).sort((a, b) => a - b);
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
    return {
      fontName:
        names.fontFamily?.en ||
        names.fullName?.en ||
        names.preferredFamily?.en ||
        null,
      fontVersion:
        names.version?.en ||
        names.uniqueID?.en ||
        null,
      unitsPerEm: ot?.unitsPerEm || null,
    };
  } catch {
    return { fontName: null, fontVersion: null, unitsPerEm: ot?.unitsPerEm || null };
  }
}

function toUint8ArrayExact(buffer) {
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
}
function toArrayBufferExact(uint8) {
  return uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);
}

function ensureHbApi(hbObj) {
  const required = [
    "createBlob",
    "createFace",
    "createFont",
    "createBuffer",
    "shape",
  ];
  const missing = required.filter((k) => typeof hbObj?.[k] !== "function");
  if (missing.length) {
    throw new Error(
      `HB API incomplete. Missing methods: ${missing.join(", ")}. ` +
      `Got keys: ${Object.keys(hbObj || {}).join(", ")}`
    );
  }
}

/**
 * Robust loader for harfbuzzjs across different package export styles.
 * We first try the package entrypoint (already initialized in some builds),
 * then fallback to hb.js + hbjs wrapper wiring.
 */
async function loadHbInstance() {
  // Path A: package entrypoint
  try {
    // eslint-disable-next-line global-require
    const pkg = require("harfbuzzjs");

    // some builds export Promise<HB>
    if (pkg && typeof pkg.then === "function") {
      const resolved = await pkg;
      ensureHbApi(resolved);
      console.log("HB loaded via require('harfbuzzjs') -> Promise");
      return resolved;
    }

    // some builds export HB object directly
    if (pkg && typeof pkg === "object") {
      ensureHbApi(pkg);
      console.log("HB loaded via require('harfbuzzjs') -> object");
      return pkg;
    }

    // some builds export factory function
    if (typeof pkg === "function") {
      const maybe = await pkg();
      ensureHbApi(maybe);
      console.log("HB loaded via require('harfbuzzjs') -> factory()");
      return maybe;
    }
  } catch (e) {
    console.warn("HB entrypoint load failed:", e.message);
  }

  // Path B: manual wiring hb.js + hbjs(.js)
  let createHbModule = null;
  const hbCoreSpecs = ["harfbuzzjs/hb.js", "harfbuzzjs/hb"];
  let hbCoreErr = null;
  for (const spec of hbCoreSpecs) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      createHbModule = require(spec);
      if (typeof createHbModule === "function") break;
      createHbModule = null;
    } catch (e) {
      hbCoreErr = e;
    }
  }

  if (!createHbModule) {
    throw new Error(
      `Failed to load HB core module (hb.js). Last error: ${hbCoreErr?.message || "unknown"}`
    );
  }

  let hbjsWrapper = null;
  const hbjsSpecs = ["harfbuzzjs/hbjs.js", "harfbuzzjs/hbjs"];
  let hbjsErr = null;
  for (const spec of hbjsSpecs) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const mod = require(spec);
      if (typeof mod === "function") {
        hbjsWrapper = mod;
        break;
      }
      if (typeof mod?.default === "function") {
        hbjsWrapper = mod.default;
        break;
      }
    } catch (e) {
      hbjsErr = e;
    }
  }

  if (!hbjsWrapper) {
    throw new Error(
      `Failed to load hbjs wrapper. Last error: ${hbjsErr?.message || "unknown"}`
    );
  }

  const moduleInstance = await createHbModule();
  const hbObj = hbjsWrapper(moduleInstance);
  ensureHbApi(hbObj);

  console.log("HB loaded via manual wiring: hb.js + hbjs.js");
  return hbObj;
}

async function init() {
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(`Font not found: ${FONT_PATH}`);
  }

  // Only diagnostics for wasm presence (no forced custom wasm injection).
  try {
    const hbWasmPath = require.resolve("harfbuzzjs/hb.wasm");
    const hbSubsetWasmPath = require.resolve("harfbuzzjs/hb-subset.wasm");
    console.log("hb.wasm:", hbWasmPath);
    console.log("hb-subset.wasm:", hbSubsetWasmPath);
  } catch (e) {
    console.warn("Could not resolve harfbuzz wasm files:", e.message);
  }

  hb = await loadHbInstance();

  const fontBuffer = fs.readFileSync(FONT_PATH);
  const fontBytes = toUint8ArrayExact(fontBuffer);
  otFont = opentype.parse(toArrayBufferExact(fontBytes));
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

  let blob = null;
  let face = null;
  let font = null;
  let buffer = null;

  try {
    const decodedText = decodeURIComponent(rawText);
    const text = decodedText.normalize("NFC");
    const scale = FONT_SIZE / unitsPerEm;

    const fontBuffer = fs.readFileSync(FONT_PATH);
    const fontBytes = toUint8ArrayExact(fontBuffer);

    blob = hb.createBlob(fontBytes);
    face = hb.createFace(blob, 0);
    font = hb.createFont(face);
    font.setScale(FONT_SIZE * unitsPerEm, FONT_SIZE * unitsPerEm);

    buffer = hb.createBuffer();
    buffer.addText(text);
    buffer.guessSegmentProperties();

    let featureString = "";
    if (mode === "split") {
      featureString = [
        "liga=0",
        "clig=0",
        "ccmp=0",
        "abvf=0",
        "abvs=0",
        "blwf=0",
        "pstf=0",
        "pref=0",
        "pres=0",
        "psts=0",
      ].join(",");
    }

    hb.shape(font, buffer, featureString);
    const hbOutput = buffer.json();

    if (!Array.isArray(hbOutput)) {
      throw new Error(`Invalid hb output type: ${typeof hbOutput}`);
    }

    const clusterRanges = buildClusterRangesFromHb(text, hbOutput);
    const fontInfo = getFontInfo(otFont);

    const glyphsData = [];
    let cursorX = 50;

    for (let i = 0; i < hbOutput.length; i += 1) {
      const out = hbOutput[i];

      try {
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

          // backward-compatible
          char: primaryChar,
          cluster: clusterStart,

          // REQUIRED new metadata
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

          // optional technical/meta
          hbGlyphId: glyphId,
          fontInfo, // includes fontName / fontVersion

          d,
          bb: bb ? { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 } : null,
          advance: (out.ax || 0) * scale,
          x,
          y,
        });

        cursorX += (out.ax || 0) * scale;
      } catch (glyphErr) {
        // Skip broken glyph but continue shaping result.
        console.error(`Glyph parse error at index ${i}:`, glyphErr);
        cursorX += ((out?.ax || 0) * (FONT_SIZE / unitsPerEm));
      }
    }

    console.log(`→ [${mode}] Sent ${glyphsData.length} glyphs for "${text}"`);
    return res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    return res.status(500).json({
      error: "Shape failed",
      message: err?.message || "Unknown error",
      // оставляем немного диагностики для фронта/логов
      details: {
        hasHb: !!hb,
        hasOtFont: !!otFont,
        text: req.query.text || "",
        mode: req.query.mode || "normal",
      },
    });
  } finally {
    try { buffer?.destroy?.(); } catch (_) {}
    try { font?.destroy?.(); } catch (_) {}
    try { face?.destroy?.(); } catch (_) {}
    try { blob?.destroy?.(); } catch (_) {}
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
