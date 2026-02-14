// src/lib/khmerGlyphRenderer.js
// Единая логика: классификация кхмерских символов/кластеров, серия согласной, режимы подсветки.
// Backward compatible + новый единый API.

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

// ---------- constants ----------
const inRange = (cp, a, b) => cp >= a && cp <= b;

export const KHMER_RANGES = {
  CONSONANT_START: 0x1780,
  CONSONANT_END: 0x17A2,
  INDEPENDENT_VOWEL_START: 0x17A3,
  INDEPENDENT_VOWEL_END: 0x17B3,
  DEPENDENT_VOWEL_START: 0x17B6,
  DEPENDENT_VOWEL_END: 0x17C5,
  DIACRITIC_SIGN_START: 0x17C6,
  DIACRITIC_SIGN_END: 0x17D3,
  NUMERAL_START: 0x17E0,
  NUMERAL_END: 0x17E9,
  COENG: 0x17D2,
};

const COENG_CP = KHMER_RANGES.COENG;

// ---------- category enums ----------
export const GLYPH_CATEGORY = {
  BASE_CONSONANT: "base_consonant",
  INDEPENDENT_VOWEL: "independent_vowel",
  DEPENDENT_VOWEL: "dependent_vowel",
  COENG: "coeng",
  SUBSCRIPT_CONSONANT_SEQUENCE: "subscript_consonant_sequence",
  DIACRITIC_SIGN: "diacritic_sign",
  NUMERAL: "numeral",
  SPACE: "space",
  OTHER: "other",
};

export const GLYPH_LEGACY_CATEGORY = {
  CONSONANT: "consonant",
  VOWEL_IND: "vowel_ind",
  VOWEL_DEP: "vowel_dep",
  DIACRITIC: "diacritic",
  NUMERAL: "numeral",
  COENG: "coeng",
  SPACE: "space",
  OTHER: "other",
};

// ---------- char predicates ----------
export function isKhmerConsonantChar(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, KHMER_RANGES.CONSONANT_START, KHMER_RANGES.CONSONANT_END);
}

export function isKhmerIndependentVowel(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, KHMER_RANGES.INDEPENDENT_VOWEL_START, KHMER_RANGES.INDEPENDENT_VOWEL_END);
}

export function isKhmerDependentVowel(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, KHMER_RANGES.DEPENDENT_VOWEL_START, KHMER_RANGES.DEPENDENT_VOWEL_END);
}

export function isKhmerDiacriticOrSign(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, KHMER_RANGES.DIACRITIC_SIGN_START, KHMER_RANGES.DIACRITIC_SIGN_END);
}

export function isKhmerNumeral(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return inRange(cp, KHMER_RANGES.NUMERAL_START, KHMER_RANGES.NUMERAL_END);
}

export function isKhmerCoeng(ch) {
  if (!ch) return false;
  return ch.codePointAt(0) === COENG_CP;
}

export function isWhitespaceChar(ch) {
  return ch === " " || ch === "\n" || ch === "\t" || ch === "\r";
}

// ---------- consonant series ----------
// Упрощённая A-series (достаточно для стабильного UI-интерфейса)
const SERIES_A_SET = new Set([
  0x1780, 0x1781, 0x1785, 0x1786, 0x178A, 0x178B, 0x178E, 0x178F,
  0x1790, 0x1794, 0x1795, 0x179A, 0x179B, 0x179E, 0x17A0, 0x17A2,
]);

export function getKhmerConsonantSeries(ch) {
  if (!isKhmerConsonantChar(ch)) return null;
  const cp = ch.codePointAt(0);
  return SERIES_A_SET.has(cp) ? "A" : "O";
}

// ---------- unified classification (single char) ----------
export function getKhmerGlyphCategory(ch) {
  if (!ch) return GLYPH_CATEGORY.OTHER;

  if (isWhitespaceChar(ch)) return GLYPH_CATEGORY.SPACE;
  if (isKhmerCoeng(ch)) return GLYPH_CATEGORY.COENG;
  if (isKhmerConsonantChar(ch)) return GLYPH_CATEGORY.BASE_CONSONANT;
  if (isKhmerIndependentVowel(ch)) return GLYPH_CATEGORY.INDEPENDENT_VOWEL;
  if (isKhmerDependentVowel(ch)) return GLYPH_CATEGORY.DEPENDENT_VOWEL;
  if (isKhmerDiacriticOrSign(ch)) return GLYPH_CATEGORY.DIACRITIC_SIGN;
  if (isKhmerNumeral(ch)) return GLYPH_CATEGORY.NUMERAL;

  return GLYPH_CATEGORY.OTHER;
}

// ---------- unified classification (sequence/cluster) ----------
/**
 * Классификация последовательности символов (кластер/токен).
 * Возвращает "subscript_consonant_sequence", если внутри есть COENG + consonant.
 *
 * @param {string|string[]} input - строка (кластер) или массив символов
 */
