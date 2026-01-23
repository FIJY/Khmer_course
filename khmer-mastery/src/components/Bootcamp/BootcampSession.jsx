import React, { useState, useEffect } from 'react';
import useCourseMap from '../../hooks/useCourseMap';
import VisualDecoder from '../VisualDecoder';
import { X, ChevronRight, ChevronLeft, Volume2, Zap } from 'lucide-react';

// --- ДАННЫЕ СЛАЙДОВ (ТВОЙ СЦЕНАРИЙ) ---
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
    title: 'SHOCKING TRUTH: NO SPACES',
    subtitle: 'Khmer text is a continuous stream',
    englishAnalogy: 'ImagineIfEnglishWasWrittenLikeThis.',
    khmerAnalogy: 'ភាសាខ្មែរមិនដកឃ្លាទេ',
    rule: 'Spaces are used only like commas. Words stick together!',
    solution: 'How to survive? Look for the COMMANDER (The Consonant)!'
  },
  {
    type: 'reading-algorithm',
    title: 'THE DECODING ALGORITHM',
    subtitle: 'How to read ANY word step-by-step',
    steps: [
      { id: 1, text: 'SPOT THE COMMANDER', desc: 'Find the Consonant (Big Letter)', icon: '👮‍♂️' },
      { id: 2, text: 'CHECK THE UNIFORM', desc: 'Is it Sun (Smooth) or Moon (Spiky)?', icon: '☀️🌑' },
      { id: 3, text: 'APPLY THE VOWEL', desc: 'Sun keeps vowel pure. Moon changes it.', icon: '🗣️' }
    ],
    warning: 'Never look at the vowel first! The Consonant controls everything.'
  },
  {
    type: 'comparison',
    title: 'Sun Team vs Moon Team',
    leftTeam: {
      name: 'Sun Team (A-Series)',
      voice: 'Light, natural voice',
      visual: 'Smooth, simple heads',
      examples: 'ក, ខ, ច, ត',
      vowelExample: 'កា = Kaa (Pure)'
    },
    rightTeam: {
      name: 'Moon Team (O-Series)',
      voice: 'Deep, bass voice',
      visual: 'Spiky hair, complex shapes',
      examples: 'គ, ឃ, ង, ជ',
      vowelExample: 'គា = Kea (Transformed)'
    }
  },
  {
    type: 'rule',
    title: 'THE 80% RULE',
    subtitle: 'Visual Identification Hack',
    rule80: '80% of cases: Spiky Hair = Moon! Smooth Head = Sun!',
    rule20: 'Exceptions exist (like ប and ស), but ignore them for today.',
    tip: 'Trust your eyes. If it looks spiky, assume it uses the Deep Voice.'
  },
  {
    type: 'ready',
    title: 'BRIEFING COMPLETE',
    subtitle: 'Ready to prove your skills?',
    description: 'Identify the letters. Apply the rules. Speed matters.',
    buttonText: 'START MISSION'
  }
];

