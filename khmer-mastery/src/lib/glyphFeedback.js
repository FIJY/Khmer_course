// src/lib/glyphFeedback.js
export const DEFAULT_FEEDBACK_SOUNDS = {
  success: "success.mp3",
  error: "error.mp3",
};

function normalize(s) {
  return String(s || "").normalize("NFC");
}

function isConsonantChar(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return cp >= 0x1780 && cp <= 0x17A2;
}

function isConsonantFromUnit(eduUnit, glyphChar) {
  const t = eduUnit?.type;
  if (t === "base_consonant" || t === "subscript_consonant") return true;
  return isConsonantChar(glyphChar);
}

export function evaluateGlyphSuccess({
  mode = "legacy",
  rule,
  eduUnit,
  glyphChar,
  glyphMeta,
  targetChar,
}) {
  const r = String(rule || "").toLowerCase().trim();
  const charN = normalize(glyphChar);
  const targetN = normalize(targetChar);

  // общие exact-rules
  if (r === "exact_match" || r === "target" || r === "char_match") {
    return !!targetN && charN === targetN;
  }

  // EDU path
  if (mode === "edu") {
    const t = eduUnit?.type || glyphMeta?.unitType || "";

    if (r === "consonant") return t === "base_consonant" || t === "subscript_consonant";
    if (r === "subscript") return t === "subscript_consonant" || !!eduUnit?.isSubscript;
    if (r === "dependent_vowel" || r === "vowel_dep") return t === "dependent_vowel";
    if (r === "independent_vowel" || r === "vowel_ind") return t === "independent_vowel";
    if (r === "diacritic") return t === "diacritic";
    if (r === "coeng") return t === "coeng";

    // fallback
    return !!targetN ? charN === targetN : false;
  }

  // LEGACY path
  if (r === "consonant") return isConsonantChar(charN);
  if (r === "subscript") return !!glyphMeta?.isSubscript;
  if (r === "dependent_vowel" || r === "vowel_dep") return false;
  if (r === "independent_vowel" || r === "vowel_ind") return false;
  if (r === "diacritic") return false;
  if (r === "coeng") return false;

  return !!targetN ? charN === targetN : false;
}