export function getKhmerSequenceCategory(input) {
  const chars = Array.isArray(input) ? input : Array.from(input || "");
  if (!chars.length) return GLYPH_CATEGORY.OTHER;

  for (let i = 0; i < chars.length - 1; i += 1) {
    if (isKhmerCoeng(chars[i]) && isKhmerConsonantChar(chars[i + 1])) {
      return GLYPH_CATEGORY.SUBSCRIPT_CONSONANT_SEQUENCE;
    }
  }

  // если нет явной подписной последовательности — берём категорию "главного" символа
  // приоритет: consonant > indep vowel > dep vowel > coeng > diacritic > numeral > other
  const hasBase = chars.some(isKhmerConsonantChar);
  if (hasBase) return GLYPH_CATEGORY.BASE_CONSONANT;

  const hasInd = chars.some(isKhmerIndependentVowel);
  if (hasInd) return GLYPH_CATEGORY.INDEPENDENT_VOWEL;

  const hasDep = chars.some(isKhmerDependentVowel);
  if (hasDep) return GLYPH_CATEGORY.DEPENDENT_VOWEL;

  const hasCoeng = chars.some(isKhmerCoeng);
  if (hasCoeng) return GLYPH_CATEGORY.COENG;

  const hasDia = chars.some(isKhmerDiacriticOrSign);
  if (hasDia) return GLYPH_CATEGORY.DIACRITIC_SIGN;

  const hasNum = chars.some(isKhmerNumeral);
  if (hasNum) return GLYPH_CATEGORY.NUMERAL;

  if (chars.every(isWhitespaceChar)) return GLYPH_CATEGORY.SPACE;
  return GLYPH_CATEGORY.OTHER;
}

/**
 * Удобный helper для серверных enriched полей (chars/codePoints/flags).
 */
export function getKhmerCategoryFromClusterMeta(meta = {}) {
  const chars = Array.isArray(meta.chars) ? meta.chars : [];
  if (meta.hasSubscriptConsonant) return GLYPH_CATEGORY.SUBSCRIPT_CONSONANT_SEQUENCE;
  if (meta.hasCoeng && chars.length === 1) return GLYPH_CATEGORY.COENG;
  return getKhmerSequenceCategory(chars);
}

// ---------- legacy compatibility ----------
export function toLegacyCategory(unifiedCategory) {
  switch (unifiedCategory) {
    case GLYPH_CATEGORY.BASE_CONSONANT:
      return GLYPH_LEGACY_CATEGORY.CONSONANT;
    case GLYPH_CATEGORY.INDEPENDENT_VOWEL:
      return GLYPH_LEGACY_CATEGORY.VOWEL_IND;
    case GLYPH_CATEGORY.DEPENDENT_VOWEL:
      return GLYPH_LEGACY_CATEGORY.VOWEL_DEP;
    case GLYPH_CATEGORY.DIACRITIC_SIGN:
      return GLYPH_LEGACY_CATEGORY.DIACRITIC;
    case GLYPH_CATEGORY.NUMERAL:
      return GLYPH_LEGACY_CATEGORY.NUMERAL;
    case GLYPH_CATEGORY.COENG:
    case GLYPH_CATEGORY.SUBSCRIPT_CONSONANT_SEQUENCE:
      return GLYPH_LEGACY_CATEGORY.COENG;
    case GLYPH_CATEGORY.SPACE:
      return GLYPH_LEGACY_CATEGORY.SPACE;
    default:
      return GLYPH_LEGACY_CATEGORY.OTHER;
  }
}

// ---------- color logic ----------
/**
 * Старый интерфейс: цвет по одному символу.
 * Совместим с прежним поведением.
 */
export function getKhmerGlyphColor(char) {
  if (!char) return GLYPH_COLORS.DEFAULT;
  const cat = getKhmerGlyphCategory(char);

  if (cat === GLYPH_CATEGORY.COENG) return GLYPH_COLORS.SUBSCRIPT;

  if (cat === GLYPH_CATEGORY.BASE_CONSONANT) {
    return getKhmerConsonantSeries(char) === "A"
      ? GLYPH_COLORS.CONSONANT_A
      : GLYPH_COLORS.CONSONANT_O;
  }

  if (cat === GLYPH_CATEGORY.DEPENDENT_VOWEL) return GLYPH_COLORS.VOWEL_DEP;
  if (cat === GLYPH_CATEGORY.INDEPENDENT_VOWEL) return GLYPH_COLORS.VOWEL_IND;
  if (cat === GLYPH_CATEGORY.DIACRITIC_SIGN) return GLYPH_COLORS.DIACRITIC;
  if (cat === GLYPH_CATEGORY.NUMERAL) return GLYPH_COLORS.NUMERAL;
  if (cat === GLYPH_CATEGORY.SPACE) return "transparent";

  return GLYPH_COLORS.DEFAULT;
}