const BootcampSession = ({ onClose }) => {
  const { loadUnitData } = useCourseMap();

  // --- STATE ---
  const [phase, setPhase] = useState('theory'); // 'theory' | 'practice' | 'finished'
  const [slideIndex, setSlideIndex] = useState(0); // Для теории

  const [drillQuestions, setDrillQuestions] = useState([]); // Для практики
  const [drillIndex, setDrillIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // --- ЗАГРУЗКА ПРАКТИКИ (В ФОНЕ) ---
  useEffect(() => {
    const initBootcamp = async () => {
      const data = await loadUnitData('10100'); // ID твоего Unit R1
      if (data && data.content) {
        // Вытаскиваем упражнения
        const allDrills = data.content.flatMap(lesson =>
          lesson.slides.filter(s => s.type === 'visual_decoder')
        );
        // Перемешиваем
        const shuffled = [...allDrills, ...allDrills].sort(() => Math.random() - 0.5);
        setDrillQuestions(shuffled);
      }
      setLoading(false);
    };
    initBootcamp();
  }, []);

  // --- ЛОГИКА ТЕОРИИ ---
  const nextSlide = () => {
    if (slideIndex < THEORY_SLIDES.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      setPhase('practice'); // Переход к практике
    }
  };

  const prevSlide = () => {
    if (slideIndex > 0) setSlideIndex(prev => prev - 1);
  };

  // --- ЛОГИКА ПРАКТИКИ ---
  const handleDrillComplete = () => {
    setScore(s => s + 10);
    // Быстрый переход
    setTimeout(() => {
      setDrillIndex(prev => prev + 1);
    }, 400);
  };

  // --- RENDERERS ДЛЯ СЛАЙДОВ ---
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
          <div className="w-full max-w-2xl">
             <h2 className="text-4xl font-black text-white mb-2">😱 {slide.title}</h2>
             <p className="text-xl text-amber-400 mb-8">{slide.subtitle}</p>

             <div className="bg-slate-800 p-6 rounded-xl mb-6 border-2 border-red-500/50 border-dashed">
               <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">English Analogy:</p>
               <p className="text-2xl text-white font-mono tracking-tighter bg-black/30 p-4 rounded">{slide.englishAnalogy}</p>
             </div>

             <div className="bg-green-600/20 p-6 rounded-xl border-l-4 border-green-500">
               <h3 className="text-xl font-bold text-green-400 mb-2">THE SOLUTION:</h3>
               <p className="text-white text-lg">{slide.solution}</p>
             </div>
          </div>
        );

      case 'reading-algorithm':
        return (
          <div className="w-full max-w-2xl">
            <h2 className="text-3xl font-black text-white mb-8 text-center">{slide.title}</h2>
            <div className="space-y-4 mb-8">
              {slide.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-4 bg-slate-800 p-4 rounded-xl border border-white/5">
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

      case 'comparison':
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
                  <div className="bg-white/30 p-2 rounded mt-2">
                    Ex: {slide.leftTeam.vowelExample}
                  </div>
                </div>
              </div>
              {/* MOON */}
              <div className="bg-gradient-to-b from-indigo-500 to-purple-700 rounded-xl p-6 text-white shadow-lg shadow-indigo-500/20">
                <h3 className="text-2xl font-black mb-4 flex items-center gap-2">🌑 {slide.rightTeam.name}</h3>
                 <div className="space-y-2 text-sm font-medium opacity-90">
                  <p>🗣 {slide.rightTeam.voice}</p>
                  <p>👁 {slide.rightTeam.visual}</p>
                  <div className="bg-black/30 p-2 rounded mt-2 border border-white/20">
                    Ex: {slide.rightTeam.vowelExample}
                  </div>
                </div>
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
            >
              {slide.buttonText}
            </button>
          </div>
        );

      default:
        return <div className="text-white">Slide type not supported</div>;
    }
  };


  // --- MAIN RETURN ---

  // 1. LOADING
  if (loading) return <div className="fixed inset-0 bg-slate-900 flex items-center justify-center text-white">Loading Mission Data...</div>;

  // 2. FINISHED
  if (drillIndex >= drillQuestions.length && phase === 'practice') {
     return (
      <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center text-white p-6 text-center">
        <h1 className="text-5xl font-black text-amber-400 mb-4">MISSION ACCOMPLISHED</h1>
        <p className="text-3xl mb-8">Final Score: {score}</p>
        <button onClick={onClose} className="px-8 py-4 bg-blue-600 rounded-xl font-bold text-lg">Return to Base</button>
      </div>
    );
  }

  // 3. THE INTERFACE
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
      <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto">

        {phase === 'theory' ? (
          // --- THEORY MODE ---
          <>
            {renderTheoryContent()}

            {/* Navigation Buttons (Hide on 'ready' slide) */}
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
          // --- PRACTICE MODE ---
          <VisualDecoder
            key={drillIndex}
            data={drillQuestions[drillIndex]}
            onComplete={() => handleDrillComplete()}
            hideContinue={true} // Активируем режим скорости!
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