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

/**
 * Load harfbuzzjs factory robustly, preferring concrete entrypoints.
 */
async function loadHbFactory() {
  const attempts = [];
  const specs = [
    "harfbuzzjs/hbjs.js", // most explicit
    "harfbuzzjs/hbjs",
    "harfbuzzjs",
  ];

  function extractFactory(mod) {
    if (!mod) return null;
    if (typeof mod === "function") return mod;
    if (typeof mod.default === "function") return mod.default;
    if (typeof mod.hbjs === "function") return mod.hbjs;
    return null;
  }

  // Try require first
  for (const spec of specs) {
    try {
      // eslint-disable-next-line import/no-dynamic-require, global-require
      const mod = require(spec);
      const factory = extractFactory(mod);
      attempts.push(`require(${spec}) -> type=${typeof mod}, keys=${Object.keys(mod || {}).join(",")}`);
      if (factory) return { factory, attempts };
    } catch (e) {
      attempts.push(`require(${spec}) failed: ${e.message}`);
    }
  }

  // Fallback to dynamic import
  for (const spec of specs) {
    try {
      const mod = await import(spec);
      const factory = extractFactory(mod);
      attempts.push(`import(${spec}) -> type=${typeof mod}, keys=${Object.keys(mod || {}).join(",")}`);
      if (factory) return { factory, attempts };
    } catch (e) {
      attempts.push(`import(${spec}) failed: ${e.message}`);
    }
  }

  return { factory: null, attempts };
}

async function loadHbInstance() {
  // Primary path: package entrypoint already returns an initialized hb object.
  try {
    // eslint-disable-next-line global-require
    const hbPackage = require("harfbuzzjs");
    if (hbPackage && typeof hbPackage.then === "function") {
      return await hbPackage;
    }
    if (hbPackage && typeof hbPackage === "object") {
      return hbPackage;
    }
  } catch (e) {
    console.warn("harfbuzzjs package entrypoint failed:", e.message);
  }

  // Fallback: manually wire hb core module + hbjs wrapper.
  // eslint-disable-next-line global-require
  const createHbModule = require("harfbuzzjs/hb.js");
  const { factory, attempts } = await loadHbFactory();
  if (!factory) {
    throw new Error(
      `harfbuzzjs factory not found.\nAttempts:\n- ${attempts.join("\n- ")}`
    );
  }

  const moduleInstance = await createHbModule();
  return factory(moduleInstance);
}

async function init() {
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(`Font not found: ${FONT_PATH}`);
  }

  // Resolve wasm from installed package (node_modules), not project root.
  let hbWasmPath;
  let hbSubsetWasmPath;
  try {
    hbWasmPath = require.resolve("harfbuzzjs/hb.wasm");
    hbSubsetWasmPath = require.resolve("harfbuzzjs/hb-subset.wasm");
  } catch (e) {
    throw new Error(
      `Failed to resolve harfbuzz wasm files from node_modules: ${e.message}`
    );
  }

  if (!fs.existsSync(hbWasmPath)) {
    throw new Error(`hb.wasm not found at resolved path: ${hbWasmPath}`);
  }

  console.log("hb.wasm:", hbWasmPath);
  console.log("hb-subset.wasm:", hbSubsetWasmPath);

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

  try {
    const decodedText = decodeURIComponent(rawText);
    const text = decodedText.normalize("NFC");
    const scale = FONT_SIZE / unitsPerEm;

    const fontBuffer = fs.readFileSync(FONT_PATH);
    const fontBytes = toUint8ArrayExact(fontBuffer);

    const blob = hb.createBlob(fontBytes);
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

        // backward-compatible
        char: primaryChar,
        cluster: clusterStart,

        // cluster metadata
        clusterStart,
        clusterEnd,
        clusterText,
        chars,
        codePoints,
        primaryChar,

        // explicit markers
        hasCoeng,
        hasSubscriptConsonant,
        hasDependentVowel,
        hasDiacritic,

        // optional technical/meta
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

    console.log(`→ [${mode}] Sent ${glyphsData.length} glyphs for "${text}"`);
    res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
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