/**
 * Новый интерфейс: стиль с режимами подсветки.
 * Можно передавать либо char, либо { char, category }.
 */
export function getKhmerGlyphStyle(input, opts = {}) {
  const {
    mode = "series", // "series" | "vowels" | "structure" | "frequency"
    frequencyByChar = null,
    minOpacity = 0.25,
    maxOpacity = 1.0,
  } = opts;

  const char = typeof input === "string" ? input : (input?.char || "");
  const category =
    (typeof input === "object" && input?.category) || getKhmerGlyphCategory(char);

  const freqOpacity = () => {
    if (!frequencyByChar || !char) return 1.0;
    const v = Number(frequencyByChar[char] ?? 0);
    const t = Math.log10(1 + v);
    const norm = Math.max(0, Math.min(1, t / 3));
    return minOpacity + (maxOpacity - minOpacity) * norm;
  };

  let fill = getKhmerGlyphColor(char);
  let opacity = 1.0;

  if (mode === "series") {
    if (category === GLYPH_CATEGORY.BASE_CONSONANT) {
      opacity = 1.0;
    } else if (
      category === GLYPH_CATEGORY.COENG ||
      category === GLYPH_CATEGORY.SUBSCRIPT_CONSONANT_SEQUENCE
    ) {
      fill = GLYPH_COLORS.SUBSCRIPT;
      opacity = 0.9;
    } else {
      fill = GLYPH_COLORS.DIACRITIC;
      opacity = 0.55;
    }
  }

  if (mode === "vowels") {
    if (category === GLYPH_CATEGORY.DEPENDENT_VOWEL) {
      fill = GLYPH_COLORS.VOWEL_DEP;
      opacity = 1.0;
    } else if (category === GLYPH_CATEGORY.INDEPENDENT_VOWEL) {
      fill = GLYPH_COLORS.VOWEL_IND;
      opacity = 1.0;
    } else if (
      category === GLYPH_CATEGORY.COENG ||
      category === GLYPH_CATEGORY.SUBSCRIPT_CONSONANT_SEQUENCE
    ) {
      fill = GLYPH_COLORS.SUBSCRIPT;
      opacity = 0.85;
    } else if (category === GLYPH_CATEGORY.BASE_CONSONANT) {
      opacity = 0.75;
    } else {
      fill = GLYPH_COLORS.DIACRITIC;
      opacity = 0.55;
    }
  }

  if (mode === "structure") {
    if (category === GLYPH_CATEGORY.BASE_CONSONANT) {
      fill = GLYPH_COLORS.DEFAULT;
      opacity = 1.0;
    } else if (
      category === GLYPH_CATEGORY.DEPENDENT_VOWEL ||
      category === GLYPH_CATEGORY.INDEPENDENT_VOWEL
    ) {
      fill = GLYPH_COLORS.VOWEL_DEP;
      opacity = 1.0;
    } else if (
      category === GLYPH_CATEGORY.COENG ||
      category === GLYPH_CATEGORY.SUBSCRIPT_CONSONANT_SEQUENCE
    ) {
      fill = GLYPH_COLORS.SUBSCRIPT;
      opacity = 1.0;
    } else {
      fill = GLYPH_COLORS.DIACRITIC;
      opacity = 0.7;
    }
  }

  if (mode === "frequency") {
    opacity = freqOpacity();
    if (category !== GLYPH_CATEGORY.BASE_CONSONANT) opacity = Math.min(opacity, 0.75);
  }

  return { fill, opacity };
}

// ---------- unified API object export ----------
export const KhmerGlyphAPI = {
  GLYPH_COLORS,
  GLYPH_CATEGORY,
  GLYPH_LEGACY_CATEGORY,
  KHMER_RANGES,

  // predicates
  isKhmerConsonantChar,
  isKhmerIndependentVowel,
  isKhmerDependentVowel,
  isKhmerDiacriticOrSign,
  isKhmerNumeral,
  isKhmerCoeng,
  isWhitespaceChar,

  // classify
  getKhmerGlyphCategory,
  getKhmerSequenceCategory,
  getKhmerCategoryFromClusterMeta,
  toLegacyCategory,

  // styling
  getKhmerConsonantSeries,
  getKhmerGlyphColor,
  getKhmerGlyphStyle,
};

// --- legacy stubs (если где-то есть старые импорты) ---
export const khmerGlyphDefaults = {
  DEFAULT_SERIES_OVERRIDES: {},
  DEFAULT_DIACRITIC_GROUPS: {},
  DEFAULT_MODULE_URLS: {},
};

export const renderColoredKhmerToSvg = async () => "";
