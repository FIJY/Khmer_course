const DEFAULT_MODULE_URLS = {
  harfbuzz: '/vendor/harfbuzzjs.js',
  opentype: '/vendor/opentype.module.js',
};

const KHMER_RANGE = [0x1780, 0x17ff];
const KHMER_CONSONANT_RANGE = [0x1780, 0x17a2];
const KHMER_NUMERALS = [0x17e0, 0x17e9];

function isInRange(cp, [start, end]) { return cp >= start && cp <= end; }

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
    // 1. Загружаем OpenType через import
    const opentypeModule = await import(/* @vite-ignore */ moduleUrls.opentype);
    const opentype = opentypeModule.default || opentypeModule;

    // 2. Загружаем HarfBuzz через import (это лечит ошибку 'export')
    const hbModule = await import(/* @vite-ignore */ moduleUrls.harfbuzz);
    const hbFactory = hbModule.default || hbModule;
    const hb = await hbFactory();

    // 4. Грузим шрифт
    const fontRes = await fetch(fontUrl);
    const fontBuffer = await fontRes.arrayBuffer();
    const font = opentype.parse(fontBuffer);

    // 6. Шейпинг
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

    // Считаем общую ширину с учетом всех глифов
    glyphs.forEach(g => totalAdvance += g.ax);

    // Немного магии для высоты, чтобы диакритика влезала
    const width = totalAdvance * scale;
    const height = fontSize * 1.8;
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
    console.error("HarfBuzz CRASH:", e);
    return null;
  }
}

// Для совместимости
export async function renderColoredKhmerToSvg(props) {
    return ""; // Пока не используем старый рендер
}

export const khmerGlyphDefaults = { DEFAULT_MODULE_URLS };
