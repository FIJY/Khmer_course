import React, { useEffect, useMemo, useState } from 'react';
import KhmerColoredText from '../KhmerColoredText';
import VisualDecoder from '../VisualDecoder';
import useCourseMap from '../../hooks/useCourseMap';
import { X, Zap, ArrowRight, ArrowLeft, MousePointerClick, Volume2 } from 'lucide-react';

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

const playAudio = (audioFile) => {
  if (!audioFile) return;
  try {
    const a = new Audio(`/audio/${audioFile}`);
    a.play().catch(() => {});
  } catch {
    // noop
  }
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
  className = ''
}) => {
  const chars = useMemo(() => Array.from(text || ''), [text]);

  const anyRevealed = revealedSet.size > 0;

  return (
    <div className={`select-none text-5xl md:text-6xl leading-tight font-semibold tracking-wide ${className}`}>
      {chars.map((ch, i) => {
        const isC = isKhmerConsonant(ch);
        const revealed = isC && revealedSet.has(i);

        const baseStyle = {
          transition: 'color 200ms ease, transform 120ms ease',
          display: 'inline-block'
        };

        if (!isC) {
          return (
            <span
              key={i}
              style={{
                ...baseStyle,
                color: anyRevealed ? '#64748b' : '#ffffff' // slate-500 vs white
              }}
            >
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

// ---------- THEORY SLIDES ----------
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
    title: 'THE CHAOS',
    subtitle: 'Khmer is written like a stream. Your job: find the COMMANDERS (Consonants).',
    englishAnalogy: 'ImagineIfEnglishWasWrittenLikeThis.',
    khmerText: 'ភាសាខ្មែរមិនដកឃ្លាទេ',
    // Optional per-letter audio (consonants only). If a key is missing, we just skip audio.
    consonantAudioMap: {
      'ភ': 'letter_pho.mp3',
      'ស': 'letter_sa.mp3',
      'ខ': 'letter_kho.mp3',
      'ម': 'letter_mo.mp3',
      'រ': 'letter_ro.mp3',
      'ន': 'letter_no.mp3',
      'ដ': 'letter_do.mp3',
      'ក': 'letter_ka.mp3',
      'ឃ': 'letter_kho_moon.mp3',
      'ល': 'letter_lo.mp3',
      'ទ': 'letter_to.mp3'
    },
    rule: 'Spaces are not word separators. Spaces are used like commas / for breathing.',
    solution: 'Step 1: Ignore vowels. Click consonants (COMMANDERS) first.'
  },
  {
    type: 'reading-algorithm',
    title: 'THE DECODING ALGORITHM',
    subtitle: 'How to read ANY word step-by-step',
    steps: [
      { id: 1, text: 'SPOT THE COMMANDER', desc: 'Find the consonant (big letter)', icon: '👮‍♂️' },
      { id: 2, text: 'CHECK THE UNIFORM', desc: 'Sun (Smooth) or Moon (Spiky)?', icon: '☀️🌑' },
      { id: 3, text: 'APPLY THE VOWEL', desc: 'Sun keeps vowel pure. Moon transforms it.', icon: '🗣️' }
    ],
    warning: 'Never start from the vowel. The consonant controls everything.'
  },
  {
    type: 'meet-teams',
    title: 'MEET THE TWO TEAMS',
    leftTeam: {
      name: 'SUN TEAM (A-Series)',
      voice: 'Light, natural voice',
      visual: 'Smooth/simple heads',
      examples: ['ក', 'ខ', 'ច', 'ត']
    },
    rightTeam: {
      name: 'MOON TEAM (O-Series)',
      voice: 'Deep, bass voice',
      visual: 'Spiky/complex heads',
      examples: ['គ', 'ឃ', 'ង', 'ជ']
    }
  },
  {
    type: 'rule',
    title: 'THE 80% RULE',
    subtitle: 'Your visual hack',
    rule80: '80% of the time: Spiky head = Moon. Smooth head = Sun.',
    rule20: 'Exceptions exist (like ប and ស). Ignore them for the first week.',
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

const BootcampSession = ({ onClose }) => {
  const { loadUnitData } = useCourseMap();

  const [phase, setPhase] = useState('theory'); // 'theory' | 'practice'
  const [slideIndex, setSlideIndex] = useState(0);

  // NO-SPACES slide: reveal state (by char index in the stream)
  const [revealedConsonants, setRevealedConsonants] = useState(() => new Set());

  // Practice (VisualDecoder drills)
  const [drillQuestions, setDrillQuestions] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // ---------- LOAD PRACTICE DATA ----------
  useEffect(() => {
    let isMounted = true;

    const initBootcamp = async () => {
      try {
        // Prefer 10101 (R1). Fallback to 10100 if your data uses old id.
        const data = (await loadUnitData('10101')) || (await loadUnitData('10100'));

        // Try a few known shapes:
        const lessons = data?.lessons || data?.content || [];
        const slides = Array.isArray(lessons)
          ? lessons.flatMap((l) => l?.slides || l?.content || [])
          : [];

        const drills = slides.filter((s) => s?.type === 'visual_decoder');
        const shuffled = [...drills, ...drills].sort(() => Math.random() - 0.5);

        if (isMounted) setDrillQuestions(shuffled);
      } catch (e) {
        // If practice fails, still allow theory
        if (isMounted) setDrillQuestions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initBootcamp();
    return () => {
      isMounted = false;
    };
  }, [loadUnitData]);

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
  const handleDrillComplete = () => {
    setScore((s) => s + 10);
    setTimeout(() => setDrillIndex((prev) => prev + 1), 350);
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

    playAudio(audioMap[consonantChar]);
  };

  const resetNoSpaces = () => setRevealedConsonants(new Set());

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

      case 'no-spaces':
        return (
          <div className="w-full max-w-3xl">
            <h2 className="text-4xl font-black text-white mb-2">😵 {slide.title}</h2>
            <p className="text-xl text-amber-400 mb-8">{slide.subtitle}</p>

            <div className="bg-slate-800 p-6 rounded-xl mb-6 border border-white/5">
              <p className="text-slate-400 text-xs mb-2 uppercase tracking-widest">English analogy</p>
              <p className="text-2xl text-white font-mono tracking-tighter bg-black/30 p-4 rounded">
                {slide.englishAnalogy}
              </p>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl mb-6 border-2 border-emerald-500/30">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <MousePointerClick size={18} />
                  Click ONLY consonants
                </div>
                <button
                  onClick={resetNoSpaces}
                  className="text-xs font-bold px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
                  type="button"
                >
                  Reset
                </button>
              </div>

              <KhmerConsonantStream
                text={slide.khmerText}
                revealedSet={revealedConsonants}
                onConsonantClick={handleConsonantClick}
              />

              <div className="mt-4 text-slate-400 text-sm">
                <p className="mb-1">Rule: {slide.rule}</p>
                <p className="text-emerald-300 font-semibold">Solution: {slide.solution}</p>
              </div>
            </div>

            <div className="bg-green-600/15 p-5 rounded-xl border-l-4 border-green-500 flex items-start gap-3">
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

      case 'reading-algorithm':
        return (
          <div className="w-full max-w-2xl">
            <h2 className="text-3xl font-black text-white mb-8 text-center">{slide.title}</h2>
            <div className="space-y-4 mb-8">
              {slide.steps.map((step) => (
                <div key={step.id} className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-white/5">
                  <div className="bg-blue-600 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg shadow-blue-500/30">
                    {step.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white uppercase">{step.text}</h3>
                      <span className="text-2xl">{step.icon}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-red-500/20 p-4 rounded-lg border border-red-500/50 flex items-center gap-3">
              <div className="text-2xl">⚠️</div>
              <p className="text-white text-sm font-semibold">{slide.warning}</p>
            </div>
          </div>
        );

      case 'meet-teams':
        return (
          <div className="w-full max-w-4xl">
            <h2 className="text-3xl font-black text-white mb-8 text-center">{slide.title}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SUN */}
              <div className="bg-gradient-to-b from-amber-400 to-amber-600 rounded-xl p-6 text-black shadow-lg shadow-amber-500/20">
                <h3 className="text-2xl font-black mb-4 flex items-center gap-2">☀️ {slide.leftTeam.name}</h3>
                <div className="space-y-2 text-sm font-semibold opacity-90">
                  <p>🗣 {slide.leftTeam.voice}</p>
                  <p>👁 {slide.leftTeam.visual}</p>
                  <div className="mt-4 flex items-center gap-3">
                    {slide.leftTeam.examples.map((ch) => (
                      <div key={ch} className="bg-black/10 rounded-xl px-4 py-2">
                        <KhmerColoredText text={ch} colors={COLORS_REVEALED} className="w-10 h-10" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* MOON */}
              <div className="bg-gradient-to-b from-indigo-500 to-purple-700 rounded-xl p-6 text-white shadow-lg shadow-indigo-500/20">
                <h3 className="text-2xl font-black mb-4 flex items-center gap-2">🌑 {slide.rightTeam.name}</h3>
                <div className="space-y-2 text-sm font-medium opacity-90">
                  <p>🗣 {slide.rightTeam.voice}</p>
                  <p>👁 {slide.rightTeam.visual}</p>
                  <div className="mt-4 flex items-center gap-3">
                    {slide.rightTeam.examples.map((ch) => (
                      <div key={ch} className="bg-black/20 rounded-xl px-4 py-2 border border-white/10">
                        <KhmerColoredText text={ch} colors={COLORS_REVEALED} className="w-10 h-10" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-slate-300 text-sm bg-slate-800/60 border border-white/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={18} className="text-amber-400" />
                <span className="font-bold text-white">Micro-drill:</span>
                <span>Click a commander in the stream. (Only consonants are clickable.)</span>
              </div>
              <div className="opacity-90">
                Tip: Smooth = Sun, Spiky = Moon. Don’t overthink in the beginning.
              </div>
            </div>
          </div>
        );

      case 'rule':
        return (
          <div className="w-full max-w-2xl text-center">
            <h2 className="text-4xl font-black text-white mb-4">{slide.title}</h2>

            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 rounded-2xl mb-6 shadow-xl">
              <p className="text-2xl font-bold text-white">{slide.rule80}</p>
            </div>

            <p className="text-slate-400 mb-6">{slide.rule20}</p>

            <div className="inline-block bg-amber-500/20 text-amber-300 px-6 py-2 rounded-full border border-amber-500/50">
              💡 Tip: {slide.tip}
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="text-center">
            <div className="mb-8 animate-bounce text-6xl">🔥</div>
            <h2 className="text-4xl font-black text-white mb-4">{slide.title}</h2>
            <p className="text-xl text-slate-300 mb-8">{slide.description}</p>
            <button
              onClick={nextSlide}
              className="bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 px-12 rounded-full shadow-lg shadow-red-600/40 transition-transform hover:scale-105 active:scale-95"
              type="button"
            >
              {slide.buttonText}
            </button>
          </div>
        );

      default:
        return <div className="text-white">Slide type not supported</div>;
    }
  };

  // ---------- MAIN RETURN ----------
  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white">
        Loading Mission Data...
      </div>
    );
  }

  if (phase === 'practice' && drillQuestions.length > 0 && drillIndex >= drillQuestions.length) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-5xl font-black text-amber-400 mb-4">MISSION ACCOMPLISHED</h1>
        <p className="text-3xl mb-8">Final Score: {score}</p>
        <button onClick={onClose} className="px-8 py-4 bg-blue-600 rounded-xl font-bold text-lg" type="button">
          Return to Base
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-white/5">
        <div className="flex items-center gap-3">
          {phase === 'theory' ? (
            <span className="text-slate-400 font-mono text-sm">
              BRIEFING: {slideIndex + 1}/{THEORY_SLIDES.length}
            </span>
          ) : (
            <div className="flex items-center gap-2 text-amber-400 font-black text-xl">
              <Zap size={20} fill="currentColor" />
              SCORE: {score}
            </div>
          )}
        </div>

        <button onClick={onClose} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors" type="button">
          <X className="text-white w-6 h-6" />
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        {phase === 'theory' ? (
          <>
            {renderTheoryContent()}

            {/* Nav buttons (hide on "ready") */}
            {THEORY_SLIDES[slideIndex]?.type !== 'ready' && (
              <div className="flex gap-3 mt-10 w-full max-w-md">
                <button
                  onClick={prevSlide}
                  disabled={slideIndex === 0}
                  className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-300 font-bold disabled:opacity-30 hover:bg-slate-700 flex items-center justify-center gap-2"
                  type="button"
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  onClick={nextSlide}
                  className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  type="button"
                >
                  Next
                  <ArrowRight size={18} />
                </button>
              </div>
            )}

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
            {drillQuestions.length === 0 ? (
              <div className="text-center text-white max-w-lg">
                <h2 className="text-3xl font-black mb-4">Practice data not found</h2>
                <p className="text-slate-300 mb-8">
                  Theory works, but I couldn’t load VisualDecoder drills from the course map.
                </p>
                <button onClick={onClose} className="px-8 py-4 bg-blue-600 rounded-xl font-bold text-lg" type="button">
                  Return
                </button>
              </div>
            ) : (
              <VisualDecoder
                key={drillIndex}
                data={drillQuestions[drillIndex]}
                onComplete={handleDrillComplete}
                hideContinue={true}
              />
            )}
          </>
        )}
      </div>

      {/* PROGRESS BAR */}
      <div className="h-2 bg-slate-800 w-full">
        <div
          className={`h-full transition-all duration-300 ${phase === 'theory' ? 'bg-blue-500' : 'bg-amber-400'}`}
          style={{
            width:
              phase === 'theory'
                ? `${((slideIndex + 1) / THEORY_SLIDES.length) * 100}%`
                : drillQuestions.length
                  ? `${(drillIndex / drillQuestions.length) * 100}%`
                  : '0%'
          }}
        />
      </div>
    </div>
  );
};

export default BootcampSession;
