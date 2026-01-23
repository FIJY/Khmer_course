import React, { useState, useEffect } from 'react';
import KhmerColoredText from '../KhmerColoredText';
import VisualDecoder from '../VisualDecoder';
import useCourseMap from '../../hooks/useCourseMap';
import { X, Volume2, Zap, ArrowRight, ArrowLeft, MousePointerClick, RefreshCw } from 'lucide-react';

// --- ДАННЫЕ СЛАЙДОВ ---
const THEORY_SLIDES = [
  {
    type: 'title',
    title: 'BOOTCAMP: RELOADED 5.0',
    subtitle: 'THE CODEBREAKER PROTOCOL',
    description: 'Forget logic. Trust your eyes. We start from zero.',
    icon: '🚀'
  },
  {
    type: 'no-spaces',
    title: 'THE CHAOS',
    subtitle: 'Khmer has NO spaces. Can you find the COMMANDERS?',
    englishAnalogy: 'ImagineIfEnglishWasWrittenLikeThis.',
    // Сегментация фразы: ភាសាខ្មែរមិនដកឃ្លាទេ
    // Разбиваем так, чтобы пользователь искал большие буквы
    segments: [
      { text: 'ភា', type: 'consonant', sound: 'letter_pho.mp3' },
      { text: 'សា', type: 'consonant', sound: 'letter_sa.mp3' },
      { text: 'ខ្មែ', type: 'consonant', sound: 'letter_khmo.mp3' }, // Тут сложное сочетание
      { text: 'រ', type: 'consonant', sound: 'letter_ro.mp3' },
      { text: 'មិ', type: 'consonant', sound: 'letter_mo.mp3' },
      { text: 'ន', type: 'consonant', sound: 'letter_no.mp3' },
      { text: 'ដ', type: 'consonant', sound: 'letter_da.mp3' },
      { text: 'ក', type: 'consonant', sound: 'letter_ka.mp3' },
      { text: 'ឃ្លា', type: 'consonant', sound: 'letter_kho.mp3' },
      { text: 'ទេ', type: 'consonant', sound: 'letter_to.mp3' }
    ],
    hint: "Tap the BIG letters (Consonants)."
  },
  // --- НОВЫЙ ДИЗАЙН: ВЕРТИКАЛЬНЫЕ СТОЛБЦЫ (ПАРЫ) ---
  {
    type: 'meet-teams-vertical',
    title: 'MEET THE PAIRS',
    subtitle: 'See how they match? Left is Light, Right is Deep.',
    // Пары букв: [SunChar, MoonChar, EnglishName]
    pairs: [
      { sun: 'ក', moon: 'គ', name: 'K-Sound', sunSound: 'letter_ka.mp3', moonSound: 'letter_ko.mp3' },
      { sun: 'ខ', moon: 'ឃ', name: 'KH-Sound', sunSound: 'letter_kha.mp3', moonSound: 'letter_kho.mp3' },
      { sun: 'ច', moon: 'ជ', name: 'CH-Sound', sunSound: 'letter_cha.mp3', moonSound: 'letter_cho.mp3' },
      { sun: 'ឆ', moon: 'ឈ', name: 'CHH-Sound', sunSound: 'letter_chha.mp3', moonSound: 'letter_chho.mp3' },
    ]
  },
  {
    type: 'reading-algorithm',
    title: 'THE ALGORITHM',
    subtitle: 'How to decode ANY sound.',
    steps: [
      { id: 1, text: 'SPOT THE COMMANDER', desc: 'Find the Consonant first.', visualChar: 'ក', visualColor: '#ffffff' },
      { id: 2, text: 'CHECK THE UNIFORM', desc: 'Is it Sun or Moon?', visualChar: '☀️', visualColor: '#ffb020' },
      { id: 3, text: 'APPLY THE VOWEL', desc: 'Sun = Normal. Moon = Deep.', visualChar: 'aa', visualColor: '#4ade80' }
    ],
    warning: 'The Consonant CONTROLS the Vowel sound!'
  },
  {
    type: 'ready',
    title: 'BRIEFING COMPLETE',
    subtitle: 'Let\'s test your eyes.',
    description: 'I will show you letters. You tell me: SUN or MOON.',
    buttonText: 'START DRILLS'
  }
];

