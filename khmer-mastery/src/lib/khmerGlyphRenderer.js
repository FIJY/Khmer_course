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
  opentype: '/vendor/opentype.module.js',
};

let hbPromise = null;
const scriptLoadCache = new Map();
const fontCache = new Map();

function isInRange(cp, [start, end]) {
  return cp >= start && cp <= end;
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

  return {
    byteToCp,
    bytes: encoder.encode(text),
    cpCount: cpIndex,
    byteLength: byteOffset,
  };
}

function buildSeriesSets(seriesOverrides = DEFAULT_SERIES_OVERRIDES) {
  const aSeries = new Set(seriesOverrides.aSeries ?? []);
  const oSeries = new Set(seriesOverrides.oSeries ?? []);
  return { aSeries, oSeries };
}

function buildDiacriticSets(groups = DEFAULT_DIACRITIC_GROUPS) {
  return {
    bantoc: new Set(groups.bantoc ?? DEFAULT_DIACRITIC_GROUPS.bantoc),
    seriesSwitch: new Set(groups.seriesSwitch ?? DEFAULT_DIACRITIC_GROUPS.seriesSwitch),
  };
}

function classifyCodepoint(cp, seriesSets, diacriticSets) {
  if (!isInRange(cp, KHMER_RANGE)) return 'OTHER';

  if (isInRange(cp, KHMER_NUMERALS)) return 'NUMERAL';
  if (cp === 0x17d7) return 'REPEAT';
  if (cp === 0x17d4 || cp === 0x17d5) return 'PUNCT';
  if (cp === 0x17d2) return 'SUBSCRIPT';

  if (isInRange(cp, KHMER_DEPENDENT_VOWELS)) return 'VOWEL_DEP';
  if (isInRange(cp, KHMER_INDEPENDENT_VOWELS)) return 'VOWEL_IND';

  if (isInRange(cp, KHMER_DIACRITICS)) {
    if (diacriticSets.bantoc.has(cp)) return 'DIACRITIC_BANTOC';
    if (diacriticSets.seriesSwitch.has(cp)) return 'DIACRITIC_SERIES_SWITCH';
    return 'DIACRITIC_OTHER';
  }

  if (isInRange(cp, KHMER_CONSONANT_RANGE)) {
    if (seriesSets.aSeries.has(cp)) return 'CONSONANT_A';
    if (seriesSets.oSeries.has(cp)) return 'CONSONANT_O';
    return 'CONSONANT_O';
  }

  return 'OTHER';
}

function classifyText(text, seriesSets, diacriticSets) {
  const categories = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp == null) {
      categories.push('OTHER');
      continue;
    }
    categories.push(classifyCodepoint(cp, seriesSets, diacriticSets));
  }
  return categories;
}

function applySeriesSwitches(text, categories, clusters, byteToCp, byteLength, diacriticSets) {
  if (!clusters.length) return categories;

  const codepoints = Array.from(text, (ch) => ch.codePointAt(0) ?? 0);
  const clusterStarts = clusters.map((cluster) => cluster);
  const updated = [...categories];

  for (let i = 0; i < clusterStarts.length; i += 1) {
    const clusterStart = clusterStarts[i];
    const clusterEnd = clusterStarts[i + 1] ?? byteLength;
    const startCpIndex = byteToCp.get(clusterStart) ?? 0;
    const endCpIndex = byteToCp.get(clusterEnd) ?? categories.length;

    let hasSeriesSwitch = false;
    for (let cpIndex = startCpIndex; cpIndex < endCpIndex; cpIndex += 1) {
      if (diacriticSets.seriesSwitch.has(codepoints[cpIndex])) {
        hasSeriesSwitch = true;
        break;
      }
    }

    if (!hasSeriesSwitch) continue;

    for (let cpIndex = endCpIndex - 1; cpIndex >= startCpIndex; cpIndex -= 1) {
      if (updated[cpIndex] === 'CONSONANT_A') {
        updated[cpIndex] = 'CONSONANT_O';
        break;
      }
      if (updated[cpIndex] === 'CONSONANT_O') {
        updated[cpIndex] = 'CONSONANT_A';
        break;
      }
    }
  }

  return updated;
}

function loadScript(url) {
  if (scriptLoadCache.has(url)) return scriptLoadCache.get(url);

  const promise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Script loading is only supported in the browser.'));
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    document.head.appendChild(script);
  });

  scriptLoadCache.set(url, promise);
  return promise;
}

