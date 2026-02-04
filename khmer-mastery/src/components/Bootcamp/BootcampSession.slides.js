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
    type: 'reading-algorithm',
    title: 'THE DECODING ALGORITHM',
    subtitle: 'How to read ANY word step-by-step',
    steps: [
      {
        id: 1,
        text: 'SPOT THE COMMANDER',
        desc: 'Find the consonant (big letter)',
        icon: '👮‍♂️',
        example: 'Example: ក + ា = Kaa'
      },
      {
        id: 2,
        text: 'CHECK THE UNIFORM',
        desc: 'Sun (Smooth) or Moon (Spiky)?',
        icon: '☀️🌑',
        example: 'Smooth = Sun, Spiky = Moon'
      },
      {
        id: 3,
        text: 'APPLY THE VOWEL',
        desc: 'Sun keeps vowel pure. Moon transforms it.',
        icon: '🗣️',
        example: 'Moon example: គ + ា = Kea'
      }
    ],
    warning: 'Never start from the vowel. The consonant controls everything.'
  },
  {
    type: 'meet-teams',
    title: 'MEET THE TWO TEAMS',
    leftTeam: {
      name: 'SUN TEAM (A-Series)',
      voice: 'Light, natural voice',
      visual: 'Smooth/simple heads'
    },
    rightTeam: {
      name: 'MOON TEAM (O-Series)',
      voice: 'Deep, bass voice',
      visual: 'Spiky/complex heads',
      examples: ['គ', 'ឃ', 'ង', 'ជ']
    },
    vowel: 'ា',
    pairs: [
      { sun: 'ក', moon: 'គ', vowel: 'ា', sunRead: 'Kaa', moonRead: 'Kea' },
      { sun: 'ខ', moon: 'ឃ', vowel: 'ា', sunRead: 'Khaa', moonRead: 'Khea' }
    ],
    microDrillText: 'ភាសាខ្មែរមិនដកឃ្លាទេវាជាស្ទ្រីមតែមួយ',
    microDrillCount: 6,
    consonantAudioMap: {
      'ក': 'letter_ka.mp3',
      'ខ': 'letter_kha.mp3',
      'គ': 'letter_ko.mp3',
      'ឃ': 'letter_kho.mp3',
      'ង': 'letter_ngo.mp3',
      'ភ': 'letter_pho.mp3',
      'ស': 'letter_sa.mp3',
      'ម': 'letter_mo.mp3',
      'រ': 'letter_ro.mp3',
      'ទ': 'letter_to.mp3',
      'ជ': 'letter_cho.mp3'
    }
  },
  {
    type: 'rule',
    title: 'THE 80% RULE',
    subtitle: 'Your visual hack',
    rule80: '80% of the time: Spiky head = Moon. Smooth head = Sun.',
    rule20: 'Exceptions exist (like ប and ស). Ignore them for the first week.',
    examples: [
      { letter: 'ក', team: 'Sun' },
      { letter: 'គ', team: 'Moon' },
      { letter: 'ខ', team: 'Sun' },
      { letter: 'ឃ', team: 'Moon' }
    ],
    tip: 'Trust your eyes first. Speed > perfection.'
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