// --- ИСПРАВЛЕННЫЕ ЗАПАСНЫЕ ДАННЫЕ ---
const FALLBACK_DRILLS = [
  // ВАЖНО: term - это буква, которая показывается.
  // correct: 0 (Sun), 1 (Moon)
  { term: 'ក', options: ['SUN ☀️', 'MOON 🌑'], correct: 0, title: 'Face Control' },
  { term: 'គ', options: ['SUN ☀️', 'MOON 🌑'], correct: 1, title: 'Face Control' },
  { term: 'ខ', options: ['SUN ☀️', 'MOON 🌑'], correct: 0, title: 'Hair Check' },
  { term: 'ឃ', options: ['SUN ☀️', 'MOON 🌑'], correct: 1, title: 'Hair Check' },
  { term: 'ច', options: ['SUN ☀️', 'MOON 🌑'], correct: 0, title: 'Face Control' },
  { term: 'ជ', options: ['SUN ☀️', 'MOON 🌑'], correct: 1, title: 'Face Control' },
];

const BootcampSession = ({ onClose }) => {
  let courseMapSafe = null;
  try { courseMapSafe = useCourseMap(); } catch (e) { console.warn("Hook failed"); }

  const [phase, setPhase] = useState('theory');
  const [slideIndex, setSlideIndex] = useState(0);
  const [drillQuestions, setDrillQuestions] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [dataStatus, setDataStatus] = useState('loading');

  // State для интерактива
  const [clickedSegments, setClickedSegments] = useState({}); // { 0: 'correct', 1: 'error' }

  // --- ЗАГРУЗКА ---
  useEffect(() => {
    const initBootcamp = async () => {
      try {
        let drills = [];
        // 1. Пробуем базу
        if (courseMapSafe && courseMapSafe.loadUnitData) {
            try {
                const data = await courseMapSafe.loadUnitData('10100');
                if (data && data.content) {
                    drills = data.content.flatMap(l => l.slides ? l.slides.filter(s => s.type === 'visual_decoder') : []);
                }
            } catch(e) { console.warn("DB fetch error"); }
        }

        // 2. Если пусто — FALLBACK
        if (!drills || drills.length === 0) {
          drills = FALLBACK_DRILLS;
          setDataStatus('fallback');
        } else {
          setDataStatus('success');
        }
        setDrillQuestions([...drills, ...drills].sort(() => Math.random() - 0.5));
      } catch (err) {
        setDrillQuestions(FALLBACK_DRILLS);
        setDataStatus('fallback');
      }
    };
    initBootcamp();
  }, []);

  const playAudio = (fileName) => {
    if (!fileName) return;
    new Audio(`/sounds/${fileName}`).play().catch(e => console.warn("No audio:", fileName));
  };

  const nextSlide = () => {
    if (slideIndex < THEORY_SLIDES.length - 1) {
      setSlideIndex(p => p + 1);
      setClickedSegments({}); // Сброс
    } else {
      setPhase('practice');
    }
  };

  const prevSlide = () => {
    if (slideIndex > 0) {
        setSlideIndex(p => p - 1);
        setClickedSegments({});
    }
  };

  const handleDrillComplete = () => {
    setScore(s => s + 10);
    setTimeout(() => setDrillIndex(p => p + 1), 400);
  };

  // --- RENDERERS ---

  const renderTheoryContent = () => {
    const slide = THEORY_SLIDES[slideIndex];

    if (slide.type === 'title') {
         return (
          <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
            <div className="text-8xl mb-6">{slide.icon}</div>
            <h1 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter">{slide.title}</h1>
            <p className="text-xl text-amber-400 mb-8 font-mono">{slide.subtitle}</p>
            <p className="text-lg text-slate-300 max-w-lg mx-auto">{slide.description}</p>
          </div>
        );
    }

    // === ИСПРАВЛЕННЫЙ ХАОС (ТЕКСТ СПЛОШНОЙ СТРОКОЙ) ===
    if (slide.type === 'no-spaces') {
       return (
          <div className="w-full text-center py-4">
             <h2 className="text-2xl font-black text-white mb-2">{slide.title}</h2>
             <p className="text-lg text-amber-400 mb-6">{slide.subtitle}</p>

             {/* English Analogy */}
             <div className="bg-slate-800/50 p-4 rounded-xl mb-8 border border-slate-700">
               <p className="text-sm text-slate-400 mb-2 uppercase tracking-widest">English Analogy</p>
               <p className="text-lg text-white font-mono bg-black/50 p-3 rounded">{slide.englishAnalogy}</p>
             </div>

             {/* ИНТЕРАКТИВНОЕ ПРЕДЛОЖЕНИЕ (БЕЗ GAP!) */}
             <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl mb-6">
                <p className="text-slate-400 text-xs mb-4 uppercase tracking-widest text-center">{slide.hint}</p>

                {/* Flex container но БЕЗ gap, чтобы буквы сливались визуально */}
                <div className="flex flex-wrap justify-center items-end leading-none select-none">
                    {slide.segments.map((seg, idx) => {
                        const status = clickedSegments[idx]; // 'correct' | 'error' | undefined
                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setClickedSegments(prev => ({...prev, [idx]: 'correct'}));
                                    playAudio(seg.sound);
                                }}
                                className={`
                                    relative px-0.5 py-1 rounded transition-all duration-200
                                    ${status === 'correct' ? 'bg-green-500/20 text-green-400' : 'text-white hover:text-amber-300'}
                                    text-4xl md:text-5xl font-serif
                                `}
                            >
                                <KhmerColoredText
                                    text={seg.text}
                                    fontSize={48}
                                    // Если кликнули - красим в зеленый (или обычный цвет компонента), если нет - белый
                                    colors={status === 'correct' ? undefined : { OTHER: '#ffffff', CONSONANT_A: '#ffffff', CONSONANT_O: '#ffffff' }}
                                />
                                {/* Индикатор успеха */}
                                {status === 'correct' && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-green-500 animate-bounce">
                                        <Volume2 size={16} />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
             </div>

             <p className="text-green-400 text-sm font-bold px-4">{slide.solution}</p>
          </div>
       );
    }

    // === ВЕРТИКАЛЬНЫЕ СТОЛБЦЫ (ПАРЫ) ===
    if (slide.type === 'meet-teams-vertical') {
        return (
          <div className="w-full py-2">
            <h2 className="text-2xl font-black text-white mb-2 text-center">{slide.title}</h2>
            <p className="text-slate-400 text-center mb-6 text-sm">{slide.subtitle}</p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto h-[400px]">
                {/* SUN COLUMN */}
                <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-2 flex flex-col items-center">
                    <div className="text-amber-400 font-black uppercase tracking-widest mb-4 border-b border-amber-500/30 w-full text-center pb-2">SUN ☀️</div>
                    <div className="flex flex-col gap-4 w-full flex-1 overflow-y-auto">
                        {slide.pairs.map((pair, idx) => (
                             <button
                                key={idx}
                                onClick={() => playAudio(pair.sunSound)}
                                className="bg-black/40 border border-amber-500/10 rounded-lg p-2 hover:bg-amber-900/20 transition-colors flex items-center justify-center h-20"
                             >
                                <KhmerColoredText text={pair.sun} fontSize={36} colors={{ OTHER: '#ffb020', CONSONANT_A: '#ffb020' }} />
                             </button>
                        ))}
                    </div>
                </div>

                {/* MOON COLUMN */}
                <div className="bg-slate-900/50 border border-indigo-500/20 rounded-xl p-2 flex flex-col items-center">
                    <div className="text-indigo-400 font-black uppercase tracking-widest mb-4 border-b border-indigo-500/30 w-full text-center pb-2">MOON 🌑</div>
                    <div className="flex flex-col gap-4 w-full flex-1 overflow-y-auto">
                        {slide.pairs.map((pair, idx) => (
                             <button
                                key={idx}
                                onClick={() => playAudio(pair.moonSound)}
                                className="bg-black/40 border border-indigo-500/10 rounded-lg p-2 hover:bg-indigo-900/20 transition-colors flex items-center justify-center h-20"
                             >
                                <KhmerColoredText text={pair.moon} fontSize={36} colors={{ OTHER: '#6b5cff', CONSONANT_O: '#6b5cff' }} />
                             </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className="text-center text-slate-500 text-xs mt-4">Tap to compare voices</div>
          </div>
        );
    }

    // === АЛГОРИТМ ===
    if (slide.type === 'reading-algorithm') {
        return (
          <div className="w-full py-4">
             <h2 className="text-2xl font-black text-white mb-6 text-center">{slide.title}</h2>
             <div className="space-y-4 mb-8">
               {slide.steps.map((step, i) => (
                 <div key={i} className="flex items-center justify-between gap-4 bg-slate-800 p-4 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-4">
                        <div className="bg-slate-900 w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 border border-white/10">{step.id}</div>
                        <div><h3 className="text-sm md:text-lg font-black text-white uppercase">{step.text}</h3><p className="text-slate-400 text-xs">{step.desc}</p></div>
                   </div>
                   <div className="bg-black/40 p-2 rounded-lg border border-white/5 w-14 h-14 flex items-center justify-center shrink-0">
                       <span style={{ color: step.visualColor, fontSize: '1.2rem', fontWeight: 'bold' }}>{step.visualChar}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        );
    }

    if (slide.type === 'ready') {
        return (
          <div className="text-center py-20">
            <div className="mb-6 animate-pulse text-7xl">🎯</div>
            <h2 className="text-4xl font-black text-white mb-4">{slide.title}</h2>
            <div className="mb-8 h-6">{dataStatus === 'loading' ? <span className="text-amber-400 animate-pulse">Loading...</span> : <span className="text-green-400">System Online</span>}</div>
            <button onClick={nextSlide} disabled={dataStatus === 'loading'} className="bg-amber-500 hover:bg-amber-400 text-black text-xl font-black py-5 px-16 rounded-full shadow-xl">START DRILLS</button>
          </div>
        );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/95 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-slate-950 flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-white/5 shrink-0 z-20">
          <div className="flex items-center gap-3">
             {phase === 'theory' ? <span className="text-slate-400 font-mono text-xs">BRIEFING: {slideIndex + 1}/{THEORY_SLIDES.length}</span> : <div className="flex items-center gap-2 text-amber-400 font-black text-xl"><Zap size={20} fill="currentColor" /> SCORE: {score}</div>}
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><X className="text-white w-6 h-6" /></button>
        </div>
        <div className="h-1 bg-slate-900 w-full relative z-20">
          <div className={`h-full transition-all duration-300 ${phase === 'theory' ? 'bg-blue-500' : 'bg-amber-400'}`} style={{ width: phase === 'theory' ? `${((slideIndex + 1) / THEORY_SLIDES.length) * 100}%` : `${((drillIndex) / drillQuestions.length) * 100}%` }} />
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32">
          {phase === 'theory' ? renderTheoryContent() : (
            <div className="flex flex-col items-center justify-center h-full">
              {drillIndex < drillQuestions.length ? (
                 <VisualDecoder key={drillIndex} data={drillQuestions[drillIndex]} onComplete={() => handleDrillComplete()} hideContinue={true} />
              ) : (
                <div className="text-center"><h1 className="text-4xl font-black text-amber-400 mb-4">DONE!</h1><p className="text-white mb-6">Score: {score}</p><button onClick={onClose} className="px-6 py-3 bg-blue-600 rounded-xl font-bold">Return to Base</button></div>
              )}
            </div>
          )}
        </div>
        {phase === 'theory' && THEORY_SLIDES[slideIndex].type !== 'ready' && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-30">
            <div className="flex gap-3">
               <button onClick={prevSlide} disabled={slideIndex === 0} className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 font-bold disabled:opacity-0 hover:bg-slate-700 flex items-center justify-center gap-2"><ArrowLeft size={20} /> Back</button>
               <button onClick={nextSlide} className="flex-[2] py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 flex items-center justify-center gap-2">Next Step <ArrowRight size={20} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BootcampSession;