function getHbFactory(mod) {
  return (
    mod?.default
    ?? mod?.hbjs
    ?? mod
    ?? globalThis.hbjs
    ?? globalThis.hbjs?.default
  );
}

async function loadHarfbuzz(moduleUrl) {
  if (!hbPromise) {
    hbPromise = import(/* @vite-ignore */ moduleUrl)
      .then((mod) => {
        const factory = getHbFactory(mod);
        if (typeof factory !== 'function') {
          throw new Error('HarfBuzz module did not expose a factory function.');
        }
        return factory();
      })
      .catch(async () => {
        await loadScript(moduleUrl);
        const factory = getHbFactory();
        if (typeof factory !== 'function') {
          throw new Error('HarfBuzz module did not expose a factory function.');
        }
        return factory();
      });
  }
  return hbPromise;
}

async function loadOpenType(moduleUrl) {
  try {
    const module = await import(/* @vite-ignore */ moduleUrl);
    return module.default ?? module;
  } catch (error) {
    await loadScript(moduleUrl);
    if (globalThis.opentype) return globalThis.opentype;
    throw error;
  }
}

async function loadFont(fontUrl, opentype) {
  if (fontCache.has(fontUrl)) return fontCache.get(fontUrl);

  const fontPromise = fetch(fontUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch font: ${response.status}`);
      return response.arrayBuffer();
    })
    .then((buffer) => ({
      buffer,
      font: opentype.parse(buffer),
    }));

  fontCache.set(fontUrl, fontPromise);
  return fontPromise;
}

export async function renderColoredKhmerToSvg({
  text,
  fontUrl,
  fontSize = 96,
  colors = {},
  padding = 16,
  seriesOverrides = DEFAULT_SERIES_OVERRIDES,
  diacriticOverrides = DEFAULT_DIACRITIC_GROUPS,
  moduleUrls = DEFAULT_MODULE_URLS,
}) {
  if (!text || !fontUrl) return '';

  const [hb, opentype] = await Promise.all([
    loadHarfbuzz(moduleUrls.harfbuzz),
    loadOpenType(moduleUrls.opentype),
  ]);

  const { buffer, font } = await loadFont(fontUrl, opentype);
  const indexMap = buildUtf8IndexMap(text);
  const seriesSets = buildSeriesSets(seriesOverrides);
  const diacriticSets = buildDiacriticSets(diacriticOverrides);
  const categories = classifyText(text, seriesSets, diacriticSets);

  const face = hb.createFace(buffer);
  const hbFont = hb.createFont(face);
  hbFont.setScale(font.unitsPerEm, font.unitsPerEm);

  const buf = hb.createBuffer();
  buf.addUtf8(indexMap.bytes);
  buf.guessSegmentProperties();
  hb.shape(hbFont, buf);

  const glyphData = buf.json();
  const glyphs = glyphData.glyphs || [];
  const clusters = glyphs.map((glyph) => glyph.cl);
  const finalCategories = applySeriesSwitches(
    text,
    categories,
    clusters,
    indexMap.byteToCp,
    indexMap.byteLength,
    diacriticSets,
  );

  const scale = fontSize / font.unitsPerEm;
  let advance = 0;
  glyphs.forEach((glyph) => {
    advance += glyph.ax;
  });

  const width = padding * 2 + advance * scale + 2;
  const height = Math.ceil(fontSize * 1.6) + padding * 2;
  const baseline = padding + fontSize * 1.15;

  let x = padding;
  let paths = '';

  glyphs.forEach((glyph) => {
    const otGlyph = font.glyphs.get(glyph.g);
    const cpIndex = indexMap.byteToCp.get(glyph.cl) ?? 0;
    const category = finalCategories[cpIndex] ?? 'OTHER';
    const fill = colors?.[category] ?? colors?.OTHER ?? '#ffffff';

    const path = otGlyph.getPath(
      x + glyph.dx * scale,
      baseline - glyph.dy * scale,
      fontSize,
    );
    const d = path.toPathData(3);

    paths += `<path d="${d}" fill="${fill}" />`;
    x += glyph.ax * scale;
  });

  buf.destroy();
  hbFont.destroy();
  face.destroy();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${paths}</svg>`;
}

export const khmerGlyphDefaults = {
  DEFAULT_MODULE_URLS,
  DEFAULT_SERIES_OVERRIDES,
  DEFAULT_DIACRITIC_GROUPS,
};
