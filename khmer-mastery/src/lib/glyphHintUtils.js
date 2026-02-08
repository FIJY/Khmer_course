const COENG_CHAR = "្";

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

export { COENG_CHAR };
