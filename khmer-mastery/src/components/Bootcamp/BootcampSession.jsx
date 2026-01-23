import React, { useState, useEffect } from 'react';
import KhmerColoredText from '../KhmerColoredText';
import VisualDecoder from '../VisualDecoder';
import useCourseMap from '../../hooks/useCourseMap';
import { X, Zap, ArrowRight, ArrowLeft, MousePointerClick, Volume2 } from 'lucide-react';

// --- КОНФИГУРАЦИЯ ЦВЕТОВ ---

// Когда буква "спрятана" (или просто текст) - всё белое
const COLORS_WHITE = {
  CONSONANT_A: '#ffffff', CONSONANT_O: '#ffffff',
  SUBSCRIPT: '#ffffff', VOWEL_DEP: '#ffffff', VOWEL_IND: '#ffffff',
  DIACRITIC_BANTOC: '#ffffff', DIACRITIC_SERIES_SWITCH: '#ffffff', DIACRITIC_OTHER: '#ffffff',
  OTHER: '#ffffff'
};

// Когда нашли "Командира": Согласная горит, остальные гаснут
const COLORS_REVEALED = {
  CONSONANT_A: '#4ade80', // Ярко-зеленый (Командир)
  CONSONANT_O: '#4ade80',
  SUBSCRIPT: '#334155',   // Темно-серый (Пассажиры)
  VOWEL_DEP: '#334155',
  VOWEL_IND: '#334155',
  DIACRITIC_BANTOC: '#334155',
  DIACRITIC_SERIES_SWITCH: '#334155',
  DIACRITIC_OTHER: '#334155',
  OTHER: '#334155'
};

