import { isKhmerConsonantChar } from "./khmerGlyphRenderer";

const COENG_CHAR = "្";

const isKhmerConsonant = (ch) => {
  if (!ch) return false;
  try {
    return typeof isKhmerConsonantChar === "function"
      ? isKhmerConsonantChar(ch)
      : ch.codePointAt(0) >= 0x1780 && ch.codePointAt(0) <= 0x17a2;
  } catch {
    return false;
  }
};

export const normalizeGlyphChar = (glyphChar) => {
  if (!glyphChar) return "";
  return String(glyphChar).replace(/\u25CC/g, "").trim().normalize("NFC");
};

export const lookupAlphabetEntry = (alphabetDb, glyphChar) => {
  if (!alphabetDb || !glyphChar) return null;
  const normalized = normalizeGlyphChar(glyphChar);

  if (alphabetDb instanceof Map) {
    return alphabetDb.get(normalized) || alphabetDb.get(glyphChar) || null;
  }
  if (typeof alphabetDb === "object") {
    return alphabetDb[normalized] || alphabetDb[glyphChar] || null;
  }

  return null;
};

export const getGlyphHintContent = ({ glyphChar, alphabetDb, fallbackTypeLabel }) => {
  const entry = lookupAlphabetEntry(alphabetDb, glyphChar);
  const typeLabel = entry?.type || (fallbackTypeLabel ? fallbackTypeLabel(glyphChar) : "");
  const hint = entry?.hint || entry?.name_en || entry?.name || entry?.description || "";
  return { typeLabel, hint, entry };
};

export const buildGlyphDisplayChar = ({ glyphChar, isSubscript, isSubscriptConsonant }) => {
  const normalized = normalizeGlyphChar(glyphChar);
  if (isSubscriptConsonant) {
    return `${normalized} / ${COENG_CHAR}${normalized}`;
  }
  if (isSubscript) {
    return `${COENG_CHAR}${normalized}`;
  }
  return glyphChar || "";
};

export const truncateHint = (hint, maxChars) => {
  if (!hint || !maxChars || maxChars <= 0) return hint || "";
  if (hint.length <= maxChars) return hint;
  return `${hint.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;
};

export const resolveGlyphMeta = (glyphs, text) => {
  if (!glyphs || !text) return glyphs || [];

  const textChars = Array.from(text);

  const subscriptPositions = new Set();
  for (let i = 0; i < textChars.length - 1; i += 1) {
    if (textChars[i] === COENG_CHAR && isKhmerConsonant(textChars[i + 1])) {
      subscriptPositions.add(i + 1);
    }
  }

  const consonantsInText = [];
  textChars.forEach((char, idx) => {
    if (isKhmerConsonant(char)) {
      consonantsInText.push({
        char,
        textIndex: idx,
        isSubscript: subscriptPositions.has(idx)
      });
    }
  });

  let consonantCounter = 0;

  return glyphs.map((glyph) => {
    const glyphChar = glyph.char || "";

    if (!isKhmerConsonant(glyphChar)) {
      return {
        ...glyph,
        resolvedChar: glyphChar,
        resolvedIndex: -1,
        isSubscript: false
      };
    }

    if (consonantCounter < consonantsInText.length) {
      const consonantInfo = consonantsInText[consonantCounter];
      consonantCounter += 1;

      return {
        ...glyph,
        resolvedChar: consonantInfo.char,
        resolvedIndex: consonantInfo.textIndex,
        isSubscript: consonantInfo.isSubscript
      };
    }

    return {
      ...glyph,
      resolvedChar: glyphChar,
      resolvedIndex: -1,
      isSubscript: false
    };
  });
};

export { COENG_CHAR, isKhmerConsonant };
