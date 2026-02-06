import React, { useEffect, useMemo, useState } from 'react';
import VisualDecoder from '../VisualDecoder';
import { ArrowRight, ChevronLeft, MousePointerClick, Volume2 } from 'lucide-react';
import { THEORY_SLIDES } from './BootcampSession.slides';
import Button from '../UI/Button';
import LoadingState from '../UI/LoadingState';
import SessionCompletion from '../Session/SessionCompletion';
import SessionFrame from '../Session/SessionFrame';
import { t } from '../../i18n';

/**
 * BOOTCAMP SESSION (Unit R1)
 * - Theory slideshow
 * - Speed drills (VisualDecoder cards)
 * - "No spaces" slide: ONLY consonants are selectable/highlighted
 */

// ---------- COLOR CONFIG ----------
const COLORS_WHITE = {
  CONSONANT_A: '#ffffff',
  CONSONANT_O: '#ffffff',
  SUBSCRIPT: '#ffffff',
  VOWEL_DEP: '#ffffff'
};

const COLORS_REVEALED = {
  CONSONANT_A: '#34d399', // emerald-400
  CONSONANT_O: '#34d399',
  SUBSCRIPT: '#34d399',
  VOWEL_DEP: '#94a3b8' // slate-400 (vowel signs/diacritics)
};

// ---------- KHMER HELPERS ----------
const isKhmerConsonant = (ch) => {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  // Khmer consonants: U+1780..U+17A2
  return cp >= 0x1780 && cp <= 0x17A2;
};

const getConsonantIndices = (text) => {
  const arr = Array.from(text || '');
  const idx = [];
  for (let i = 0; i < arr.length; i++) {
    if (isKhmerConsonant(arr[i])) idx.push(i);
  }
  return idx;
};

// You can wire these to your real audio assets.
// The tool will gracefully no-op if a file doesn't exist.
const CONSONANT_AUDIO = {
  'ក': 'letter_ka.mp3',
  'ខ': 'letter_kha.mp3',
  'គ': 'letter_ko.mp3',
  'ឃ': 'letter_kho.mp3',
  'ង': 'letter_ngo.mp3',
  'ច': 'letter_cha.mp3',
  'ជ': 'letter_cho.mp3'
};

const resolveAudioUrl = (audioFile) => {
  if (!audioFile) return null;
  if (audioFile.startsWith('http')) return audioFile;
  if (audioFile.startsWith('/')) return audioFile;
  if (audioFile.includes('/')) return `/${audioFile}`;
  return `/sounds/${audioFile}`;
};

const playAudio = (audioFile) => {
  const url = resolveAudioUrl(audioFile);
  if (!url) return;
  try {
    const a = new Audio(url);
    a.play().catch(() => {});
  } catch {
    // noop
  }
};

const playConsonant = (ch, overrideFile) => {
  const file = overrideFile || CONSONANT_AUDIO[ch];
  if (file) playAudio(file);
};

/**
 * Render Khmer stream where ONLY consonant letters are interactive.
 * - Revealed consonants: green
 * - Unrevealed consonants: white + underline on hover
 * - Non-consonant marks: grey only after the first reveal (to "fade" them)
 */
