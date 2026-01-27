console.log("audioMap module loaded", new Date().toISOString());

// 1. Helper: генерирует имя файла по Unicode-коду (например, "U+17D2.mp3")
// Используется как запасной вариант, если файла нет в базе.
const U = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}.mp3`;

// 2. Helper: создает объект для диапазона символов
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

// ====== ТВОЯ БАЗА ДАННЫХ (Сгенерировано из alphabet_rows.csv) ======
// Здесь ровно то, что лежит у тебя в Supabase.
const HUMAN_AUDIO_MAP = {
  "ក": "letter_ka.mp3", // consonant: ka
  "ខ": "letter_kha.mp3", // consonant: kha
  "គ": "letter_ko.mp3", // consonant: ko
  "ឃ": "letter_kho.mp3", // consonant: kho
  "ង": "letter_ngo.mp3", // consonant: ngo
  "ច": "letter_cha.mp3", // consonant: cha
  "ឆ": "letter_chha.mp3", // consonant: chha
  "ជ": "letter_cho.mp3", // consonant: cho
  "ឈ": "letter_chho.mp3", // consonant: chho
  "ញ": "letter_nyo.mp3", // consonant: nyo
  "ដ": "letter_da.mp3", // consonant: da
  "ឋ": "letter_tha_retro.mp3", // consonant: tha_retro
  "ឌ": "letter_do.mp3", // consonant: do
  "ឍ": "letter_tho_retro.mp3", // consonant: tho_retro
  "ណ": "letter_na.mp3", // consonant: na
  "ត": "letter_ta.mp3", // consonant: ta
  "ថ": "letter_tha.mp3", // consonant: tha
  "ទ": "letter_to.mp3", // consonant: to
  "ធ": "letter_tho.mp3", // consonant: tho
  "ន": "letter_no.mp3", // consonant: no
  "ប": "letter_ba.mp3", // consonant: ba
  "ផ": "letter_pha.mp3", // consonant: pha
  "ព": "letter_po.mp3", // consonant: po
  "ភ": "letter_pho.mp3", // consonant: pho
  "ម": "letter_mo.mp3", // consonant: mo
  "យ": "letter_yo.mp3", // consonant: yo
  "រ": "letter_ro.mp3", // consonant: ro
  "ល": "letter_lo.mp3", // consonant: lo
  "វ": "letter_vo.mp3", // consonant: vo
  "ស": "letter_sa.mp3", // consonant: sa
  "ហ": "letter_ha.mp3", // consonant: ha
  "ឡ": "letter_la.mp3", // consonant: la
  "អ": "letter_qa.mp3", // consonant: qa
  "ឥ": "vowel_independent_e_indep.mp3", // vowel_independent: e_indep
  "ឦ": "vowel_independent_ei_indep.mp3", // vowel_independent: ei_indep
  "ឧ": "vowel_independent_u_indep.mp3", // vowel_independent: u_indep
  "ឪ": "vowel_independent_au_indep.mp3", // vowel_independent: au_indep
  "ឫ": "vowel_independent_ry.mp3", // vowel_independent: ry
  "ឬ": "vowel_independent_ryy.mp3", // vowel_independent: ryy
  "ឭ": "vowel_independent_ly.mp3", // vowel_independent: ly
  "ឮ": "vowel_independent_lyy.mp3", // vowel_independent: lyy
  "ឯ": "vowel_independent_ae_indep.mp3", // vowel_independent: ae_indep
  "ឱ": "vowel_independent_ao_indep.mp3", // vowel_independent: ao_indep
  "ឳ": "vowel_independent_au_ra_indep.mp3", // vowel_independent: au_ra_indep
  "ា": "vowel_name_aa.mp3", // vowel_dependent: aa
  "ាំ": "vowel_name_aam.mp3", // vowel_dependent: aam
  "ិ": "vowel_name_i.mp3", // vowel_dependent: i
  "ី": "vowel_name_ei.mp3", // vowel_dependent: ei
  "ឹ": "vowel_name_oe.mp3", // vowel_dependent: oe
  "ឺ": "vowel_name_oeu.mp3", // vowel_dependent: oeu
  "ុ": "vowel_name_u.mp3", // vowel_dependent: u
  "ុំ": "vowel_name_om.mp3", // vowel_dependent: om
  "ុះ": "vowel_name_oh.mp3", // vowel_dependent: oh
  "ូ": "vowel_name_oo.mp3", // vowel_dependent: oo
  "ួ": "vowel_name_ua.mp3", // vowel_dependent: ua
  "ើ": "vowel_name_aeu.mp3", // vowel_dependent: aeu
  "ឿ": "vowel_name_oea.mp3", // vowel_dependent: oea
  "ៀ": "vowel_name_ie.mp3", // vowel_dependent: ie
  "េ": "vowel_name_e.mp3", // vowel_dependent: e
  "េះ": "vowel_name_eh.mp3", // vowel_dependent: eh
  "ែ": "vowel_name_ae.mp3", // vowel_dependent: ae
  "ៃ": "vowel_name_ai.mp3", // vowel_dependent: ai
  "ោ": "vowel_name_ao.mp3", // vowel_dependent: ao
  "ោះ": "vowel_name_oh_short.mp3", // vowel_dependent: oh_short
  "ៅ": "vowel_name_au.mp3", // vowel_dependent: au
  "ំ": "sign_nikahit.mp3", // vowel_dependent: am
  "ះ": "sign_reahmuk.mp3", // vowel_dependent: ah
  "ៈ": "sign_yuukaleapintu.mp3", // diacritic: yuukaleapintu
  "៉": "sign_musakatoan.mp3", // diacritic: musakatoan
  "៊": "sign_treisap.mp3", // diacritic: treisap
  "់": "sign_bantoc.mp3", // diacritic: bantoc
  "៌": "sign_robabat.mp3", // diacritic: robabat
  "៍": "sign_tantakheat.mp3", // diacritic: tantakheat
  "៎": "sign_kakabat.mp3", // diacritic: kakabat
  "៏": "sign_asda.mp3", // diacritic: asda
  "័": "sign_samyok_sann.mp3", // diacritic: samyok_sann
  "្": "sign_coeng.mp3", // diacritic: coeng
  "។": "sign_khan.mp3", // symbol: khan
  "៕": "sign_bariyour.mp3", // symbol: bariyour
  "ៗ": "sign_lek_to.mp3", // symbol: lek_to
  "០": "number_zero.mp3", // number: zero
  "១": "number_one.mp3", // number: one
  "១០": "number_ten.mp3", // number: ten
  "២": "number_two.mp3", // number: two
  "៣": "number_three.mp3", // number: three
  "៤": "number_four.mp3", // number: four
  "៥": "number_five.mp3", // number: five
  "៦": "number_six.mp3", // number: six
  "៧": "number_seven.mp3", // number: seven
  "៨": "number_eight.mp3", // number: eight
  "៩": "number_nine.mp3", // number: nine
};

// Итоговый мэп (приоритет: human > кхмерские fallback > пунктуация)
export const AUDIO_MAP = {
  ...BASIC_PUNCT_FALLBACK,
  ...KHMER_BLOCK_FALLBACK,
  ...KHMER_SYMBOLS_FALLBACK,
  ...HUMAN_AUDIO_MAP,
};

// Нормализуем символ (берем первый char, если пришла строка)
export function normalizeChar(ch) {
  if (!ch) return "";
  const first = Array.from(ch)[0];
  return first || "";
}

// ГЛАВНАЯ ФУНКЦИЯ
export function getSoundFileForChar(ch) {
  const c = normalizeChar(ch);
  const file = AUDIO_MAP[c];

  // Если в базе специально указан null (пустота), возвращаем null, чтобы ничего не играло
  if (file === null) return null;

  // Если файла нет, возвращаем пустую строку или fallback (который уже есть в AUDIO_MAP)
  return file || "";
}
