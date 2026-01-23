import React, { useState, useEffect } from 'react';
import KhmerColoredText from '../KhmerColoredText';
import VisualDecoder from '../VisualDecoder';
import useCourseMap from '../../hooks/useCourseMap';
import { X, Volume2, Zap, ArrowRight, ArrowLeft, MousePointerClick } from 'lucide-react';

// --- КОНФИГУРАЦИЯ СЛАЙДОВ ---
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
    subtitle: 'Khmer has NO spaces between words.',
    englishAnalogy: 'ImagineIfEnglishWasWrittenLikeThisGoodLuck.',
    khmerAnalogy: 'ភាសាខ្មែរមិនដកឃ្លាទេ',
    solution: 'Don\'t panic. Find the COMMANDERS (Consonants).'
  },
  // --- ВОТ ОН, НОВЫЙ ЭКРАН С ТАБЛИЦЕЙ ---
  {
    type: 'interactive-explorer',
    title: 'MEET THE COMMANDERS',
    subtitle: 'Tap each letter to activate voice & ID.',
    groups: [
      {
        name: 'SUN TEAM ☀️',
        desc: 'Light Voice ("A" sound)',
        color: '#ffb020', // Янтарный
        letters: [
          { char: 'ក', id: 'ka', eng: 'KA', sound: 'letter_ka.mp3' },
          { char: 'ខ', id: 'kha', eng: 'KHA', sound: 'letter_kha.mp3' },
          { char: 'ច', id: 'cha', eng: 'CHA', sound: 'letter_cha.mp3' },
          { char: 'ឆ', id: 'chha', eng: 'CHHA', sound: 'letter_chha.mp3' }
        ]
      },
      {
        name: 'MOON TEAM 🌑',
        desc: 'Deep Voice ("O" sound)',
        color: '#6b5cff', // Индиго
        letters: [
          { char: 'គ', id: 'ko', eng: 'KO', sound: 'letter_ko.mp3' },
          { char: 'ឃ', id: 'kho', eng: 'KHO', sound: 'letter_kho.mp3' },
          { char: 'ជ', id: 'cho', eng: 'CHO', sound: 'letter_cho.mp3' },
          { char: 'ឈ', id: 'chho', eng: 'CHHO', sound: 'letter_chho.mp3' }
        ]
      }
    ]
  },
  {
    type: 'reading-algorithm',
    title: 'THE ALGORITHM',
    subtitle: 'Never read left-to-right. Read hierarchically.',
    steps: [
      { id: 1, text: 'FIND THE CONSONANT', desc: 'Look for the big letter first.', icon: '👮‍♂️' },
      { id: 2, text: 'CHECK THE TEAM', desc: 'Is it Sun (Smooth) or Moon (Spiky)?', icon: '☀️🌑' },
      { id: 3, text: 'UNLOCK THE VOWEL', desc: 'Sun = Normal Sound. Moon = Deep Sound.', icon: '🔓' }
    ],
    warning: 'The Consonant is the Commander. The vowel just obeys.'
  },
  {
    type: 'ready',
    title: 'BRIEFING COMPLETE',
    subtitle: 'Let\'s test your eyes.',
    description: 'I will show you letters. You tell me: SUN or MOON.',
    buttonText: 'START DRILLS'
  }
];

// ЗАПАСНЫЕ ДАННЫЕ (ЧТОБЫ ДРИЛЛ НЕ БЫЛ ПУСТЫМ)
const FALLBACK_DRILLS = [
  { question: 'ក', correct: 0, options: ['SUN ☀️', 'MOON 🌑'], title: 'Face Control' },
  { question: 'គ', correct: 1, options: ['SUN ☀️', 'MOON 🌑'], title: 'Face Control' },
  { question: 'ខ', correct: 0, options: ['SUN ☀️', 'MOON 🌑'], title: 'Hair Check' },
  { question: 'ឃ', correct: 1, options: ['SUN ☀️', 'MOON 🌑'], title: 'Hair Check' },
  { question: 'ច', correct: 0, options: ['SUN ☀️', 'MOON 🌑'], title: 'Face Control' },
  { question: 'ជ', correct: 1, options: ['SUN ☀️', 'MOON 🌑'], title: 'Face Control' },
];

