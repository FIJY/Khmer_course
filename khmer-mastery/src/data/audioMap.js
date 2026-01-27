// src/data/audioMap.js

// Helper: имя файла по Unicode-коду символа
const U = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}.mp3`;

// Быстрая генерация мэпа для диапазона Unicode
function rangeMap(start, end, makeFile) {
  const out = {};
  for (let cp = start; cp <= end; cp++) {
    out[String.fromCodePoint(cp)] = makeFile(cp);
  }
  return out;
}

// ====== Полное покрытие "вся письменность учтена" ======
// Мы гарантируем, что любой кхмерский символ вернёт имя файла через fallback U+XXXX.mp3,
// даже если у тебя нет "человеческих" имён файлов.

// Блок Khmer (основной): U+1780–U+17FF (включая согласные, гласные, диакритики, знаки, цифры)
const KHMER_BLOCK_FALLBACK = rangeMap(0x1780, 0x17FF, (cp) => U(cp));

// Блок Khmer Symbols: U+19E0–U+19FF (редко, но это часть письменности)
const KHMER_SYMBOLS_FALLBACK = rangeMap(0x19E0, 0x19FF, (cp) => U(cp));

// Базовая пунктуация/пробелы (часто встречаются в тексте)
const BASIC_PUNCT_FALLBACK = {
  " ": "space.mp3",
  ".": "dot.mp3",
  ",": "comma.mp3",
  "!": "exclamation.mp3",
  "?": "question.mp3",
  ":": "colon.mp3",
  ";": "semicolon.mp3",
  "-": "dash.mp3",
  "–": "ndash.mp3",
  "—": "mdash.mp3",
  "(": "paren_open.mp3",
  ")": "paren_close.mp3",
  "\"": "quote.mp3",
  "“": "quote_open.mp3",
  "”": "quote_close.mp3",
  "'": "apostrophe.mp3",
  "\n": "newline.mp3",
  "\t": "tab.mp3",
};

// ====== Твой "человеческий" мэп (то, что уже есть) ======
// Он переопределяет fallback для конкретных букв.
const HUMAN_AUDIO_MAP = {
  // --- Согласные ---
  "ក": "letter_ka.mp3",
  "ខ": "letter_kha.mp3",
  "គ": "letter_ko.mp3",
  "ឃ": "letter_kho.mp3",
  "ង": "letter_ngo.mp3",

  "ច": "letter_cha.mp3",
  "ឆ": "letter_chha.mp3",
  "ជ": "letter_cho.mp3",
  "ឈ": "letter_chho.mp3",
  "ញ": "letter_nyo.mp3",

  "ដ": "letter_da.mp3",
  "ឋ": "letter_tha_retro.mp3",
  "ឌ": "letter_do.mp3",
  "ឍ": "letter_tho_retro.mp3",
  "ណ": "letter_na.mp3",

  "ត": "letter_ta.mp3",
  "ថ": "letter_tha.mp3",
  "ទ": "letter_to.mp3",
  "ធ": "letter_tho.mp3",
  "ន": "letter_no.mp3",

  "ប": "letter_ba.mp3",
  "ផ": "letter_pha.mp3",
  "ព": "letter_po.mp3",
  "ភ": "letter_pho.mp3",
  "ម": "letter_mo.mp3",

  "យ": "letter_yo.mp3",
  "រ": "letter_ro.mp3",
  "ល": "letter_lo.mp3",
  "វ": "letter_vo.mp3",

  "ស": "letter_sa.mp3",
  "ហ": "letter_ha.mp3",
  "ឡ": "letter_la.mp3",
  "អ": "letter_qa.mp3",

  // --- Гласные (зависимые) ---
  "ា": "vowel_name_aa.mp3",
  "ិ": "vowel_name_i.mp3",
  "ី": "vowel_name_ei.mp3",
  "ឹ": "vowel_name_oe.mp3",
  "ឺ": "vowel_name_oeu.mp3",
  "ុ": "vowel_name_u.mp3",
  "ូ": "vowel_name_oo.mp3",
  "ួ": "vowel_name_ua.mp3",
  "ើ": "vowel_name_aeu.mp3",
  "ឿ": "vowel_name_oea.mp3",
  "ៀ": "vowel_name_ie.mp3",
  "េ": "vowel_name_e.mp3",
  "ែ": "vowel_name_ae.mp3",
  "ៃ": "vowel_name_ai.mp3",
  "ោ": "vowel_name_ao.mp3",
  "ៅ": "vowel_name_au.mp3",

  // --- Диакритики/спецзнаки (если у тебя будут отдельные mp3, просто добавляй сюда) ---
  // COENG:
  // "្": "sign_coeng.mp3",
  // "់": "sign_bantoc.mp3",
  // "៌": "sign_robat.mp3",
  // "៍": "sign_toandakhiat.mp3",
  // "៎": "sign_kakabat.mp3",
};

// Итоговый мэп (приоритет: human > кхмерские fallback > базовая пунктуация)
export const AUDIO_MAP = {
  ...BASIC_PUNCT_FALLBACK,
  ...KHMER_BLOCK_FALLBACK,
  ...KHMER_SYMBOLS_FALLBACK,
  ...HUMAN_AUDIO_MAP,
};

// Нормализуем ключ: иногда может прилететь "комбинированный" элемент.
// В твоих данных glyph.char должен быть одиночным символом, но на всякий — берём первый кодпоинт.
export function normalizeChar(ch) {
  if (!ch) return "";
  // Берём первый Unicode codepoint (без развала суррогатных пар)
  const first = Array.from(ch)[0];
  return first || "";
}

// Получить имя звука для символа. Всегда вернёт строку (или пустую, если совсем неизвестно)
export function getSoundFileForChar(ch) {
  const c = normalizeChar(ch);
  return AUDIO_MAP[c] || "";
}
