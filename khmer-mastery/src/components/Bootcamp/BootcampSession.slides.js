const UNIT_R1_FULL_TEXT = `📋 БЫСТРАЯ СПРАВКА
Неделя 1: R1–R2 — Sun vs Moon, базовые буквы (55 слов) — 5 дней × 20 мин
Неделя 2: R3–R4 — Гласные слева/вокруг, исключения (+95 слов, 150 всего) — 5 дней × 25 мин
Неделя 3: R5–R6 — Гласные снизу, стек, модификаторы (+120 слов, 270 всего) — 5 дней × 30 мин
Неделя 4: Consonant Clusters — Сочетания согласных (+60 слов, 330 всего) — 5 дней × 35 мин
Результат: Беглое чтение 85–95% текстов за 28 дней.

UNIT R1: THE FOUNDATION (БАЗА)
LEARNING OBJECTIVES:
• Различу ☀️ Sun Team и 🌑 Moon Team по визуальным признакам
• Отличу гладкие головы букв от зубчатых
• Прочитаю слово «Кофе» (កាហ្វេ) и 20+ других слов
• Научусь произносить K-группу правильно

Главная идея:
Буква‑командир решает, как звучит гласная ПОСЛЕ неё.
Две команды = две фонетические системы.
`;

const THEORY_SLIDES = [
  {
    type: 'title',
    title: 'BOOTCAMP: UNIT R1',
    subtitle: 'THE CODEBREAKER PROTOCOL',
    description: 'Forget logic. Trust your eyes. We start from zero.',
    icon: '🚀'
  },
  {
    type: 'no-spaces',
    title: 'SHOCKING TRUTH: NO SPACES',
    subtitle: 'Khmer text is a continuous stream. First you hunt the COMMANDERS (consonants).',
    englishAnalogy: 'ImagineIfEnglishWasWrittenLikeThis.',
    khmerText: 'ភាសាខ្មែរមិនដកឃ្លាទេវាជាស្ទ្រីមតែមួយ',
    fullText: UNIT_R1_FULL_TEXT,
    rule: 'Spaces are not word separators. They are used like commas / for breathing.',
    solution: 'Step 1: Ignore vowels. Click ONLY consonants (COMMANDERS) first.',
    consonantAudioMap: {
      // Put your real files in /public and keep these as relative URLs.
      // Example: public/khmer/consonants/ka.mp3  ->  "khmer/consonants/ka.mp3"
      'ក': 'letter_ka.mp3',
      'ខ': 'letter_kha.mp3',
      'គ': 'letter_ko.mp3',
      'ឃ': 'letter_kho.mp3',
      'ង': 'letter_ngo.mp3'
    }
  },
  {
    type: 'ready',
    title: 'BRIEFING COMPLETE',
    subtitle: 'Ready to prove your skills?',
    description: 'Identify the commanders. Apply the rules. Speed matters.',
    buttonText: 'START MISSION'
  }
];

export { THEORY_SLIDES };
