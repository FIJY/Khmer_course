import React, { useEffect, useMemo, useState } from 'react';
import KhmerColoredText from '../KhmerColoredText';
import VisualDecoder from '../VisualDecoder';
import useCourseMap from '../../hooks/useCourseMap';
import { X, Zap, ArrowRight, ArrowLeft, MousePointerClick, Volume2 } from 'lucide-react';
import { THEORY_SLIDES } from './BootcampSession.slides';

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
  'ក': 'khmer/consonants/ka.mp3',
  'ខ': 'khmer/consonants/kha.mp3',
  'គ': 'khmer/consonants/ko.mp3',
  'ឃ': 'khmer/consonants/kho.mp3',
  'ង': 'khmer/consonants/ngo.mp3',
  'ច': 'khmer/consonants/cha.mp3',
  'ជ': 'khmer/consonants/cho.mp3'
};

const playAudio = (audioFile) => {
  if (!audioFile) return;
  try {
    // audioFile should be relative to /public (e.g. "khmer/consonants/ka.mp3")
    const url = audioFile.startsWith('/') ? audioFile : `/${audioFile}`;
    const a = new Audio(url);
    a.play().catch(() => {});
  } catch {
    // noop
  }
};

const playConsonant = (ch) => {
  const file = CONSONANT_AUDIO[ch];
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

// ---------- MINI DRILL: click commanders only ----------
const MiniCommanderDrill = ({
  title,
  text,
  audioMap = {},
  onComplete
}) => {
  const consonantIdx = useMemo(() => getConsonantIndices(text), [text]);
  const [revealed, setRevealed] = useState(() => new Set());

  const remaining = consonantIdx.filter((i) => !revealed.has(i)).length;
  const done = consonantIdx.length > 0 && remaining === 0;

  useEffect(() => {
    if (done) onComplete?.();
  }, [done, onComplete]);

  const handleClick = (idx, ch) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(idx);
      return next;
    });
    playAudio(audioMap[ch]);
  };

  return (
    <div className="w-full">
      {title && <div className="text-slate-400 text-xs uppercase tracking-widest mb-2">{title}</div>}
      <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-4">
        <KhmerConsonantStream
          text={text}
          revealedSet={revealed}
          onConsonantClick={handleClick}
        />
        <div className="mt-3 flex items-center justify-between">
          <div className="text-slate-300 text-sm">
            {done ? (
              <span className="text-emerald-300 font-bold">✅ All commanders found</span>
            ) : (
              <span>
                Click only consonants — remaining: <span className="font-bold">{remaining}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <MousePointerClick size={16} />
            <span>consonants only</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- THEORY SLIDES ----------

const BootcampSession = ({ onClose }) => {
  const { loadUnitData } = useCourseMap();

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

  const currentSlide = THEORY_SLIDES[slideIndex];
  const noSpacesTotal = currentSlide?.type === 'no-spaces' ? getConsonantIndices(currentSlide.khmerText).length : 0;
  const requiresUnlock = currentSlide?.type === 'no-spaces' || currentSlide?.type === 'meet-teams';
  const isUnlocked = unlockedSlides[slideIndex] || !requiresUnlock;
  const nextDisabled = !isUnlocked;
  const headerStatus = phase === 'theory' ? (
    <span className="text-slate-400 font-mono text-sm">
      BRIEFING: {slideIndex + 1}/{THEORY_SLIDES.length}
    </span>
  ) : (
    <div className="flex items-center gap-2 text-amber-400 font-black text-xl">
      <Zap size={20} fill="currentColor" />
      SCORE: {score}
    </div>
  );

  // ---------- LOAD PRACTICE DATA ----------
  useEffect(() => {
    let isMounted = true;

    const initBootcamp = async () => {
      try {
        // Prefer 10101 (R1). Fallback to 10100 if your data uses old id.
        // If your map uses different ids, add them here.
        const candidateIds = ['10000','10101','10100','101'];
        let data = null;
        for (const id of candidateIds) {
          // eslint-disable-next-line no-await-in-loop
          data = await loadUnitData(id);
          if (data) break;
        }

        // Try a few known shapes:
        const lessons = data?.lessons || data?.content || [];
        const slides = Array.isArray(lessons)
          ? lessons.flatMap((l) => l?.slides || l?.content || [])
          : [];

        const drills = slides.filter((s) => s?.type === 'visual_decoder');

        if (!drills.length) {
          // Never hard-fail: use built-in fallback drills so the bootcamp is playable.
          const shuffledFallback = [...FALLBACK_DRILLS, ...FALLBACK_DRILLS].sort(() => Math.random() - 0.5);
          if (isMounted) {
            setUsingFallbackPractice(true);
            setDrillQuestions(shuffledFallback);
          }
          return;
        }

        const shuffled = [...drills, ...drills].sort(() => Math.random() - 0.5);
        if (isMounted) {
          setUsingFallbackPractice(false);
          setDrillQuestions(shuffled);
        }
      } catch (e) {
        // If practice fails, still allow a playable fallback.
        if (isMounted) {
          setUsingFallbackPractice(true);
          setDrillQuestions([...FALLBACK_DRILLS, ...FALLBACK_DRILLS].sort(() => Math.random() - 0.5));
        }
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

    // 1) Try slide-specific audio mapping.
    // 2) Fall back to global consonant audio mapping.
    // 3) Fall back to a generic click sound.
    playConsonant(consonantChar, audioMap[consonantChar]);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Example (Sun)</div>
                <div className="text-4xl text-white font-khmer mb-2">កា</div>
                <div className="text-slate-300 text-sm"><span className="text-amber-300 font-bold">Commander:</span> ក → Sun → vowel stays pure → <span className="font-bold">Kaa</span></div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Example (Moon)</div>
                <div className="text-4xl text-white font-khmer mb-2">គា</div>
                <div className="text-slate-300 text-sm"><span className="text-amber-300 font-bold">Commander:</span> គ → Moon → vowel transforms → <span className="font-bold">Kea</span></div>
              </div>
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

            {/* Pair grid: makes the Sun/Moon linkage obvious */}
            <div className="space-y-4">
              {slide.pairs.map((pair, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-b from-amber-400 to-amber-600 rounded-xl p-6 text-black shadow-lg shadow-amber-500/20">
                    <h3 className="text-xl font-black mb-2 flex items-center gap-2">☀️ {slide.leftTeam.name}</h3>
                    <div className="text-sm font-semibold opacity-90 mb-4">
                      <p>🗣 {slide.leftTeam.voice}</p>
                      <p>👁 {slide.leftTeam.visual}</p>
                    </div>
                    <button
                      onClick={() => playAudio(slide.consonantAudioMap?.[pair.sun])}
                      className="w-full bg-black/20 hover:bg-black/30 transition-colors rounded-xl p-6 flex items-center justify-center text-7xl font-khmer shadow-inner"
                      title="Tap to hear"
                      type="button"
                    >
                      {pair.sun}
                    </button>
                    <div className="mt-3 text-xs font-bold opacity-80">
                      Example: {pair.sun}{pair.vowel} = {pair.sunRead}
                    </div>
                  </div>

                  <div className="bg-gradient-to-b from-indigo-500 to-purple-700 rounded-xl p-6 text-white shadow-lg shadow-indigo-500/20">
                    <h3 className="text-xl font-black mb-2 flex items-center gap-2">🌑 {slide.rightTeam.name}</h3>
                    <div className="text-sm font-medium opacity-90 mb-4">
                      <p>🗣 {slide.rightTeam.voice}</p>
                      <p>👁 {slide.rightTeam.visual}</p>
                    </div>
                    <button
                      onClick={() => playAudio(slide.consonantAudioMap?.[pair.moon])}
                      className="w-full bg-black/25 hover:bg-black/35 transition-colors rounded-xl p-6 flex items-center justify-center text-7xl font-khmer border border-white/10 shadow-inner"
                      title="Tap to hear"
                      type="button"
                    >
                      {pair.moon}
                    </button>
                    <div className="mt-3 text-xs font-bold opacity-90">
                      Example: {pair.moon}{pair.vowel} = {pair.moonRead}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-slate-800/70 rounded-xl p-4 border border-white/5">
              <div className="text-amber-300 font-black mb-1">⚡ Micro-drill:</div>
              <div className="text-slate-300 text-sm">Click a commander in the stream (only consonants are clickable). Keep clicking until all commanders are found.</div>
              <div className="text-slate-400 text-xs mt-2">Tip: Smooth = Sun, Spiky = Moon. Don’t overthink in the beginning.</div>
              <div className="mt-4">
                <MiniCommanderDrill
                  onComplete={() => setUnlockedSlides((u) => ({ ...u, [slideIndex]: true }))}
                  text={slide.microDrillText}
                  requiredCount={slide.microDrillCount}
                  audioMap={slide.consonantAudioMap}
                />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Spiky → Moon</div>
                <div className="text-5xl text-white font-khmer mb-2">គា</div>
                <div className="text-slate-300 text-sm">Looks spiky → Moon → read as <span className="font-bold">Kea</span></div>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-white/5">
                <div className="text-xs text-slate-400 uppercase tracking-widest mb-2">Smooth → Sun</div>
                <div className="text-5xl text-white font-khmer mb-2">កា</div>
                <div className="text-slate-300 text-sm">Looks smooth → Sun → read as <span className="font-bold">Kaa</span></div>
              </div>
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

  const bodyContent = phase === 'theory' ? (
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
            disabled={nextDisabled}
            className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-40 disabled:hover:bg-blue-600"
            type="button"
          >
            {nextDisabled ? 'Tap all consonants' : 'Next'}
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
      {usingFallbackPractice && (
        <div className="mb-4 max-w-xl text-center text-slate-300 text-sm bg-slate-800/70 border border-white/10 rounded-xl p-4">
          <div className="font-bold text-white mb-1">Using built-in practice</div>
          I couldn’t find VisualDecoder drills in the course map for this unit, so I loaded a minimal fallback set.
          When your course JSON is wired in, this banner will disappear.
        </div>
      )}

      <VisualDecoder
        key={drillIndex}
        data={((drillQuestions.length ? drillQuestions : FALLBACK_DRILLS)[drillIndex]?.data) ?? (drillQuestions.length ? drillQuestions : FALLBACK_DRILLS)[drillIndex]}
        onComplete={handleDrillComplete}
        hideContinue={true}
      />
    </>
  );

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
          {headerStatus}
        </div>

        <button onClick={onClose} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors" type="button">
          <X className="text-white w-6 h-6" />
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">
        {bodyContent}
      </div>

      {/* PROGRESS BAR */}
      <div className="h-2 bg-slate-800 w-full">
        <div
          className={`h-full transition-all duration-300 ${phase === 'theory' ? 'bg-blue-500' : 'bg-amber-400'}`}
          style={{
            width:
              phase === 'theory'
                ? `${((slideIndex + 1) / THEORY_SLIDES.length) * 100}%`
                : `${(drillIndex / (drillQuestions.length ? drillQuestions.length : FALLBACK_DRILLS.length)) * 100}%`
          }}
        />
      </div>
    </div>
  );
};

export default BootcampSession;
