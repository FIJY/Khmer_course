import React, { useState, useEffect } from 'react';
import VisualDecoder from '../VisualDecoder';
import { X, Volume2, Zap } from 'lucide-react';

// --- 1. ТЕОРИЯ (ИСПРАВЛЕННЫЙ ПОРЯДОК И ДАННЫЕ) ---
const THEORY_SLIDES = [
  {
    type: 'title',
    title: 'BOOTCAMP: UNIT R1',
    subtitle: 'THE CODEBREAKER PROTOCOL',
    description: 'Forget everything you know about reading. We start from zero.',
    icon: '🚀'
  },
  {
    type: 'no-spaces',
    title: 'SHOCKING TRUTH',
    subtitle: 'Khmer has NO spaces',
    englishAnalogy: 'ImagineIfEnglishWasWrittenLikeThis.',
    khmerAnalogy: 'ភាសាខ្មែរមិនដកឃ្លាទេ',
    solution: 'Don\'t panic. We just need to find the "Heads" of the words.'
  },
  // --- СНАЧАЛА ПОКАЗЫВАЕМ КОМАНДЫ (SUN VS MOON) ---
  {
    type: 'comparison',
    title: 'TWO TEAMS',
    subtitle: 'Every letter belongs to a team. This changes everything.',
    leftTeam: {
      name: 'SUN TEAM',
      color: 'text-amber-400', // Цвет текста
      borderColor: 'border-amber-400',
      description: 'Light, natural voice. Like "A" in Father.',
      visualRule: 'SMOOTH HEAD (Normal hair)',
      chars: ['ក', 'ខ', 'ច', 'ឆ'], // Примеры букв
      soundId: 'sun_sample'
    },
    rightTeam: {
      name: 'MOON TEAM',
      color: 'text-indigo-400', // Цвет текста
      borderColor: 'border-indigo-400',
      description: 'Deep, bass voice. Like "O" in Lord.',
      visualRule: 'SPIKY HAIR (Complex top)',
      chars: ['គ', 'ឃ', 'ជ', 'ឈ'], // Примеры букв
      soundId: 'moon_sample'
    }
  },
  // --- ТЕПЕРЬ АЛГОРИТМ (КОГДА ОНИ УЖЕ ЗНАЮТ ПРО КОМАНДЫ) ---
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

// --- 2. ДЕМО-ДАННЫЕ ДЛЯ ИГРЫ (ЧТОБЫ НЕ БЫЛО ОШИБОК БАЗЫ) ---
const DEMO_DRILLS = [
  {
    question: 'ក',
    correct: 0,
    options: ['SUN ☀️', 'MOON 🌑'],
    title: 'Face Control',
    sound: null
  },
  {
    question: 'គ',
    correct: 1,
    options: ['SUN ☀️', 'MOON 🌑'],
    title: 'Face Control',
    sound: null
  },
  {
    question: 'ខ',
    correct: 0,
    options: ['SUN ☀️', 'MOON 🌑'],
    title: 'Hair Check',
    sound: null
  },
  {
    question: 'ឃ',
    correct: 1,
    options: ['SUN ☀️', 'MOON 🌑'],
    title: 'Hair Check',
    sound: null
  }
];

const BootcampSession = ({ onClose }) => {
  // Мы убрали хук useCourseMap, чтобы починить ошибку "a is not a function"

  // --- STATE ---
  const [phase, setPhase] = useState('theory');
  const [slideIndex, setSlideIndex] = useState(0);

  const [drillQuestions, setDrillQuestions] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [score, setScore] = useState(0);

  // --- ЗАГРУЗКА (МГНОВЕННАЯ) ---
  useEffect(() => {
    // Вместо базы данных просто берем наши демо-данные
    // Перемешиваем их для интереса
    const shuffled = [...DEMO_DRILLS, ...DEMO_DRILLS].sort(() => Math.random() - 0.5);
    setDrillQuestions(shuffled);
  }, []);

  // --- AUDIO HELPER ---
  const playSound = (id) => {
    console.log("Playing sound:", id);
    // Тут потом подключим реальный звук: new Audio('/sounds/' + id + '.mp3').play();
  };

  // --- NAVIGATION ---
  const nextSlide = () => {
    if (slideIndex < THEORY_SLIDES.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      setPhase('practice');
    }
  };

  const prevSlide = () => {
    if (slideIndex > 0) setSlideIndex(prev => prev - 1);
  };

  const handleDrillComplete = () => {
    setScore(s => s + 10);
    setTimeout(() => {
      setDrillIndex(prev => prev + 1);
    }, 400);
  };

  // --- RENDERERS ---
  const renderTheoryContent = () => {
    const slide = THEORY_SLIDES[slideIndex];

    switch (slide.type) {
      case 'title':
        return (
          <div className="text-center animate-in fade-in zoom-in duration-500">
            <div className="text-8xl mb-6">{slide.icon}</div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">{slide.title}</h1>
            <p className="text-xl md:text-3xl text-amber-400 mb-8 font-mono">{slide.subtitle}</p>
            <p className="text-lg md:text-xl text-slate-300 max-w-lg mx-auto">{slide.description}</p>
          </div>
        );

      case 'no-spaces':
        return (
          <div className="w-full max-w-2xl text-center">
             <h2 className="text-4xl font-black text-white mb-4">{slide.title}</h2>
             <p className="text-2xl text-amber-400 mb-8">{slide.subtitle}</p>

             <div className="bg-slate-800/50 p-6 rounded-xl mb-6 border border-slate-700">
               <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">English Analogy</p>
               <p className="text-2xl md:text-3xl text-white font-mono tracking-tighter bg-black/50 p-4 rounded">{slide.englishAnalogy}</p>
             </div>

             <div className="bg-slate-800/50 p-6 rounded-xl mb-8 border border-slate-700">
                <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">Khmer Reality</p>
                <p className="text-4xl text-white font-serif">{slide.khmerAnalogy}</p>
             </div>

             <p className="text-green-400 text-xl font-bold">{slide.solution}</p>
          </div>
        );

      // === ВОТ ТВОЙ ОБНОВЛЕННЫЙ СЛАЙД СРАВНЕНИЯ ===
      case 'comparison':
        return (
          <div className="w-full max-w-5xl">
            <h2 className="text-3xl font-black text-white mb-2 text-center">{slide.title}</h2>
            <p className="text-slate-400 text-center mb-8">{slide.subtitle}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* SUN TEAM */}
              <div className={`bg-slate-800/50 border-t-4 ${slide.leftTeam.borderColor} p-6 rounded-xl flex flex-col items-center`}>
                <h3 className={`text-3xl font-black ${slide.leftTeam.color} mb-4`}>{slide.leftTeam.name}</h3>

                {/* Visual Examples - КРУПНЫЕ БУКВЫ */}
                <div className="flex gap-4 mb-6">
                  {slide.leftTeam.chars.map((char, i) => (
                    <span key={i} className={`text-6xl font-black ${slide.leftTeam.color} drop-shadow-lg`}>
                      {char}
                    </span>
                  ))}
                </div>

                <p className="text-white text-lg font-bold mb-2">{slide.leftTeam.visualRule}</p>
                <p className="text-slate-400 text-center mb-6 text-sm">{slide.leftTeam.description}</p>

                {/* Audio Button */}
                <button
                  onClick={() => playSound(slide.leftTeam.soundId)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-all text-white font-bold border border-white/10"
                >
                  <Volume2 size={20} className={slide.leftTeam.color} />
                  Compare Voice
                </button>
              </div>

              {/* MOON TEAM */}
              <div className={`bg-slate-800/50 border-t-4 ${slide.rightTeam.borderColor} p-6 rounded-xl flex flex-col items-center`}>
                <h3 className={`text-3xl font-black ${slide.rightTeam.color} mb-4`}>{slide.rightTeam.name}</h3>

                {/* Visual Examples */}
                <div className="flex gap-4 mb-6">
                  {slide.rightTeam.chars.map((char, i) => (
                    <span key={i} className={`text-6xl font-black ${slide.rightTeam.color} drop-shadow-lg`}>
                      {char}
                    </span>
                  ))}
                </div>

                <p className="text-white text-lg font-bold mb-2">{slide.rightTeam.visualRule}</p>
                <p className="text-slate-400 text-center mb-6 text-sm">{slide.rightTeam.description}</p>

                <button
                  onClick={() => playSound(slide.rightTeam.soundId)}
                  className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-all text-white font-bold border border-white/10"
                >
                  <Volume2 size={20} className={slide.rightTeam.color} />
                  Compare Voice
                </button>
              </div>
            </div>
          </div>
        );

      case 'reading-algorithm':
        return (
          <div className="w-full max-w-3xl">
            <h2 className="text-3xl font-black text-white mb-8 text-center">{slide.title}</h2>
            <div className="space-y-4 mb-8">
              {slide.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-6 bg-slate-800/80 p-6 rounded-2xl border border-white/5 transition-transform hover:scale-105">
                  <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white shrink-0 border border-white/10">
                    {step.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-3xl">{step.icon}</span>
                      <h3 className="text-xl font-black text-white uppercase">{step.text}</h3>
                    </div>
                    <p className="text-slate-400 text-lg">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30 flex items-center justify-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-300 font-bold">{slide.warning}</p>
            </div>
          </div>
        );

      case 'ready':
        return (
          <div className="text-center">
            <div className="mb-6 animate-pulse text-7xl">🎯</div>
            <h2 className="text-4xl font-black text-white mb-4">{slide.title}</h2>
            <p className="text-xl text-slate-300 mb-12 max-w-md mx-auto">{slide.description}</p>

            <button
              onClick={nextSlide}
              className="bg-amber-500 hover:bg-amber-400 text-black text-xl font-black py-5 px-16 rounded-full shadow-xl shadow-amber-500/20 transition-transform hover:scale-105 active:scale-95"
            >
              {slide.buttonText}
            </button>
          </div>
        );

      default:
        return <div className="text-white">Slide type not supported</div>;
    }
  };


  // --- MAIN RENDER ---
  if (phase === 'practice' && drillIndex >= drillQuestions.length) {
     return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-5xl font-black text-amber-400 mb-4">MISSION ACCOMPLISHED</h1>
        <p className="text-3xl mb-8">Final Score: {score}</p>
        <button onClick={onClose} className="px-8 py-4 bg-blue-600 rounded-xl font-bold text-lg">Return to Base</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* HEADER */}
      <div className="flex justify-between items-center p-4 bg-slate-800 border-b border-white/5">
        <div className="flex items-center gap-3">
          {phase === 'theory' ? (
            <span className="text-slate-400 font-mono text-sm">BRIEFING: {slideIndex + 1}/{THEORY_SLIDES.length}</span>
          ) : (
             <div className="flex items-center gap-2 text-amber-400 font-black text-xl">
               <Zap size={20} fill="currentColor" />
               SCORE: {score}
             </div>
          )}
        </div>
        <button onClick={onClose} className="p-2 bg-slate-700 rounded-full hover:bg-slate-600 transition-colors">
          <X className="text-white w-6 h-6" />
        </button>
      </div>

      {/* BODY */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto w-full">
        {phase === 'theory' ? (
          <>
            {renderTheoryContent()}

            {THEORY_SLIDES[slideIndex].type !== 'ready' && (
              <div className="flex gap-4 mt-12 w-full max-w-md">
                <button
                  onClick={prevSlide}
                  disabled={slideIndex === 0}
                  className="flex-1 py-3 rounded-lg bg-slate-800 text-slate-400 font-bold disabled:opacity-30 hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={nextSlide}
                  className="flex-1 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <VisualDecoder
            key={drillIndex}
            data={drillQuestions[drillIndex]}
            onComplete={() => handleDrillComplete()}
            hideContinue={true}
          />
        )}
      </div>

      {/* PROGRESS BAR */}
      <div className="h-2 bg-slate-800 w-full">
        <div
          className={`h-full transition-all duration-300 ${phase === 'theory' ? 'bg-blue-500' : 'bg-amber-400'}`}
          style={{ width: phase === 'theory'
            ? `${((slideIndex + 1) / THEORY_SLIDES.length) * 100}%`
            : `${((drillIndex) / drillQuestions.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
};

export default BootcampSession;