// --- ДАННЫЕ СЛАЙДОВ ---
const THEORY_SLIDES = [
  {
    type: 'title',
    title: 'BOOTCAMP: RELOADED 7.0',
    subtitle: 'THE CODEBREAKER PROTOCOL',
    description: 'Forget logic. Trust your eyes. We start from zero.',
    icon: '🚀'
  },
  {
    type: 'no-spaces',
    title: 'THE CHAOS',
    subtitle: 'Khmer words stick together. Find the COMMANDERS (Consonants).',
    englishAnalogy: 'ImagineIfEnglishWasWrittenLikeThis.',
    // Разбивка фразы ភាសាខ្មែរមិនដកឃ្លាទេ
    segments: [
      { text: 'ភា', audio: 'letter_pho.mp3' },
      { text: 'សា', audio: 'letter_sa.mp3' },
      { text: 'ខ្មែ', audio: 'letter_khmo.mp3' },
      { text: 'រ', audio: 'letter_ro.mp3' },
      { text: 'មិ', audio: 'letter_mo.mp3' },
      { text: 'ន', audio: 'letter_no.mp3' },
      { text: 'ដ', audio: 'letter_da.mp3' },
      { text: 'ក', audio: 'letter_ka.mp3' },
      { text: 'ឃ្លា', audio: 'letter_kho.mp3' },
      { text: 'ទេ', audio: 'letter_to.mp3' }
    ],
    hint: "Tap text to isolate the COMMANDER (Green) from Passengers (Grey)."
  },
  {
    type: 'meet-teams-vertical',
    title: 'MEET THE PAIRS',
    subtitle: 'Left = Light Voice (A). Right = Deep Voice (O).',
    pairs: [
      { sun: 'ក', sunEng: 'KA', moon: 'គ', moonEng: 'KO', sunSound: 'letter_ka.mp3', moonSound: 'letter_ko.mp3' },
      { sun: 'ខ', sunEng: 'KHA', moon: 'ឃ', moonEng: 'KHO', sunSound: 'letter_kha.mp3', moonSound: 'letter_kho.mp3' },
      { sun: 'ច', sunEng: 'CHA', moon: 'ជ', moonEng: 'CHO', sunSound: 'letter_cha.mp3', moonSound: 'letter_cho.mp3' },
      { sun: 'ឆ', sunEng: 'CHHA', moon: 'ឈ', moonEng: 'CHHO', sunSound: 'letter_chha.mp3', moonSound: 'letter_chho.mp3' },
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

// --- ЗАПАСНЫЕ ДАННЫЕ ДЛЯ АРКАДЫ ---
const FALLBACK_DRILLS = [
  // Заполняем все возможные поля (char, term, question), чтобы компонент точно сработал
  { char: 'ក', term: 'ក', question: 'ក', correct: 0, options: ['SUN ☀️', 'MOON 🌑'], title: 'Face Control' },
  { char: 'គ', term: 'គ', question: 'គ', correct: 1, options: ['SUN ☀️', 'MOON 🌑'], title: 'Face Control' },
  { char: 'ខ', term: 'ខ', question: 'ខ', correct: 0, options: ['SUN ☀️', 'MOON 🌑'], title: 'Hair Check' },
  { char: 'ឃ', term: 'ឃ', question: 'ឃ', correct: 1, options: ['SUN ☀️', 'MOON 🌑'], title: 'Hair Check' },
  { char: 'ច', term: 'ច', question: 'ច', correct: 0, options: ['SUN ☀️', 'MOON 🌑'], title: 'Face Control' },
  { char: 'ជ', term: 'ជ', question: 'ជ', correct: 1, options: ['SUN ☀️', 'MOON 🌑'], title: 'Face Control' },
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
  const [clickedSegments, setClickedSegments] = useState({});

  useEffect(() => {
    const initBootcamp = async () => {
      try {
        let drills = [];
        if (courseMapSafe && courseMapSafe.loadUnitData) {
            try {
                const data = await courseMapSafe.loadUnitData('10100');
                if (data && data.content) {
                    drills = data.content.flatMap(l => l.slides ? l.slides.filter(s => s.type === 'visual_decoder') : []);
                }
            } catch(e) { console.warn("DB fetch error"); }
        }

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
      setClickedSegments({});
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

    // === СЛАЙД: ХАОС (ИСПРАВЛЕННЫЙ) ===
    if (slide.type === 'no-spaces') {
       return (
          <div className="w-full text-center py-4">
             <h2 className="text-2xl font-black text-white mb-2">{slide.title}</h2>
             <p className="text-lg text-amber-400 mb-6">{slide.subtitle}</p>

             <div className="bg-slate-800/50 p-4 rounded-xl mb-8 border border-slate-700">
               <p className="text-sm text-slate-400 mb-2 uppercase tracking-widest">English Analogy</p>
               <p className="text-lg text-white font-mono bg-black/50 p-3 rounded">{slide.englishAnalogy}</p>
             </div>

             <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-2xl mb-6">
                <p className="text-slate-400 text-xs mb-4 uppercase tracking-widest text-center">{slide.hint}</p>

                {/* ТЕКСТ БЕЗ РАЗРЫВОВ */}
                <div className="flex flex-wrap justify-center items-end leading-none select-none">
                    {slide.segments.map((seg, idx) => {
                        const isRevealed = clickedSegments[idx];

                        // ВОТ ГДЕ МАГИЯ: Меняем палитру цветов в зависимости от клика
                        // Если кликнули -> REVEALED (Зеленые согласные, Серые гласные)
                        // Если нет -> WHITE (Всё белое)
                        const currentColors = isRevealed ? COLORS_REVEALED : COLORS_WHITE;

                        return (
                            <button
                                key={idx}
                                onClick={() => {
                                    setClickedSegments(prev => ({...prev, [idx]: true}));
                                    playAudio(seg.audio); // ИСПРАВЛЕНО: seg.audio
                                }}
                                className="px-0 py-1 transition-all duration-300 transform active:scale-110"
                            >
                                <KhmerColoredText
                                    text={seg.text}
                                    fontSize={48}
                                    colors={currentColors}
                                />
                            </button>
                        );
                    })}
                </div>
             </div>
          </div>
       );
    }

    // === СЛАЙД: ПАРЫ (ВЕРТИКАЛЬНО) ===
    if (slide.type === 'meet-teams-vertical') {
        return (
          <div className="w-full py-2">
            <h2 className="text-2xl font-black text-white mb-2 text-center">{slide.title}</h2>
            <p className="text-slate-400 text-center mb-6 text-sm">{slide.subtitle}</p>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto h-[450px]">
                {/* SUN COLUMN */}
                <div className="bg-slate-900/50 border border-amber-500/20 rounded-xl p-2 flex flex-col items-center">
                    <div className="text-amber-400 font-black uppercase mb-4 border-b border-amber-500/30 w-full text-center pb-2">SUN ☀️</div>
                    <div className="flex flex-col gap-4 w-full overflow-y-auto">
                        {slide.pairs.map((pair, idx) => (
                             <button
                                key={idx}
                                onClick={() => playAudio(pair.sunSound)}
                                className="bg-black/40 border border-amber-500/10 rounded-lg p-3 hover:bg-amber-900/20 transition-colors flex flex-col items-center justify-center h-24"
                             >
                                <KhmerColoredText text={pair.sun} fontSize={36} colors={COLORS_WHITE} />
                                <span className="text-amber-200/50 text-xs font-bold mt-1 tracking-widest">{pair.sunEng}</span>
                             </button>
                        ))}
                    </div>
                </div>

                {/* MOON COLUMN */}
                <div className="bg-slate-900/50 border border-indigo-500/20 rounded-xl p-2 flex flex-col items-center">
                    <div className="text-indigo-400 font-black uppercase mb-4 border-b border-indigo-500/30 w-full text-center pb-2">MOON 🌑</div>
                    <div className="flex flex-col gap-4 w-full overflow-y-auto">
                        {slide.pairs.map((pair, idx) => (
                             <button
                                key={idx}
                                onClick={() => playAudio(pair.moonSound)}
                                className="bg-black/40 border border-indigo-500/10 rounded-lg p-3 hover:bg-indigo-900/20 transition-colors flex flex-col items-center justify-center h-24"
                             >
                                <KhmerColoredText text={pair.moon} fontSize={36} colors={COLORS_WHITE} />
                                <span className="text-indigo-200/50 text-xs font-bold mt-1 tracking-widest">{pair.moonEng}</span>
                             </button>
                        ))}
                    </div>
                </div>
            </div>
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