const KhmerConsonantStream = ({
  text,
  revealedSet,
  onConsonantClick,
  onNonConsonantClick,
  dimNonConsonants = true,
  className = ''
}) => {
  const chars = useMemo(() => Array.from(text || ''), [text]);

  const anyRevealed = revealedSet.size > 0;

  return (
    <div className={`select-none text-5xl md:text-6xl leading-[1.35] font-semibold tracking-wide break-words ${className}`}>
      {chars.map((ch, i) => {
        const isC = isKhmerConsonant(ch);
        const revealed = isC && revealedSet.has(i);

        const baseStyle = {
          transition: 'color 200ms ease, transform 120ms ease',
          display: 'inline-block'
        };

        if (!isC) {
          const nonConsonantStyle = {
            ...baseStyle,
            color: dimNonConsonants && anyRevealed ? '#64748b' : '#ffffff' // slate-500 vs white
          };

          if (onNonConsonantClick) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onNonConsonantClick(ch)}
                className="inline-flex p-0 m-0 bg-transparent border-0 cursor-pointer"
                style={nonConsonantStyle}
                title="Vowels/marks are not commanders"
              >
                {ch}
              </button>
            );
          }

          return (
            <span key={i} style={nonConsonantStyle}>
              {ch}
            </span>
          );
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => onConsonantClick(i, ch)}
            className="inline-flex p-0 m-0 bg-transparent border-0 cursor-pointer"
            style={{
              ...baseStyle,
              color: revealed ? '#34d399' : '#ffffff',
              transform: revealed ? 'scale(1.05)' : 'scale(1.0)'
            }}
            title="Click the consonant (commander)"
          >
            <span className={!revealed ? 'hover:underline decoration-2 underline-offset-8' : ''}>
              {ch}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ---------- FULL UNIT TEXT (for the "keep the whole text" request) ----------
// You can swap this string to the exact R1 text you ship in the course.
const UNIT_R1_FULL_TEXT = `📋 БЫСТРАЯ СПРАВКА\nНеделя 1: R1–R2 — Sun vs Moon, базовые буквы — 5 дней × 20 мин\n\nUNIT R1: THE FOUNDATION (БАЗА)\n• Различу ☀️ Sun Team и 🌑 Moon Team\n• Отличу гладкие головы от зубчатых\n• Прочитаю «Кофе» (កាហ្វេ) и 20+ слов\n\n🎯 THEORY: THE MATRIX\nБуква-командир решает, как звучит гласная ПОСЛЕ неё.\n80% случаев: зубчики = Moon, гладкая = Sun.\n20% исключений: (пока игнорируй)\n\n🦸 K-GROUP: ក ខ គ ឃ ង\n🎤 Vowels RIGHT: ា ះ ាំ\n\n🏋️ PRACTICE:\n1) Определи команду\n2) Прочитай слоги\n3) Прочитай слова\n\n🏆 REAL WORLD: កាហ្វេ (Kaa-fe)\n`;

// Minimal drills to keep the bootcamp playable even if course-map data isn't wired yet.
// Shape matches what <VisualDecoder/> usually expects: { type: 'visual_decoder', data: { ... } }
const FALLBACK_DRILLS = [
  {
    type: 'visual_decoder',
    data: {
      word: 'ក',
      target_char: 'ក',
      hint: '🥚 Smooth Egg (Sun)',
      char_split: ['ក'],
      english_translation: 'Ka',
      letter_series: 1,
      word_audio: '',
      char_audio_map: { 'ក': 'letter_ka.mp3' }
    }
  },
  {
    type: 'visual_decoder',
    data: {
      word: 'គ',
      target_char: 'គ',
      hint: '🦅 Spiky Hair (Moon)',
      char_split: ['គ'],
      english_translation: 'Ko',
      letter_series: 2,
      word_audio: '',
      char_audio_map: { 'គ': 'letter_ko.mp3' }
    }
  },
  {
    type: 'visual_decoder',
    data: {
      word: 'ខ',
      target_char: 'ខ',
      hint: '🐚 Snail Spiral (Sun)',
      char_split: ['ខ'],
      english_translation: 'Kha',
      letter_series: 1,
      word_audio: '',
      char_audio_map: { 'ខ': 'letter_kha.mp3' }
    }
  },
  {
    type: 'visual_decoder',
    data: {
      word: 'ង',
      target_char: 'ង',
      hint: '🐍 Tail = Always Moon',
      char_split: ['ង'],
      english_translation: 'Ngo',
      letter_series: 2,
      word_audio: '',
      char_audio_map: { 'ង': 'letter_ngo.mp3' }
    }
  },
  {
    type: 'visual_decoder',
    data: {
      word: 'កា',
      target_char: 'ក',
      hint: 'Commander + RIGHT vowel (Sun keeps vowel pure)',
      char_split: ['កា'],
      english_translation: 'Kaa',
      letter_series: 1,
      word_audio: '',
      char_audio_map: { 'ក': 'letter_ka.mp3' }
    }
  },
  {
    type: 'visual_decoder',
    data: {
      word: 'គា',
      target_char: 'គ',
      hint: 'Commander + RIGHT vowel (Moon transforms vowel)',
      char_split: ['គា'],
      english_translation: 'Kea',
      letter_series: 2,
      word_audio: '',
      char_audio_map: { 'គ': 'letter_ko.mp3' }
    }
  }
];

// ---------- THEORY SLIDES ----------

const extractVisualDecoderDrills = (items = []) => items
  .map((item) => {
    if (!item) return null;
    if (item.type === 'visual_decoder') return item;
    if (item.data?.type === 'visual_decoder') {
      return { type: item.data.type, data: item.data };
    }
    return null;
  })
  .filter(Boolean);

const BootcampSession = ({ onClose, practiceItems = [], title }) => {

  const [phase, setPhase] = useState('theory'); // 'theory' | 'practice'
  const [slideIndex, setSlideIndex] = useState(0);
  const [unlockedSlides, setUnlockedSlides] = useState({});

  // NO-SPACES slide: reveal state (by char index in the stream)
  const [revealedConsonants, setRevealedConsonants] = useState(() => new Set());

  // Practice (VisualDecoder drills)
  const [drillQuestions, setDrillQuestions] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usingFallbackPractice, setUsingFallbackPractice] = useState(false);

  const activeDrills = drillQuestions.length ? drillQuestions : FALLBACK_DRILLS;
  const practiceTotal = activeDrills.length;
  const totalSteps = THEORY_SLIDES.length + practiceTotal;
  const currentStep = phase === 'theory'
    ? slideIndex + 1
    : THEORY_SLIDES.length + Math.min(drillIndex + 1, practiceTotal);

  const currentSlide = THEORY_SLIDES[slideIndex];
  const requiresUnlock = currentSlide?.type === 'no-spaces';
  const isUnlocked = unlockedSlides[slideIndex] || !requiresUnlock;
  const nextDisabled = !isUnlocked;

  // ---------- LOAD PRACTICE DATA ----------
  useEffect(() => {
    let isMounted = true;
    const drills = extractVisualDecoderDrills(practiceItems);

    if (!drills.length) {
      const shuffledFallback = [...FALLBACK_DRILLS, ...FALLBACK_DRILLS].sort(() => Math.random() - 0.5);
      if (isMounted) {
        setUsingFallbackPractice(true);
        setDrillQuestions(shuffledFallback);
        setLoading(false);
      }
      return () => {
        isMounted = false;
      };
    }

    const shuffled = [...drills, ...drills].sort(() => Math.random() - 0.5);
    if (isMounted) {
      setUsingFallbackPractice(false);
      setDrillQuestions(shuffled);
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [practiceItems]);

  // ---------- THEORY NAV ----------
  const nextSlide = () => {
    if (slideIndex < THEORY_SLIDES.length - 1) {
      setSlideIndex((prev) => prev + 1);
    } else {
      setPhase('practice');
    }
  };

  const prevSlide = () => {
    if (slideIndex > 0) setSlideIndex((prev) => prev - 1);
  };

  // ---------- PRACTICE ----------
  const advanceDrill = () => {
    if (drillIndex >= practiceTotal - 1) {
      setDrillIndex(practiceTotal);
      return;
    }
    setDrillIndex((prev) => prev + 1);
  };

  const handleDrillComplete = () => {
    setScore((s) => s + 10);
    setTimeout(() => advanceDrill(), 350);
  };

  // ---------- NO-SPACES CLICK ----------
  const handleConsonantClick = (charIndex, consonantChar) => {
    const slide = THEORY_SLIDES[slideIndex];
    const audioMap = slide?.consonantAudioMap || {};

    setRevealedConsonants((prev) => {
      const next = new Set(prev);
      next.add(charIndex);
      return next;
    });

    // 1) Try slide-specific audio mapping.
    // 2) Fall back to global consonant audio mapping.
    // 3) Fall back to a generic click sound.
    playConsonant(consonantChar, audioMap[consonantChar]);
  };

  const resetNoSpaces = () => setRevealedConsonants(new Set());

  useEffect(() => {
    if (currentSlide?.type !== 'no-spaces') return;
    const total = getConsonantIndices(currentSlide.khmerText).length;
    if (total > 0 && revealedConsonants.size >= total) {
      setUnlockedSlides((prev) => ({ ...prev, [slideIndex]: true }));
    }
  }, [currentSlide, revealedConsonants, slideIndex]);

  // ---------- RENDERERS ----------
  const renderTheoryContent = () => {
    const slide = THEORY_SLIDES[slideIndex];

    switch (slide.type) {
      case 'title':
        return (
          <div className="text-center animate-in fade-in zoom-in duration-500">
            <div className="text-8xl mb-6">{slide.icon}</div>
            <h1 className="text-5xl font-black text-white mb-4 uppercase tracking-tighter">{slide.title}</h1>
            <p className="text-2xl text-amber-400 mb-8 font-mono">{slide.subtitle}</p>
            <p className="text-xl text-slate-300 max-w-lg mx-auto">{slide.description}</p>
          </div>
        );

      case 'no-spaces': {
        const total = getConsonantIndices(slide.khmerText).length;
        const found = revealedConsonants.size;
        const remaining = Math.max(0, total - found);
        return (
          <div className="w-full max-w-xl">
            <h2 className="text-4xl font-black text-white mb-2">😵 {slide.title}</h2>
            <p className="text-xl text-amber-400 mb-8">{slide.subtitle}</p>

            <div className="bg-gray-900/60 p-5 rounded-[2rem] mb-5 border border-white/5">
              <p className="text-slate-400 text-xs mb-2 uppercase tracking-widest">English analogy</p>
              <p className="text-2xl text-white font-mono tracking-tighter bg-black/30 p-4 rounded">
                {slide.englishAnalogy}
              </p>
            </div>

            <div className="bg-gray-900/60 p-5 rounded-[2rem] mb-5 border-2 border-emerald-500/30">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <MousePointerClick size={18} />
                  Click ONLY consonants
                </div>
                <button
                  onClick={resetNoSpaces}
                  className="text-xs font-bold px-3 py-2 rounded-xl bg-gray-900 border border-white/10 text-white hover:border-white/30 transition-colors"
                  type="button"
                >
                  Reset
                </button>
              </div>

              <KhmerConsonantStream
                text={slide.khmerText}
                revealedSet={revealedConsonants}
                onConsonantClick={handleConsonantClick}
                onNonConsonantClick={() => {}}
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-slate-300 text-sm">
                  Found consonants: <span className="font-bold text-white">{found}</span> / {total}
                </div>
                <div
                  className={`text-xs font-bold px-3 py-2 rounded-full border ${remaining === 0 ? 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10' : 'text-amber-200 border-amber-400/40 bg-amber-500/10'}`}
                >
                  {remaining === 0 ? 'All commanders found — you can continue' : `${remaining} remaining — keep clicking`}
                </div>
              </div>

              <div className="mt-4 text-slate-400 text-sm">
                <p className="mb-1">Rule: {slide.rule}</p>
                <p className="text-emerald-300 font-semibold">Solution: {slide.solution}</p>
              </div>
            </div>

            <div className="bg-green-600/15 p-5 rounded-[2rem] border border-green-500/30 flex items-start gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <p className="text-white font-bold mb-1">Your win:</p>
                <p className="text-slate-200">
                  You can already “see” the structure: consonants are the anchors. Vowels are details added after.
                </p>
              </div>
            </div>
          </div>
        );
      }

      case 'ready':
        return (
          <div className="text-center">
            <div className="mb-8 animate-bounce text-6xl">🔥</div>
            <h2 className="text-4xl font-black text-white mb-4">{slide.title}</h2>
            <p className="text-xl text-slate-300 mb-8">{slide.description}</p>
            <div className="w-full max-w-xs mx-auto">
              <Button onClick={nextSlide} className="text-base">
                {slide.buttonText}
              </Button>
            </div>
          </div>
        );

      default:
        return <div className="text-white">Slide type not supported</div>;
    }
  };

  const bodyContent = phase === 'theory' ? (
    <>
      {renderTheoryContent()}

      {/* Audio hint row on no-spaces */}
      {THEORY_SLIDES[slideIndex]?.type === 'no-spaces' && (
        <div className="mt-6 text-slate-400 text-sm flex items-center gap-2">
          <Volume2 size={16} />
          If you added audio files, consonant clicks will play pronunciation.
        </div>
      )}
    </>
  ) : (
    <>
      {usingFallbackPractice && (
        <div className="mb-4 max-w-xl text-center text-slate-300 text-sm bg-slate-800/70 border border-white/10 rounded-xl p-4">
          <div className="font-bold text-white mb-1">Using built-in practice</div>
          I couldn’t find VisualDecoder drills in the course map for this unit, so I loaded a minimal fallback set.
          When your course JSON is wired in, this banner will disappear.
        </div>
      )}

      {activeDrills.length ? (
        <VisualDecoder
          key={drillIndex}
          data={(activeDrills[drillIndex]?.data) ?? activeDrills[drillIndex]}
          onComplete={handleDrillComplete}
          onLetterClick={playAudio}
          hideDefaultButton={true}
        />
      ) : (
        <div className="text-center text-slate-300">
          No drills available right now. Tap continue to move on.
        </div>
      )}
    </>
  );

  // ---------- MAIN RETURN ----------
  if (loading) {
    return <LoadingState label={t('loading.lesson')} />;
  }

  if (phase === 'practice' && practiceTotal > 0 && drillIndex >= practiceTotal) {
    return (
      <SessionCompletion
        title={t('lesson.complete')}
        description={t('lesson.score', { score, total: practiceTotal })}
        score={score}
        total={practiceTotal}
        actionLabel={t('actions.backToMap')}
        onAction={onClose}
      />
    );
  }

  return (
    <SessionFrame
      title={title || 'Bootcamp'}
      progressCurrent={currentStep}
      progressTotal={totalSteps}
      progressLabel={t('lesson.progress', { current: currentStep, total: totalSteps })}
      score={score}
      onClose={onClose}
      footer={phase === 'theory' && THEORY_SLIDES[slideIndex]?.type !== 'ready' ? (
        <footer className="p-6 border-t border-white/5 bg-black/80">
          <div className="flex gap-3">
            <button
              onClick={prevSlide}
              disabled={slideIndex === 0}
              className={`p-5 rounded-2xl border transition-all ${slideIndex === 0 ? 'opacity-0' : 'bg-gray-900 border-white/10 text-white'}`}
              type="button"
            >
              <ChevronLeft size={24} />
            </button>
            <Button onClick={nextSlide} disabled={nextDisabled} className="flex-1">
              {t('actions.continue')} <ArrowRight size={20} />
            </Button>
          </div>
          {nextDisabled && (
            <p className="mt-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">
              {t('lesson.hintContinue')}
            </p>
          )}
        </footer>
      ) : phase === 'practice' ? (
        <footer className="p-6 border-t border-white/5 bg-black/80">
          <Button onClick={advanceDrill} className="w-full">
            {drillIndex >= practiceTotal - 1 ? t('actions.finish') : t('actions.continue')} <ArrowRight size={20} />
          </Button>
        </footer>
      ) : null}
    >
      {bodyContent}
    </SessionFrame>
  );
};

export default BootcampSession;
