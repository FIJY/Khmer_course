const DEFAULT_SERIES_OVERRIDES = { aSeries: [], oSeries: [] };
const DEFAULT_DIACRITIC_GROUPS = { bantoc: [0x17cb], seriesSwitch: [0x17c9, 0x17ca] };

// Указываем пути ЖЕСТКО, чтобы они точно нашлись в public/vendor
const DEFAULT_MODULE_URLS = {
  harfbuzz: '/vendor/harfbuzzjs.js',
  harfbuzzWasm: '/vendor/harfbuzzjs.wasm', // Добавили явный путь к WASM
  opentype: '/vendor/opentype.module.js',
};

let hbInstance = null;
const fontCache = new Map();

// Загрузчик скриптов
async function loadHarfbuzz(moduleUrls) {
  if (hbInstance) return hbInstance;

  // 1. Загружаем JS
  if (!window.hbjs) {
      const script = document.createElement('script');
      script.src = moduleUrls.harfbuzz;
      await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = () => reject(new Error(`Failed to load ${moduleUrls.harfbuzz}`));
          document.head.appendChild(script);
      });
  }

  // 2. Инициализируем WASM
  const wasmResponse = await fetch(moduleUrls.harfbuzzWasm);
  if (!wasmResponse.ok) throw new Error("WASM not found");
  const wasmBuffer = await wasmResponse.arrayBuffer();

  // 3. Запускаем фабрику
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

// ГЛАВНАЯ ФУНКЦИЯ: Генерирует Векторные Данные для Слова
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
        charIndex: charIndex, // Какая это буква в строке (0, 1, 2...)
        char: text[charIndex], // Сама буква
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

export const khmerGlyphDefaults = { DEFAULT_MODULE_URLS };