const DEFAULT_SERIES_OVERRIDES = {
  aSeries: [],
  oSeries: [],
};

const DEFAULT_DIACRITIC_GROUPS = {
  bantoc: [0x17cb],
  seriesSwitch: [0x17c9, 0x17ca],
};

const KHMER_RANGE = [0x1780, 0x17ff];
const KHMER_CONSONANT_RANGE = [0x1780, 0x17a2];
const KHMER_INDEPENDENT_VOWELS = [0x17a3, 0x17b5];
const KHMER_DEPENDENT_VOWELS = [0x17b6, 0x17c5];
const KHMER_DIACRITICS = [0x17c6, 0x17d3];
const KHMER_NUMERALS = [0x17e0, 0x17e9];

const DEFAULT_MODULE_URLS = {
  harfbuzz: '/vendor/harfbuzzjs.js',
  harfbuzzWasm: '/vendor/harfbuzzjs.wasm',
  opentype: '/vendor/opentype.module.js',
};

let hbInstance = null;
const scriptLoadCache = new Map();
const fontCache = new Map();

// --- Хелперы классификации (нужны для раскраски) ---
function isInRange(cp, [start, end]) {
  return cp >= start && cp <= end;
}

function classifyCodepoint(cp) {
  if (!isInRange(cp, KHMER_RANGE)) return 'OTHER';
  if (isInRange(cp, KHMER_NUMERALS)) return 'NUMERAL';
  if (cp === 0x17d7) return 'REPEAT';
  if (cp === 0x17d4 || cp === 0x17d5) return 'PUNCT';
  if (cp === 0x17d2) return 'SUBSCRIPT'; // Coeng
  if (isInRange(cp, KHMER_DEPENDENT_VOWELS)) return 'VOWEL_DEP';
  if (isInRange(cp, KHMER_INDEPENDENT_VOWELS)) return 'VOWEL_IND';
  if (isInRange(cp, KHMER_DIACRITICS)) return 'DIACRITIC_OTHER';
  if (isInRange(cp, KHMER_CONSONANT_RANGE)) return 'CONSONANT_O'; // Упрощенно, точнее через series overrides
  return 'OTHER';
}

function buildUtf8IndexMap(text) {
  const encoder = new TextEncoder();
  const byteToCp = new Map();
  let byteOffset = 0;
  let cpIndex = 0;
  for (const ch of text) {
    byteToCp.set(byteOffset, cpIndex);
    byteOffset += encoder.encode(ch).length;
    cpIndex += 1;
  }
  byteToCp.set(byteOffset, cpIndex);
  return { byteToCp, bytes: encoder.encode(text) };
}

// --- Загрузчики ---
async function loadHarfbuzz(moduleUrls) {
  if (hbInstance) return hbInstance;

  if (!window.hbjs) {
      if (typeof document === 'undefined') return null;
      const script = document.createElement('script');
      script.src = moduleUrls.harfbuzz;
      await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Failed load ${moduleUrls.harfbuzz}`));
          document.head.appendChild(script);
      });
  }

  const wasmResponse = await fetch(moduleUrls.harfbuzzWasm);
  if (!wasmResponse.ok) throw new Error("WASM file not found in /public/vendor/");
  const wasmBuffer = await wasmResponse.arrayBuffer();

  const { instance } = await WebAssembly.instantiate(wasmBuffer);
  hbInstance = window.hbjs(instance);
  return hbInstance;
}

async function loadOpenType(url) {
    if (window.opentype) return window.opentype;
    const module = await import(/* @vite-ignore */ url);
    window.opentype = module.default || module;
    return window.opentype;
}

async function loadFont(fontUrl, opentype) {
  if (fontCache.has(fontUrl)) return fontCache.get(fontUrl);
  const fontPromise = fetch(fontUrl)
    .then(r => r.arrayBuffer())
    .then(buffer => ({ buffer, font: opentype.parse(buffer) }));
  fontCache.set(fontUrl, fontPromise);
  return fontPromise;
}

// --- ГЛАВНАЯ ФУНКЦИЯ (Векторные данные) ---
export async function getKhmerGlyphData({
  text,
  fontUrl,
  fontSize = 96,
  moduleUrls = DEFAULT_MODULE_URLS,
}) {
  try {
    const opentype = await loadOpenType(moduleUrls.opentype);
    const hb = await loadHarfbuzz(moduleUrls);
    const { buffer, font } = await loadFont(fontUrl, opentype);

    const indexMap = buildUtf8IndexMap(text);
    const blob = hb.createBlob(buffer);
    const face = hb.createFace(blob, 0);
    const hbFont = hb.createFont(face);
    hbFont.setScale(font.unitsPerEm, font.unitsPerEm);

    const buf = hb.createBuffer();
    buf.addUtf8(indexMap.bytes);
    buf.guessSegmentProperties();
    hb.shape(hbFont, buf);

    const glyphs = buf.json();
    const scale = fontSize / font.unitsPerEm;
    let totalAdvance = 0;
    glyphs.forEach(g => totalAdvance += g.ax);

    const width = totalAdvance * scale;
    const height = fontSize * 1.6;
    const baseline = fontSize * 1.2;

    let cursorX = 0;
    const paths = [];

    glyphs.forEach((g) => {
      const otGlyph = font.glyphs.get(g.g);
      const charIndex = indexMap.byteToCp.get(g.cl) ?? -1;
      const path = otGlyph.getPath(cursorX + g.dx * scale, baseline - g.dy * scale, fontSize);

      paths.push({
        d: path.toPathData(2),
        charIndex: charIndex,
        char: text[charIndex],
        ax: g.ax * scale
      });
      cursorX += g.ax * scale;
    });

    buf.destroy(); hbFont.destroy(); face.destroy(); blob.destroy();

    return { viewBox: `0 0 ${width} ${height}`, width, height, paths };
  } catch (e) {
    console.error("Renderer Failed:", e);
    return null;
  }
}

// --- ФУНКЦИЯ ДЛЯ KHMER COLORED TEXT (Восстановленная) ---
export async function renderColoredKhmerToSvg(props) {
    const { text, colors = {} } = props;
    const data = await getKhmerGlyphData(props);
    if (!data) return "";

    let svgContent = "";

    data.paths.forEach(p => {
       const charCode = p.char ? p.char.codePointAt(0) : 0;
       const category = classifyCodepoint(charCode);
       const fill = colors[category] || colors.OTHER || "#ffffff";
       svgContent += `<path d="${p.d}" fill="${fill}" />`;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${data.viewBox}" width="${data.width}" height="${data.height}">${svgContent}</svg>`;
}

export const khmerGlyphDefaults = {
  DEFAULT_MODULE_URLS,
  DEFAULT_SERIES_OVERRIDES,
  DEFAULT_DIACRITIC_GROUPS,
};