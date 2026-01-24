const DEFAULT_MODULE_URLS = {
  harfbuzz: '/vendor/harfbuzzjs.js',
  harfbuzzWasm: '/vendor/harfbuzzjs.wasm',
  opentype: '/vendor/opentype.module.js',
};

// Хелперы для классификации (нужны для цветов)
const KHMER_RANGE = [0x1780, 0x17ff];
const KHMER_CONSONANT_RANGE = [0x1780, 0x17a2];
const KHMER_NUMERALS = [0x17e0, 0x17e9];
function isInRange(cp, [start, end]) { return cp >= start && cp <= end; }

function classifyCodepoint(cp) {
  if (!isInRange(cp, KHMER_RANGE)) return 'OTHER';
  if (isInRange(cp, KHMER_CONSONANT_RANGE)) return 'CONSONANT_O';
  if (isInRange(cp, KHMER_NUMERALS)) return 'NUMERAL';
  return 'OTHER'; // Остальное упрощаем
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

// ГЛАВНАЯ ФУНКЦИЯ
export async function getKhmerGlyphData({
  text,
  fontUrl,
  fontSize = 96,
  moduleUrls = DEFAULT_MODULE_URLS,
}) {
  try {
    // 1. Загружаем OpenType
    const opentypeModule = await import(/* @vite-ignore */ moduleUrls.opentype);
    const opentype = opentypeModule.default || opentypeModule;

    // 2. Загружаем HarfBuzz (через import, а не script tag!)
    const hbModule = await import(/* @vite-ignore */ moduleUrls.harfbuzz);
    const hbFactory = hbModule.default || hbModule;

    // 3. Грузим WASM
    const wasmResponse = await fetch(moduleUrls.harfbuzzWasm);
    if (!wasmResponse.ok) throw new Error("WASM not found");
    const wasmBuffer = await wasmResponse.arrayBuffer();
    const { instance } = await WebAssembly.instantiate(wasmBuffer);

    // 4. Инициализируем движок
    const hb = hbFactory(instance);

    // 5. Грузим шрифт
    const fontRes = await fetch(fontUrl);
    const fontBuffer = await fontRes.arrayBuffer();
    const font = opentype.parse(fontBuffer);

    // 6. Шейпинг (Превращаем текст в кривые)
    const blob = hb.createBlob(fontBuffer);
    const face = hb.createFace(blob, 0);
    const hbFont = hb.createFont(face);
    hbFont.setScale(font.unitsPerEm, font.unitsPerEm);

    const indexMap = buildUtf8IndexMap(text);
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

    // Чистим память
    buf.destroy(); hbFont.destroy(); face.destroy(); blob.destroy();

    return { viewBox: `0 0 ${width} ${height}`, width, height, paths };

  } catch (e) {
    console.warn("HarfBuzz Render Failed (using fallback):", e);
    return null; // Возвращаем null, чтобы компоненты включили Fallback режим
  }
}

// Для KhmerColoredText
export async function renderColoredKhmerToSvg(props) {
    const data = await getKhmerGlyphData(props);
    if (!data) return null; // Вернем null, компонент сам отрисует текст
    let svgContent = "";
    data.paths.forEach(p => {
       const charCode = p.char ? p.char.codePointAt(0) : 0;
       const category = classifyCodepoint(charCode);
       const fill = props.colors?.[category] || props.colors?.OTHER || "#ffffff";
       svgContent += `<path d="${p.d}" fill="${fill}" />`;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${data.viewBox}" width="${data.width}" height="${data.height}">${svgContent}</svg>`;
}

export const khmerGlyphDefaults = { DEFAULT_MODULE_URLS };