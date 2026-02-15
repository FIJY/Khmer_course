// src/lib/khmerGlyphRenderer.js

// Цвета для различных категорий (можно настроить)
export const GLYPH_COLORS = {
  BASE_CONSONANT: "#4ade80", // зелёный
  SUBSCRIPT_CONSONANT: "#60a5fa", // синий
  DEPENDENT_VOWEL: "#fbbf24", // жёлтый
  INDEPENDENT_VOWEL: "#f87171", // красный
  DIACRITIC: "#c084fc", // фиолетовый
  COENG: "#9ca3af", // серый
  OTHER: "#d1d5db", // светло-серый
  SELECTED: "#22d3ee", // циан
};

// Типы глифов (eduUnit.type)
export const GLYPH_TYPE = {
  BASE_CONSONANT: "base_consonant",
  SUBSCRIPT_CONSONANT: "subscript_consonant",
  DEPENDENT_VOWEL: "dependent_vowel",
  INDEPENDENT_VOWEL: "independent_vowel",
  DIACRITIC: "diacritic",
  COENG: "coeng",
  OTHER: "other",
};

// Диапазоны кодовых точек кхмерского языка
const KHMER_CONSONANT_START = 0x1780;
const KHMER_CONSONANT_END = 0x17A2;
const KHMER_IND_VOWEL_START = 0x17A3;
const KHMER_IND_VOWEL_END = 0x17B3;
const KHMER_DEP_VOWEL_START = 0x17B6;
const KHMER_DEP_VOWEL_END = 0x17C5;
const KHMER_DIACRITIC_START = 0x17C6;
const KHMER_DIACRITIC_END = 0x17D1;
const COENG_CP = 0x17D2;

function normalize(s) {
  return String(s || "").normalize("NFC");
}

/**
 * Проверяет, является ли символ согласным (базовым)
 */
export function isKhmerConsonantChar(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return cp >= KHMER_CONSONANT_START && cp <= KHMER_CONSONANT_END;
}

/**
 * Проверяет, является ли символ коангом (្)
 */
export function isCoengChar(ch) {
  if (!ch) return false;
  return ch.codePointAt(0) === COENG_CP;
}

/**
 * Проверяет, является ли последовательность коанг+согласный подстрочным согласным
 */
export function isSubscriptSequence(prevChar, currChar) {
  return isCoengChar(prevChar) && isKhmerConsonantChar(currChar);
}

/**
 * Определяет тип глифа на основе символа и предыдущего (для контекста)
 */
export function getGlyphType(char, prevChar = null) {
  if (!char) return GLYPH_TYPE.OTHER;
  const cp = char.codePointAt(0);

  if (cp === COENG_CP) return GLYPH_TYPE.COENG;
  if (cp >= KHMER_CONSONANT_START && cp <= KHMER_CONSONANT_END) {
    // если перед нами коанг, то это подстрочный согласный
    if (prevChar && isCoengChar(prevChar)) {
      return GLYPH_TYPE.SUBSCRIPT_CONSONANT;
    }
    return GLYPH_TYPE.BASE_CONSONANT;
  }
  if (cp >= KHMER_IND_VOWEL_START && cp <= KHMER_IND_VOWEL_END) {
    return GLYPH_TYPE.INDEPENDENT_VOWEL;
  }
  if (cp >= KHMER_DEP_VOWEL_START && cp <= KHMER_DEP_VOWEL_END) {
    return GLYPH_TYPE.DEPENDENT_VOWEL;
  }
  if (cp >= KHMER_DIACRITIC_START && cp <= KHMER_DIACRITIC_END && cp !== COENG_CP) {
    return GLYPH_TYPE.DIACRITIC;
  }
  return GLYPH_TYPE.OTHER;
}

/**
 * Возвращает категорию для старой системы (совместимость)
 */
export function getKhmerGlyphCategory(ch) {
  const type = getGlyphType(ch);
  switch (type) {
    case GLYPH_TYPE.BASE_CONSONANT:
    case GLYPH_TYPE.SUBSCRIPT_CONSONANT:
      return "consonant";
    case GLYPH_TYPE.DEPENDENT_VOWEL:
      return "vowel_dep";
    case GLYPH_TYPE.INDEPENDENT_VOWEL:
      return "vowel_ind";
    case GLYPH_TYPE.DIACRITIC:
      return "diacritic";
    case GLYPH_TYPE.COENG:
      return "coeng";
    default:
      return "other";
  }
}

/**
 * Возвращает цвет для глифа на основе его категории
 */
export function getKhmerGlyphColor(ch) {
  const type = getGlyphType(ch);
  return GLYPH_COLORS[type] || GLYPH_COLORS.OTHER;
}

/**
 * Возвращает стиль (fill, opacity) для использования в SVG
 */
export function getKhmerGlyphStyle(ch, options = {}) {
  const { mode = "series", frequencyByChar = null } = options;
  const baseColor = getKhmerGlyphColor(ch);
  let fill = baseColor;
  let opacity = 1;

  if (mode === "frequency" && frequencyByChar) {
    const freq = frequencyByChar[ch] || 0;
    opacity = 0.3 + freq * 0.7; // пример
  }

  return { fill, opacity };
}