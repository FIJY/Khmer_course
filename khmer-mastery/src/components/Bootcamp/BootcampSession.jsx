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

const playAudio = (audioFile) => {
  if (!audioFile) return;
  try {
    const url = audioFile.startsWith('/') ? audioFile : `/${audioFile}`;
    const a = new Audio(url);
    a.play().catch(() => {});
  } catch {
    // noop
  }
};

const playConsonant = (ch, customFile) => {
  if (customFile) {
    playAudio(customFile);
  } else {
    // Fallback if needed
  }
};

/**
 * Render Khmer stream where ONLY consonant letters are interactive.
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
    <div className={`select-none text-4xl md:text-5xl leading-relaxed font-semibold tracking-wide break-words text-center ${className}`}>
      {chars.map((ch, i) => {
        const isC = isKhmerConsonant(ch);
        const revealed = isC && revealedSet.has(i);

        const baseStyle = {
          transition: 'all 200ms ease',
          display: 'inline-block',
          padding: '0 2px'
        };

        if (!isC) {
          return (
            <span
              key={i}
              style={{
                ...baseStyle,
                color: anyRevealed ? '#475569' : '#ffffff' // Гасим пассажиров (slate-600)
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
            className="inline-flex bg-transparent border-0 cursor-pointer outline-none tap-highlight-transparent"
            style={{
              ...baseStyle,
              color: revealed ? '#34d399' : '#ffffff', // Зеленый если найден
              transform: revealed ? 'scale(1.2)' : 'scale(1.0)',
              textShadow: revealed ? '0 0 20px rgba(52, 211, 153, 0.5)' : 'none'
            }}
          >
            {ch}
          </button>
        );
      })}
    </div>
  );
};

// ---------- DATA & CONFIG ----------

// Fallback drills to ensure playable state
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
      word: 'ឃ',
      target_char: 'ឃ',
      hint: '🌑 Moon (Spiky)',
      char_split: ['ឃ'],
      english_translation: 'Kho',
      letter_series: 2,
      word_audio: '',
      char_audio_map: { 'ឃ': 'letter_kho.mp3' }
    }
  }
];

// Mini drill component for Team slide
const MiniCommanderDrill = ({ text, audioMap = {}, onComplete }) => {
  const consonantIdx = useMemo(() => getConsonantIndices(text), [text]);
  const [revealed, setRevealed] = useState(() => new Set());
  const remaining = consonantIdx.length - revealed.size;

  useEffect(() => {
    if (remaining === 0 && consonantIdx.length > 0) onComplete?.();
  }, [remaining, consonantIdx.length, onComplete]);

  const handleClick = (idx, ch) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    playConsonant(ch, audioMap[ch]);
  };

  return (
    <div className="w-full">
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4">
        <KhmerConsonantStream
          text={text}
          revealedSet={revealed}
          onConsonantClick={handleClick}
        />
        <div className="mt-3 text-center text-slate-300 text-sm">
          {remaining === 0 ? (
            <span className="text-emerald-300 font-bold animate-pulse">✅ Done!</span>
          ) : (
            <span>Tap {remaining} more...</span>
          )}
        </div>
      </div>
    </div>
  );
};

// SLIDES CONFIG
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
    rule: 'Spaces are not word separators. They are used like commas / for breathing.',
    solution: 'Step 1: Ignore vowels. Click ONLY consonants (COMMANDERS) first.',
    consonantAudioMap: {
      'ក': 'khmer/consonants/ka.mp3',
      'ខ': 'khmer/consonants/kha.mp3',
      'គ': 'khmer/consonants/ko.mp3',
      'ឃ': 'khmer/consonants/kho.mp3',
      'ង': 'khmer/consonants/ngo.mp3'
    }
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
      visual: 'Smooth/simple heads'
    },
    rightTeam: {
      name: 'MOON TEAM (O-Series)',
      voice: 'Deep, bass voice',
      visual: 'Spiky/complex heads'
    },
    vowel: 'ា',
    pairs: [
      { sun: 'ក', moon: 'គ', vowel: 'ា', sunRead: 'Kaa', moonRead: 'Kea' },
      { sun: 'ខ', moon: 'ឃ', vowel: 'ា', sunRead: 'Khaa', moonRead: 'Khea' }
    ],
    microDrillText: 'ភាសាខ្មែរមិនដកឃ្លាទេវាជាស្ទ្រីមតែមួយ',
    microDrillCount: 6,
    consonantAudioMap: {
      'ក': 'khmer/consonants/ka.mp3',
      'ខ': 'khmer/consonants/kha.mp3',
      'គ': 'khmer/consonants/ko.mp3',
      'ឃ': 'khmer/consonants/kho.mp3',
      'ង': 'khmer/consonants/ngo.mp3'
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
  const [unlockedSlides, setUnlockedSlides] = useState({});

  // NO-SPACES reveal state
  const [revealedConsonants, setRevealedConsonants] = useState(() => new Set());

  // Practice state
  const [drillQuestions, setDrillQuestions] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [usingFallbackPractice, setUsingFallbackPractice] = useState(false);

  // Auto-unlock logic
  useEffect(() => {
    const currentSlide = THEORY_SLIDES[slideIndex];

    // Auto unlock 'no-spaces' slide when all consonants found
    if (currentSlide?.type === 'no-spaces') {
      const total = getConsonantIndices(currentSlide.khmerText).length;
      if (revealedConsonants.size === total && total > 0) {
        setUnlockedSlides(prev => ({ ...prev, [slideIndex]: true }));
      }
    }

    // Slides that don't need interaction are always unlocked
    if (currentSlide?.type !== 'no-spaces' && currentSlide?.type !== 'meet-teams') {
      setUnlockedSlides(prev => ({ ...prev, [slideIndex]: true }));
    }
  }, [revealedConsonants, slideIndex]);

  const currentSlide = THEORY_SLIDES[slideIndex];
  const isUnlocked = unlockedSlides[slideIndex];
  const nextDisabled = !isUnlocked && (currentSlide?.type === 'no-spaces' || currentSlide?.type === 'meet-teams');

  // ---------- LOAD DATA ----------
  useEffect(() => {
    let isMounted = true;
    const initBootcamp = async () => {
      try {
        const candidateIds = ['10000','10101','10100','101'];
        let data = null;
        for (const id of candidateIds) {
          data = await loadUnitData(id);
          if (data) break;
        }

        const lessons = data?.lessons || data?.content || [];
        const slides = Array.isArray(lessons) ? lessons.flatMap((l) => l?.slides || l?.content || []) : [];
        const drills = slides.filter((s) => s?.type === 'visual_decoder');

        if (!drills.length) {
          if (isMounted) {
            setUsingFallbackPractice(true);
            setDrillQuestions([...FALLBACK_DRILLS].sort(() => Math.random() - 0.5));
          }
          return;
        }

        if (isMounted) {
          setUsingFallbackPractice(false);
          setDrillQuestions([...drills, ...drills].sort(() => Math.random() - 0.5));
        }
      } catch (e) {
        if (isMounted) {
          setUsingFallbackPractice(true);
          setDrillQuestions([...FALLBACK_DRILLS].sort(() => Math.random() - 0.5));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initBootcamp();
    return () => { isMounted = false; };
  }, [loadUnitData]);

  // ---------- NAV ----------
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

  const handleDrillComplete = () => {
    setScore((s) => s + 10);
    setTimeout(() => setDrillIndex((prev) => prev + 1), 350);
  };

  const handleConsonantClick = (charIndex, consonantChar) => {
    const slide = THEORY_SLIDES[slideIndex];
    setRevealedConsonants((prev) => {
      const next = new Set(prev);
      next.add(charIndex);
      return next;
    });
    playConsonant(consonantChar, slide?.consonantAudioMap?.[consonantChar]);
  };

  const resetNoSpaces = () => {
    setRevealedConsonants(new Set());
    setUnlockedSlides(prev => ({ ...prev, [slideIndex]: false }));
  };

  // ---------- RENDER ----------
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
          <div className="w-full max-w-3xl">
            <h2 className="text-4xl font-black text-white mb-2">😵 {slide.title}</h2>
            <p className="text-xl text-amber-400 mb-8">{slide.subtitle}</p>

            <div className="bg-slate-800 p-6 rounded-xl mb-6 border border-white/5">
              <p className="text-slate-400 text-xs mb-2 uppercase tracking-widest">English analogy</p>
              <p className="text-2xl text-white font-mono tracking-tighter bg-black/30 p-4 rounded">
                {slide.englishAnalogy}
              </p>
            </div>

            {/* НОВОЕ: Обычный текст над тренажером */}
            <div className="bg-slate-800/50 p-4 rounded-xl mb-6 text-center border border-white/5">
               <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Original Text</p>
               <h3 className="text-3xl text-white font-bold leading-relaxed">
                 {slide.khmerText}
               </h3>
            </div>

            <div className="bg-slate-800 p-6 rounded-xl mb-6 border-2 border-emerald-500/30">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <MousePointerClick size={18} />
                  Click ONLY consonants
                </div>
                <button onClick={resetNoSpaces} className="text-xs font-bold px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white">
                  Reset
                </button>
              </div>

              <KhmerConsonantStream
                text={slide.khmerText}
                revealedSet={revealedConsonants}
                onConsonantClick={handleConsonantClick}
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-slate-300 text-sm">
                  Found: <span className="font-bold text-white">{found}</span> / {total}
                </div>
                <div className={`text-xs font-bold px-3 py-2 rounded-full border ${remaining === 0 ? 'text-emerald-200 border-emerald-400/40 bg-emerald-500/10' : 'text-amber-200 border-amber-400/40 bg-amber-500/10'}`}>
                  {remaining === 0 ? 'All commanders found!' : `${remaining} remaining`}
                </div>
              </div>
            </div>
          </div>
        );
      }

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
            <div className="space-y-4 mb-6">
              {slide.pairs.map((pair, i) => (
                <div key={i} className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-b from-amber-400 to-amber-600 rounded-xl p-6 text-black shadow-lg text-center cursor-pointer" onClick={() => playAudio(slide.consonantAudioMap?.[pair.sun])}>
                    <div className="text-5xl font-bold mb-2">{pair.sun}</div>
                    <div className="text-xs uppercase font-black opacity-60">SUN</div>
                  </div>
                  <div className="bg-gradient-to-b from-indigo-500 to-purple-700 rounded-xl p-6 text-white shadow-lg text-center cursor-pointer" onClick={() => playAudio(slide.consonantAudioMap?.[pair.moon])}>
                    <div className="text-5xl font-bold mb-2">{pair.moon}</div>
                    <div className="text-xs uppercase font-black opacity-60">MOON</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/70 rounded-xl p-4 border border-white/5">
              <div className="text-amber-300 font-black mb-2">⚡ Micro-drill: Find Commanders</div>
              <MiniCommanderDrill
                text={slide.microDrillText}
                audioMap={slide.consonantAudioMap}
                onComplete={() => setUnlockedSlides(u => ({ ...u, [slideIndex]: true }))}
              />
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
              className="bg-red-600 hover:bg-red-500 text-white text-xl font-black py-4 px-12 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {slide.buttonText}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) return <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white">Loading Data...</div>;

  if (phase === 'practice' && drillQuestions.length > 0 && drillIndex >= drillQuestions.length) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[200] flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-5xl font-black text-amber-400 mb-4">MISSION ACCOMPLISHED</h1>
        <p className="text-3xl mb-8">Score: {score}</p>
        <button onClick={onClose} className="px-8 py-4 bg-blue-600 rounded-xl font-bold text-lg">Return to Base</button>
      </div>
    );
  }

  return (
    // Z-INDEX 200: Перекрывает нижнее меню приложения
    <div className="fixed inset-0 bg-slate-900 z-[200] flex flex-col">
      <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-white/5">
        <div className="flex items-center gap-3">
          {phase === 'theory' ? (
            <span className="text-slate-400 font-mono text-sm">BRIEFING: {slideIndex + 1}/{THEORY_SLIDES.length}</span>
          ) : (
            <div className="flex items-center gap-2 text-amber-400 font-black text-xl"><Zap size={20} fill="currentColor" /> SCORE: {score}</div>
          )}
        </div>
        <button onClick={onClose} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600"><X className="text-white w-6 h-6" /></button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        {phase === 'theory' ? (
          <>
            {renderTheoryContent()}
            {THEORY_SLIDES[slideIndex]?.type !== 'ready' && (
              <div className="flex gap-3 mt-10 w-full max-w-md pb-10">
                <button
                  onClick={prevSlide}
                  disabled={slideIndex === 0}
                  className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-300 font-bold disabled:opacity-30 hover:bg-slate-700 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} /> Back
                </button>
                <button
                  onClick={nextSlide}
                  disabled={nextDisabled}
                  className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:bg-blue-600 transition-all"
                >
                  {nextDisabled ? 'Tap all consonants' : 'Next'} <ArrowRight size={18} />
                </button>
              </div>
            )}
          </>
        ) : (
          <VisualDecoder
            key={drillIndex}
            data={((drillQuestions.length ? drillQuestions : FALLBACK_DRILLS)[drillIndex]?.data) ?? (drillQuestions.length ? drillQuestions : FALLBACK_DRILLS)[drillIndex]}
            onComplete={handleDrillComplete}
            hideContinue={true}
          />
        )}
      </div>

      <div className="h-2 bg-slate-800 w-full">
        <div
          className={`h-full transition-all duration-300 ${phase === 'theory' ? 'bg-blue-500' : 'bg-amber-400'}`}
          style={{ width: phase === 'theory' ? `${((slideIndex + 1) / THEORY_SLIDES.length) * 100}%` : `${(drillIndex / (drillQuestions.length || 1)) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default BootcampSession;