const DEFAULT_SERIES_OVERRIDES = {
  aSeries: [],
  oSeries: [],
};

const DEFAULT_DIACRITIC_GROUPS = {
  bantoc: [0x17cb],
  seriesSwitch: [0x17c9, 0x17ca],
};

const KHMER_RANGE = [0x1780, 0x17ff];
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

// Создает карту соответствия между байтовым смещением (HarfBuzz) и индексом символа (JS string)
function buildUtf8IndexMap(text) {
  const encoder = new TextEncoder();
  const byteToCp = new Map();
  let byteOffset = 0;
  let cpIndex = 0;

  for (const ch of text) {
    // Записываем, какому индексу символа соответствует текущий байт
    byteToCp.set(byteOffset, cpIndex);
    byteOffset += encoder.encode(ch).length;
    cpIndex += 1;
  }
  // Для конца строки
  byteToCp.set(byteOffset, cpIndex);

  return {
    byteToCp,
    bytes: encoder.encode(text),
    cpCount: cpIndex,
    byteLength: byteOffset,
  };
}

function loadScript(url) {
  if (scriptLoadCache.has(url)) return scriptLoadCache.get(url);
  const promise = new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Browser only'));
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
  const candidates = [
    mod?.Module, mod?.default?.hbjs, mod?.default, mod?.hbjs,
    globalThis.hbjs, globalThis.harfbuzzjs, globalThis.Module
  ];
  return candidates.find(c => typeof c === 'function');
}

async function loadHarfbuzz(moduleUrl) {
  if (!hbPromise) {
    hbPromise = import(/* @vite-ignore */ moduleUrl)
      .then(mod => getHbFactory(mod)())
      .catch(async () => {
        await loadScript(moduleUrl);
        return getHbFactory()();
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
    .then(r => {
        if (!r.ok) throw new Error(r.statusText);
        return r.arrayBuffer();
    })
    .then(buffer => ({ buffer, font: opentype.parse(buffer) }));
  fontCache.set(fontUrl, fontPromise);
  return fontPromise;
}

/**
 * Основная функция для получения векторных данных глифов.
 * Возвращает объект с viewBox и массивом путей (paths).
 * Каждый путь содержит SVG 'd' атрибут и charIndex (к какой букве относится).
 */
export async function getKhmerGlyphData({
  text,
  fontUrl,
  fontSize = 96,
  moduleUrls = DEFAULT_MODULE_URLS,
}) {
  if (!text || !fontUrl) return null;

  try {
    const opentype = await loadOpenType(moduleUrls.opentype);
    const hb = await loadHarfbuzz(moduleUrls.harfbuzz);
    const { buffer, font } = await loadFont(fontUrl, opentype);

    if (!hb || !font) return null;

    const indexMap = buildUtf8IndexMap(text);

    // Создаем шрифт для HarfBuzz
    const blob = hb.createBlob(buffer);
    const face = hb.createFace(blob, 0);
    const hbFont = hb.createFont(face);
    hbFont.setScale(font.unitsPerEm, font.unitsPerEm);

    // Шейпинг текста
    const buf = hb.createBuffer();
    buf.addUtf8(indexMap.bytes);
    buf.guessSegmentProperties();
    hb.shape(hbFont, buf);

    const glyphData = buf.json();
    const glyphs = glyphData.glyphs || [];

    const scale = fontSize / font.unitsPerEm;
    let totalAdvance = 0;

    // 1. Считаем общую ширину слова
    glyphs.forEach(g => totalAdvance += g.ax);

    // Немного запаса по высоте, чтобы диакритика не обрезалась
    const width = (totalAdvance * scale);
    const height = fontSize * 1.8;
    const baseline = fontSize * 1.2; // Смещаем базовую линию вниз

    let cursorX = 0;
    const resultPaths = [];

    // 2. Генерируем SVG пути для каждого глифа
    glyphs.forEach((g) => {
      const otGlyph = font.glyphs.get(g.g);

      // Самая важная часть: связываем глиф с индексом буквы в исходной строке
      // g.cl - это индекс байта в UTF-8 строке. Мы переводим его в индекс символа (0, 1, 2...)
      const charIndex = indexMap.byteToCp.get(g.cl) ?? -1;

      // Получаем SVG path data (команды рисования)
      const path = otGlyph.getPath(
        cursorX + g.dx * scale,
        baseline - g.dy * scale,
        fontSize
      );

      resultPaths.push({
        d: path.toPathData(2), // 2 знака после запятой для оптимизации
        charIndex: charIndex,  // Индекс буквы в строке
        char: text[charIndex], // Сама буква (например "ក")
        ax: g.ax * scale
      });

      cursorX += g.ax * scale;
    });

    // Чистим память WASM
    buf.destroy();
    hbFont.destroy();
    face.destroy();
    blob.destroy();

    return {
      viewBox: `0 0 ${width} ${height}`,
      width,
      height,
      paths: resultPaths
    };
  } catch (err) {
    console.error("Khmer Glyph Renderer Error:", err);
    return null;
  }
}

// Старая функция рендеринга в строку HTML (оставляем для совместимости, если используется в других местах)
// Если она больше не нужна, можно оставить пустую заглушку или удалить.
export async function renderColoredKhmerToSvg(props) {
    const data = await getKhmerGlyphData(props);
    if (!data) return "";

    const { width, height, viewBox, paths } = data;
    const { colors = {}, text } = props;

    // Простая логика раскраски для старого метода (если вдруг понадобится)
    // В реальности лучше использовать InteractiveKhmerWord для сложных вещей
    let svgContent = "";

    paths.forEach(p => {
       // Здесь можно было бы добавить логику определения типа буквы,
       // но для интерактивности мы используем другой компонент.
       // Просто заливаем белым по дефолту.
       svgContent += `<path d="${p.d}" fill="#ffffff" />`;
    });

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}" height="${height}">${svgContent}</svg>`;
}

export const khmerGlyphDefaults = {
  DEFAULT_MODULE_URLS,
  DEFAULT_SERIES_OVERRIDES,
  DEFAULT_DIACRITIC_GROUPS,
};