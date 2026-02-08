import { getKhmerGlyphCategory } from './khmerGlyphRenderer';

const normalizeChar = (value) =>
  String(value || '')
    .replace(/\u25CC/g, '')
    .trim()
    .normalize('NFC');

export const DEFAULT_FEEDBACK_SOUNDS = {
  success: 'success.mp3',
  error: 'error.mp3'
};

const normalizeRule = (rule) => String(rule || '').trim().toLowerCase();

export const evaluateGlyphSuccess = ({
  rule,
  glyphChar,
  glyphMeta,
  targetChar
}) => {
  if (!rule) return null;
  const normalizedRule = normalizeRule(rule);
  if (!normalizedRule) return null;

  const normalizedChar = normalizeChar(glyphChar);
  const normalizedTarget = normalizeChar(targetChar);
  const isSubscript = glyphMeta?.isSubscript ?? false;
  const category = getKhmerGlyphCategory(normalizedChar);

  if (normalizedRule === 'any') return true;

  if (normalizedRule === 'target' || normalizedRule === 'target_char') {
    return Boolean(normalizedChar && normalizedTarget && normalizedChar === normalizedTarget);
  }

  if (normalizedRule.startsWith('glyph:')) {
    const glyphValue = normalizeChar(normalizedRule.replace('glyph:', ''));
    return Boolean(glyphValue && normalizedChar === glyphValue);
  }

  if (normalizedRule === 'consonant') {
    return category === 'consonant' && !isSubscript;
  }

  if (normalizedRule === 'consonant_any') {
    return category === 'consonant';
  }

  if (normalizedRule === 'subscript_consonant') {
    return category === 'consonant' && isSubscript;
  }

  if (normalizedRule === 'vowel') {
    return category === 'vowel_dep' || category === 'vowel_ind';
  }

  if (normalizedRule === 'vowel_dep' || normalizedRule === 'vowel_ind') {
    return category === normalizedRule;
  }

  if (normalizedRule === 'diacritic' || normalizedRule === 'sign') {
    return category === 'diacritic';
  }

  if (normalizedRule === 'numeral') {
    return category === 'numeral';
  }

  if (normalizedRule === 'symbol') {
    return category === 'symbol';
  }

  return false;
};