const BootcampSession = ({ onClose }) => {
  const courseMap = useCourseMap();

  const [phase, setPhase] = useState('theory');
  const [slideIndex, setSlideIndex] = useState(0);

  const [drillQuestions, setDrillQuestions] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [score, setScore] = useState(0);

  const [dataStatus, setDataStatus] = useState('loading');
  const [activeLetter, setActiveLetter] = useState(null);

  // --- ЗАГРУЗКА ДАННЫХ ---
  useEffect(() => {
    const initBootcamp = async () => {
      try {
        console.log("🚀 Starting Drill Load...");
        let drills = [];

        // 1. Пробуем загрузить из базы
        if (courseMap && courseMap.loadUnitData) {
          try {
             const data = await courseMap.loadUnitData('10100');
             if (data && data.content) {
                drills = data.content.flatMap(lesson =>
                  lesson.slides ? lesson.slides.filter(s => s.type === 'visual_decoder') : []
                );
             }
          } catch(e) {
             console.warn("Database load failed, switching to fallback");
          }
        }

        // 2. Если база не отдала данные — используем FALLBACK (чтобы не было пустого экрана!)
        if (!drills || drills.length === 0) {
          console.log("⚠️ Using Fallback Drills");
          drills = FALLBACK_DRILLS;
          setDataStatus('fallback');
        } else {
          setDataStatus('success');
        }

        const shuffled = [...drills, ...drills].sort(() => Math.random() - 0.5);
        setDrillQuestions(shuffled);

      } catch (err) {
        // В любой непонятной ситуации - запасной вариант
        setDrillQuestions(FALLBACK_DRILLS);
        setDataStatus('fallback');
      }
    };
    initBootcamp();
  }, []);

  const playAudio = (fileName) => {
    if (!fileName) return;
    const audio = new Audio(`/sounds/${fileName}`);
    audio.play().catch(e => console.warn("Audio file missing:", fileName));
  };

  const nextSlide = () => {
    if (slideIndex < THEORY_SLIDES.length - 1) {
      setSlideIndex(prev => prev + 1);
      setActiveLetter(null);
    } else {
      setPhase('practice');
    }
  };

  const prevSlide = () => {
    if (slideIndex > 0) {
      setSlideIndex(prev => prev - 1);
      setActiveLetter(null);
    }
  };

  const handleDrillComplete = () => {
    setScore(s => s + 10);
    setTimeout(() => setDrillIndex(prev => prev + 1), 400);
  };

  const renderTheoryContent = () => {
    const slide = THEORY_SLIDES[slideIndex];

    switch (slide.type) {
      case 'title':
        return (
          <div className="text-center py-10 animate-in fade-in zoom-in duration-500">
            <div className="text-8xl mb-6">{slide.icon}</div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter">{slide.title}</h1>
            <p className="text-xl md:text-2xl text-amber-400 mb-8 font-mono">{slide.subtitle}</p>
            <p className="text-lg md:text-xl text-slate-300 max-w-lg mx-auto">{slide.description}</p>
          </div>
        );

      case 'no-spaces':
        return (
          <div className="w-full text-center py-4">
             <h2 className="text-3xl font-black text-white mb-4">{slide.title}</h2>
             <p className="text-xl text-amber-400 mb-8">{slide.subtitle}</p>
             <div className="bg-slate-800/50 p-6 rounded-xl mb-6 border border-slate-700">
               <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">English Analogy</p>
               <p className="text-xl md:text-2xl text-white font-mono tracking-tighter bg-black/50 p-4 rounded break-all">{slide.englishAnalogy}</p>
             </div>
             <div className="bg-slate-900 p-8 rounded-xl mb-8 border border-slate-700 shadow-2xl relative">
                <p className="text-slate-400 text-sm mb-4 uppercase tracking-widest">Khmer Reality</p>
                <KhmerColoredText
                  text={slide.khmerAnalogy}
                  fontSize={48}
                  className="block w-full text-center"
                  colors={{ CONSONANT_A: '#ffffff', CONSONANT_O: '#ffffff', OTHER: '#475569' }}
                />
             </div>
             <p className="text-green-400 text-lg font-bold px-4">{slide.solution}</p>
          </div>
        );

      // ИНТЕРАКТИВНЫЙ СЛАЙД
      case 'interactive-explorer':
        return (
          <div className="w-full py-2">
            <h2 className="text-2xl font-black text-white mb-2 text-center">{slide.title}</h2>
            <p className="text-slate-400 text-center mb-6 text-sm">{slide.subtitle}</p>

            <div className="grid grid-cols-1 gap-6 pb-24">
              {slide.groups.map((group, gIdx) => (
                <div key={gIdx} className="bg-slate-900 border border-white/10 p-4 rounded-2xl flex flex-col items-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: group.color }}></div>
                  <h3 className="text-xl font-black mb-1 uppercase tracking-widest" style={{ color: group.color }}>{group.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">{group.desc}</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {group.letters.map((letter, lIdx) => {
                      const isActive = activeLetter === letter.id;
                      return (
                        <button
                          key={lIdx}
                          onClick={() => { setActiveLetter(letter.id); playAudio(letter.sound); }}
                          className={`relative flex flex-col items-center justify-center w-20 h-24 rounded-xl border-2 transition-all duration-200 ${isActive ? 'bg-slate-800 scale-110 z-10' : 'bg-black/40 border-white/5'}`}
                          style={{ borderColor: isActive ? group.color : 'rgba(255,255,255,0.1)', boxShadow: isActive ? `0 0 15px ${group.color}` : 'none' }}
                        >
                          <KhmerColoredText
                            text={letter.char} fontSize={40}
                            colors={{ CONSONANT_A: isActive ? '#fff' : group.color, CONSONANT_O: isActive ? '#fff' : group.color, OTHER: group.color }}
                          />
                          <div className={`mt-1 text-xs font-bold tracking-wider transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} style={{ color: group.color }}>{letter.eng}</div>
                          {isActive && <Volume2 size={12} className="absolute top-1 right-1 text-white/50" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'reading-algorithm':
        return (
          <div className="w-full py-4">
             <h2 className="text-2xl font-black text-white mb-6 text-center">{slide.title}</h2>
             <div className="space-y-4 mb-8">
               {slide.steps.map((step, i) => (
                 <div key={i} className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-white/5">
                   <div className="bg-slate-900 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 border border-white/10 shadow-inner">{step.id}</div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="text-2xl">{step.icon}</span>
                       <h3 className="text-lg font-black text-white uppercase">{step.text}</h3>
                     </div>
                     <p className="text-slate-400 text-sm">{step.desc}</p>
                   </div>
                 </div>
               ))}
             </div>
             <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 flex items-center justify-center gap-3">
               <span className="text-2xl">⚠️</span>
               <p className="text-red-300 font-bold text-sm">{slide.warning}</p>
             </div>
           </div>
        );

      case 'ready':
        return (
          <div className="text-center py-20">
            <div className="mb-6 animate-pulse text-7xl">🎯</div>
            <h2 className="text-4xl font-black text-white mb-4">{slide.title}</h2>
            <p className="text-xl text-slate-300 mb-4 max-w-md mx-auto">{slide.description}</p>
            <div className="mb-8 h-6">
               {dataStatus === 'loading' && <span className="text-amber-400 text-sm animate-pulse">Loading Mission Data...</span>}
               {dataStatus === 'fallback' && <span className="text-blue-400 text-sm">Offline Mode Ready</span>}
               {dataStatus === 'success' && <span className="text-green-400 text-sm">System Online</span>}
            </div>
            <button
              onClick={nextSlide}
              disabled={dataStatus === 'loading'}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xl font-black py-5 px-16 rounded-full shadow-xl shadow-amber-500/20 transition-transform hover:scale-105 active:scale-95"
            >
              START DRILLS
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/90 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-slate-950 flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-white/5 shrink-0 z-20">
          <div className="flex items-center gap-3">
            {phase === 'theory' ? (
              <span className="text-slate-400 font-mono text-xs">BRIEFING: {slideIndex + 1}/{THEORY_SLIDES.length}</span>
            ) : (
              <div className="flex items-center gap-2 text-amber-400 font-black text-xl"><Zap size={20} fill="currentColor" /> SCORE: {score}</div>
            )}
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
                <div className="text-center">
                  <h1 className="text-4xl font-black text-amber-400 mb-4">DONE!</h1>
                  <p className="text-white mb-6">Final Score: {score}</p>
                  <button onClick={onClose} className="px-6 py-3 bg-blue-600 rounded-xl font-bold">Return to Base</button>
                </div>
              )}
            </div>
          )}
        </div>
        {phase === 'theory' && THEORY_SLIDES[slideIndex].type !== 'ready' && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-30">
            <div className="flex gap-3">
               <button onClick={prevSlide} disabled={slideIndex === 0} className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 font-bold disabled:opacity-0 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"><ArrowLeft size={20} /> Back</button>
               <button onClick={nextSlide} className="flex-[2] py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2">Next Step <ArrowRight size={20} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BootcampSession;