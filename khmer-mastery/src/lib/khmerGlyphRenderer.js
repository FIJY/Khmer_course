// src/lib/khmerGlyphRenderer.js
// Единая логика: категория символа, серия согласной, режимы подсветки.

export const GLYPH_COLORS = {
  // Серии (Sun/Moon)
  CONSONANT_A: "#ffb020",
  CONSONANT_O: "#6b5cff",

  // Coeng / подписные
  SUBSCRIPT: "#6a7b9c",

  // Гласные
  VOWEL_DEP: "#ff4081",
  VOWEL_IND: "#ffd54a",

  // Диакритики/прочее
  DIACRITIC: "#cbd5e1",
  NUMERAL: "#38d6d6",
  PUNCT: "#94a3b8",
  OTHER: "#ffffff",
  DEFAULT: "#ffffff",

  // Выделение выбранного глифа (обводка/свечение)
  SELECTED: "#effcfe",
};

const inRange = (cp, a, b) => cp >= a && cp <= b;

const COENG_CP = 0x17D2;

// Khmer consonants: U+1780–U+17A2
export function isKhmerConsonantChar(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, 0x1780, 0x17A2);
}

// Independent vowels: U+17A3–U+17B3
export function isKhmerIndependentVowel(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, 0x17A3, 0x17B3);
}

// Dependent vowels: U+17B6–U+17C5
export function isKhmerDependentVowel(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, 0x17B6, 0x17C5);
}

// Signs/diacritics: U+17C6–U+17D3
export function isKhmerDiacriticOrSign(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, 0x17C6, 0x17D3);
}

// Numerals: U+17E0–U+17E9
export function isKhmerNumeral(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, 0x17E0, 0x17E9);
}

// Упрощённая A-series (можно расширить позже — важно, что интерфейс уже стабилен)
const SERIES_A_SET = new Set([
  0x1780, 0x1781, 0x1785, 0x1786, 0x178A, 0x178B, 0x178E, 0x178F,
  0x1790, 0x1794, 0x1795, 0x179A, 0x179B, 0x179E, 0x17A0, 0x17A2,
]);

export function getKhmerConsonantSeries(ch) {
  if (!isKhmerConsonantChar(ch)) return null;
  const cp = ch.codePointAt(0);
  return SERIES_A_SET.has(cp) ? "A" : "O";
}

export function getKhmerGlyphCategory(ch) {
  if (!ch) return "other";
  const cp = ch.codePointAt(0);

  if (cp === COENG_CP) return "coeng";
  if (isKhmerConsonantChar(ch)) return "consonant";
  if (isKhmerIndependentVowel(ch)) return "vowel_ind";
  if (isKhmerDependentVowel(ch)) return "vowel_dep";
  if (isKhmerDiacriticOrSign(ch)) return "diacritic";
  if (isKhmerNumeral(ch)) return "numeral";

  if (ch === " " || ch === "\n" || ch === "\t") return "space";
  return "other";
}

// Старый интерфейс (чтобы ничего не сломалось)
export function getKhmerGlyphColor(char) {
  if (!char) return GLYPH_COLORS.DEFAULT;
  const cat = getKhmerGlyphCategory(char);

  if (cat === "coeng") return GLYPH_COLORS.SUBSCRIPT;

  if (cat === "consonant") {
    return getKhmerConsonantSeries(char) === "A"
      ? GLYPH_COLORS.CONSONANT_A
      : GLYPH_COLORS.CONSONANT_O;
  }

  if (cat === "vowel_dep") return GLYPH_COLORS.VOWEL_DEP;
  if (cat === "vowel_ind") return GLYPH_COLORS.VOWEL_IND;
  if (cat === "diacritic") return GLYPH_COLORS.DIACRITIC;
  if (cat === "numeral") return GLYPH_COLORS.NUMERAL;
  if (cat === "space") return "transparent";

  return GLYPH_COLORS.DEFAULT;
}

// Новый интерфейс под режимы подсветки
export function getKhmerGlyphStyle(char, opts = {}) {
  const {
    mode = "series", // "series" | "vowels" | "structure" | "frequency"
    frequencyByChar = null,
    minOpacity = 0.25,
    maxOpacity = 1.0,
  } = opts;

  const cat = getKhmerGlyphCategory(char);

  const freqOpacity = () => {
    if (!frequencyByChar || !char) return 1.0;
    const v = Number(frequencyByChar[char] ?? 0);
    const t = Math.log10(1 + v); // мягко
    const norm = Math.max(0, Math.min(1, t / 3)); // 0..1
    return minOpacity + (maxOpacity - minOpacity) * norm;
  };

  let fill = getKhmerGlyphColor(char);
  let opacity = 1.0;

  if (mode === "series") {
    if (cat === "consonant") {
      opacity = 1.0;
    } else if (cat === "coeng") {
      fill = GLYPH_COLORS.SUBSCRIPT;
      opacity = 0.9;
    } else {
      fill = GLYPH_COLORS.DIACRITIC;
      opacity = 0.55;
    }
  }

  if (mode === "vowels") {
    if (cat === "vowel_dep") {
      fill = GLYPH_COLORS.VOWEL_DEP;
      opacity = 1.0;
    } else if (cat === "vowel_ind") {
      fill = GLYPH_COLORS.VOWEL_IND;
      opacity = 1.0;
    } else if (cat === "coeng") {
      fill = GLYPH_COLORS.SUBSCRIPT;
      opacity = 0.85;
    } else if (cat === "consonant") {
      opacity = 0.75;
    } else {
      fill = GLYPH_COLORS.DIACRITIC;
      opacity = 0.55;
    }
  }

  if (mode === "structure") {
    if (cat === "consonant") {
      fill = GLYPH_COLORS.DEFAULT;
      opacity = 1.0;
    } else if (cat === "vowel_dep" || cat === "vowel_ind") {
      fill = GLYPH_COLORS.VOWEL_DEP;
      opacity = 1.0;
    } else if (cat === "coeng") {
      fill = GLYPH_COLORS.SUBSCRIPT;
      opacity = 1.0;
    } else {
      fill = GLYPH_COLORS.DIACRITIC;
      opacity = 0.7;
    }
  }

  if (mode === "frequency") {
    opacity = freqOpacity();
    if (cat !== "consonant") opacity = Math.min(opacity, 0.75);
  }

  return { fill, opacity };
}

// --- legacy stubs (если где-то есть старые импорты) ---
export const khmerGlyphDefaults = {
  DEFAULT_SERIES_OVERRIDES: {},
  DEFAULT_DIACRITIC_GROUPS: {},
  DEFAULT_MODULE_URLS: {},
};

export const renderColoredKhmerToSvg = async () => "";
