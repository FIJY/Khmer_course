const KHMER_RANGE = [0x1780, 0x17ff];
const KHMER_CONSONANT_RANGE = [0x1780, 0x17a2];
const KHMER_INDEPENDENT_VOWELS = [0x17a3, 0x17b5];
const KHMER_DEPENDENT_VOWELS = [0x17b6, 0x17c5];
const KHMER_DIACRITICS = [0x17c6, 0x17d3];
const KHMER_NUMERALS = [0x17e0, 0x17e9];
const KHMER_PUNCTUATION = new Set([0x17d4, 0x17d5, 0x17d7]);
const COENG = 0x17d2;

function isInRange(cp, [start, end]) {
  return cp >= start && cp <= end;
}

function isKhmerCodepoint(cp) {
  return isInRange(cp, KHMER_RANGE);
}

export function tokenizeKhmerWord(word) {
  const chars = Array.from(word);
  const tokens = [];

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const cp = ch.codePointAt(0);

    if (cp == null) continue;

    if (cp === COENG && i + 1 < chars.length) {
      const next = chars[i + 1];
      tokens.push({ text: `${ch}${next}`, type: 'SUBSCRIPT', base: next });
      i += 1;
      continue;
    }

    if (isInRange(cp, KHMER_CONSONANT_RANGE)) {
      tokens.push({ text: ch, type: 'CONSONANT', base: ch });
      continue;
    }

    if (isInRange(cp, KHMER_INDEPENDENT_VOWELS)) {
      tokens.push({ text: ch, type: 'VOWEL_IND' });
      continue;
    }

    if (isInRange(cp, KHMER_DEPENDENT_VOWELS)) {
      let bundle = ch;
      while (i + 1 < chars.length) {
        const next = chars[i + 1];
        const nextCp = next.codePointAt(0);
        if (nextCp == null || !isInRange(nextCp, KHMER_DEPENDENT_VOWELS)) break;
        bundle += next;
        i += 1;
      }
      tokens.push({ text: bundle, type: 'VOWEL_DEP' });
      continue;
    }

    if (isInRange(cp, KHMER_DIACRITICS)) {
      tokens.push({ text: ch, type: 'DIACRITIC' });
      continue;
    }

    if (isInRange(cp, KHMER_NUMERALS)) {
      tokens.push({ text: ch, type: 'NUMERAL' });
      continue;
    }

    if (KHMER_PUNCTUATION.has(cp)) {
      tokens.push({ text: ch, type: 'PUNCT' });
      continue;
    }

    tokens.push({ text: ch, type: isKhmerCodepoint(cp) ? 'OTHER' : 'LATIN' });
  }

  return tokens;
}
