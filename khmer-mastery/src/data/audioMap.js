console.log("audioMap module loaded", new Date().toISOString());

// 1. Helper: генерирует имя файла по Unicode-коду (например, "U+17D2.mp3")
// Используется как запасной вариант, если файла нет в базе.
const U = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}.mp3`;

// 2) Helper: создает объект для диапазона символов
function rangeMap(start, end, makeFile) {
  const out = {};
  for (let cp = start; cp <= end; cp++) {
    out[String.fromCodePoint(cp)] = makeFile(cp);
  }
  return out;
}

// ====== АВТОМАТИЧЕСКАЯ ГЕНЕРАЦИЯ (Fallback) ======
// Блок Khmer (основной): U+1780–U+17FF
const KHMER_BLOCK_FALLBACK = rangeMap(0x1780, 0x17FF, (cp) => U(cp));
// Блок Khmer Symbols: U+19E0–U+19FF
const KHMER_SYMBOLS_FALLBACK = rangeMap(0x19E0, 0x19FF, (cp) => U(cp));

// Базовая пунктуация
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

// ====== ТВОЯ БАЗА ДАННЫХ (Сгенерировано из Supabase/алфавита) ======
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

  // --- Независимые гласные (если есть) ---
  "ឥ": "vowel_independent_e_indep.mp3",
  "ឦ": "vowel_independent_ei_indep.mp3",
  "ឧ": "vowel_independent_u_indep.mp3",
  "ឪ": "vowel_independent_au_indep.mp3",
  "ឫ": "vowel_independent_ry.mp3",
  "ឬ": "vowel_independent_ryy.mp3",
  "ឭ": "vowel_independent_ly.mp3",
  "ឮ": "vowel_independent_lyy.mp3",
  "ឯ": "vowel_independent_ae_indep.mp3",
  "ឱ": "vowel_independent_ao_indep.mp3",
  "ឳ": "vowel_independent_au_ra_indep.mp3",

  // --- Зависимые гласные ---
  "ា": "vowel_name_aa.mp3",
  "ាំ": "vowel_name_aam.mp3",
  "ិ": "vowel_name_i.mp3",
  "ី": "vowel_name_ei.mp3",
  "ឹ": "vowel_name_oe.mp3",
  "ឺ": "vowel_name_oeu.mp3",
  "ុ": "vowel_name_u.mp3",
  "ុំ": "vowel_name_om.mp3",
  "ុះ": "vowel_name_oh.mp3",
  "ូ": "vowel_name_oo.mp3",
  "ួ": "vowel_name_ua.mp3",
  "ើ": "vowel_name_aeu.mp3",
  "ឿ": "vowel_name_oea.mp3",
  "ៀ": "vowel_name_ie.mp3",
  "េ": "vowel_name_e.mp3",
  "េះ": "vowel_name_eh.mp3",
  "ែ": "vowel_name_ae.mp3",
  "ៃ": "vowel_name_ai.mp3",
  "ោ": "vowel_name_ao.mp3",
  "ោះ": "vowel_name_oh_short.mp3",
  "ៅ": "vowel_name_au.mp3",

  // --- Диакритики/знаки ---
  "ំ": "sign_nikahit.mp3",
  "ះ": "sign_reahmuk.mp3",
  "ៈ": "sign_yuukaleapintu.mp3",
  "៉": "sign_musakatoan.mp3",
  "៊": "sign_treisap.mp3",
  "់": "sign_bantoc.mp3",
  "៌": "sign_robabat.mp3",
  "៍": "sign_tantakheat.mp3",
  "៎": "sign_kakabat.mp3",
  "៏": "sign_asda.mp3",
  "័": "sign_samyok_sann.mp3",
  "្": "sign_coeng.mp3",

  // --- Символы/числа ---
  "។": "sign_khan.mp3",
  "៕": "sign_bariyour.mp3",
  "ៗ": "sign_lek_to.mp3",
  "០": "number_zero.mp3",
  "១": "number_one.mp3",
  "១០": "number_ten.mp3",
  "២": "number_two.mp3",
  "៣": "number_three.mp3",
  "៤": "number_four.mp3",
  "៥": "number_five.mp3",
  "៦": "number_six.mp3",
  "៧": "number_seven.mp3",
  "៨": "number_eight.mp3",
  "៩": "number_nine.mp3",
};

// Итоговый мэп (приоритет: human > кхмерские fallback > пунктуация)
export const AUDIO_MAP = {
  ...BASIC_PUNCT_FALLBACK,
  ...KHMER_BLOCK_FALLBACK,
  ...KHMER_SYMBOLS_FALLBACK,
  ...HUMAN_AUDIO_MAP,
};

// --- ВАЖНО: КХМЕРСКИЙ "COENG" (лапка) ---
const COENG = "្";

// Если захочешь отдельные аудио именно для подписных форм — добавляй сюда.
// По умолчанию мы будем играть звук самой буквы (второго символа).
const SUBSCRIPT_OVERRIDES = {
  // "្វ": "sub_vo.mp3",
  // "្ត": "sub_ta.mp3",
  // "្រ": "sub_ro.mp3",
};

// ГЛАВНАЯ ФУНКЦИЯ
export function getSoundFileForChar(input) {
  if (!input) return "";

  // 1) Если пришёл кластер/строка (например "្វ" или "ុះ") — сначала пробуем целиком.
  // Это критично для "у", "ុះ", "េះ" и любых multi-char штук.
  const full = String(input);
  if (Object.prototype.hasOwnProperty.call(AUDIO_MAP, full)) {
    const file = AUDIO_MAP[full];
    return file === null ? null : file || "";
  }

  // 2) Если это "coeng + согласная" (например "្វ", "្ត") —
  // то для звука обычно нужна СОГЛАСНАЯ, а не сам знак coeng.
  const cps = Array.from(full); // безопасно для суррогатных пар
  if (cps.length >= 2 && cps[0] === COENG) {
    // 2a) явный override (если у тебя отдельные mp3 для подписных)
    if (Object.prototype.hasOwnProperty.call(SUBSCRIPT_OVERRIDES, full)) {
      return SUBSCRIPT_OVERRIDES[full];
    }

    // 2b) иначе играем звук второй буквы
    const consonant = cps[1];
    const file = AUDIO_MAP[consonant];
    return file === null ? null : file || "";
  }

  // 3) Фоллбек: первый символ строки
  const first = cps[0] || "";
  const file = AUDIO_MAP[first];

  if (file === null) return null;
  return file || "";
}
