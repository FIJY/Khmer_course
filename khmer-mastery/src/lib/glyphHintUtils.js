// src/lib/glyphHintUtils.js

// ===== public constants (for cross-file compatibility) =====
export const COENG_CHAR = "្";
export const COENG_CP = 0x17D2;

function normalize(s) {
  return String(s || "").normalize("NFC");
}

/**
 * Публичный экспорт для совместимости с HeroSlide/другими модулями
 */
export function normalizeGlyphChar(input) {
  if (input == null) return "";

  if (typeof input === "string") {
    return normalize(input).trim();
  }

  if (typeof input === "object") {
    // если прилетел eduUnit/объект с текстом
    if (typeof input.text === "string" && input.text) {
      return normalize(input.text).trim();
    }
    if (typeof input.glyphChar === "string" && input.glyphChar) {
      return normalize(input.glyphChar).trim();
    }
    if (Array.isArray(input.codePoints) && input.codePoints.length) {
      try {
        return normalize(input.codePoints.map((cp) => String.fromCodePoint(cp)).join("")).trim();
      } catch {
        return "";
      }
    }
  }

  return "";
}

const EDU_TYPE_LABELS = {
  base_consonant: "base consonant",
  subscript_consonant: "subscript consonant",
  dependent_vowel: "dependent vowel",
  independent_vowel: "independent vowel",
  diacritic: "diacritic",
  coeng: "coeng",
  other: "other",
};

function mapAlphabetTypeToLabel(typeRaw) {
  const t = String(typeRaw || "").toLowerCase();
  if (!t) return "";

  if (t.includes("consonant")) return "consonant";
  if (t.includes("vowel") && t.includes("dep")) return "vowel_dependent";
  if (t.includes("vowel") && t.includes("ind")) return "vowel_independent";
  if (t.includes("vowel")) return "vowel";
  if (t.includes("diacritic")) return "diacritic";
  if (t.includes("coeng")) return "coeng";
  if (t.includes("numeral") || t.includes("number")) return "numeral";
  return t;
}

function findAlphabetEntry(alphabetDb, glyphChar) {
  if (!alphabetDb || !glyphChar) return null;

  const list = Array.isArray(alphabetDb)
    ? alphabetDb
    : Array.isArray(alphabetDb?.items)
      ? alphabetDb.items
      : [];

  if (!list.length) return null;

  const n = normalize(glyphChar);

  return (
    list.find((x) => normalize(x?.char) === n) ||
    list.find((x) => normalize(x?.glyph) === n) ||
    list.find((x) => normalize(x?.symbol) === n) ||
    null
  );
}

function pickHintText(entry) {
  if (!entry) return "";
  return (
    entry.hint ||
    entry.tip ||
    entry.comment ||
    entry.description ||
    entry.note ||
    ""
  );
}

/**
 * Универсальный helper: получить отображаемый символ из строки/eduUnit/объекта
 */
export function buildGlyphDisplayChar(input) {
  if (!input) return "";

  // 1) Если строка
  if (typeof input === "string") return normalizeGlyphChar(input);

  // 2) Если объект (например eduUnit)
  if (typeof input === "object") {
    if (typeof input.displayChar === "string" && input.displayChar) {
      return normalizeGlyphChar(input.displayChar);
    }

    if (typeof input.text === "string" && input.text.trim()) {
      return normalizeGlyphChar(input.text);
    }

    if (Array.isArray(input.codePoints) && input.codePoints.length > 0) {
      try {
        return normalizeGlyphChar(input.codePoints.map((cp) => String.fromCodePoint(cp)).join(""));
      } catch {
        // ignore
      }
    }

    if (typeof input.glyphChar === "string" && input.glyphChar) {
      return normalizeGlyphChar(input.glyphChar);
    }
  }

  return "";
}

export function truncateHint(hint, maxChars) {
  const s = String(hint || "").trim();
  const n = Number(maxChars);

  if (!s) return "";
  if (!Number.isFinite(n) || n <= 0) return s;
  if (s.length <= n) return s;

  return `${s.slice(0, Math.max(1, n - 1)).trim()}…`;
}

/**
 * Возвращает контент для HintCard
 * Поддерживает:
 * - legacy: тип от alphabetDb / fallbackTypeLabel
 * - edu:    тип от eduUnit.type
 */
export function getGlyphHintContent({
  mode = "legacy",
  eduUnit = null,
  glyphChar = "",
  alphabetDb,
  fallbackTypeLabel,
}) {
  const charN = normalizeGlyphChar(glyphChar) || buildGlyphDisplayChar(eduUnit);
  const entry = findAlphabetEntry(alphabetDb, charN);

  // EDU-first typing
  if (mode === "edu" && eduUnit) {
    const typeLabel =
      EDU_TYPE_LABELS[eduUnit.type] ||
      eduUnit.type ||
      "";

    const dbHint = pickHintText(entry);
    const hint =
      dbHint ||
      (typeLabel ? `This is a ${typeLabel}.` : "") ||
      (charN ? `Character: ${charN}` : "Tap a glyph");

    return { typeLabel, hint };
  }

  // Legacy typing
  const typeFromDb = mapAlphabetTypeToLabel(entry?.type || entry?.category || "");
  const typeLabel =
    typeFromDb ||
    (typeof fallbackTypeLabel === "function" ? fallbackTypeLabel(charN) : "");

  const hint =
    pickHintText(entry) ||
    (typeLabel ? `This is a ${typeLabel}.` : "") ||
    (charN ? `Character: ${charN}` : "Tap a glyph");

  return { typeLabel, hint };
}
