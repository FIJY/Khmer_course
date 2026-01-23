import React, { useState, useEffect } from 'react';
import KhmerColoredText from '../KhmerColoredText'; // Твой компонент для рендера
import { X, Volume2, Zap, ArrowRight, ArrowLeft } from 'lucide-react';

// --- 1. ТЕОРИЯ (НОВЫЙ ПОРЯДОК И КОНТЕНТ) ---
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
    khmerAnalogy: 'ភាសាខ្មែរមិនដកឃ្លាទេ', // Пример текста
    solution: 'Don\'t panic. We just need to find the COMMANDERS.'
  },
  {
    type: 'comparison',
    title: 'TWO TEAMS',
    subtitle: 'Every consonant belongs to a team. This determines the VOWEL sound.',
    // SUN TEAM CONFIG
    leftTeam: {
      name: 'SUN TEAM',
      color: '#ffb020', // Янтарный (как в твоем конфиге)
      textColor: 'text-amber-400',
      description: 'Light, natural voice. "A" series.',
      visualRule: 'SMOOTH HEAD (Normal hair)',
      // Используем буквы для рендера через KhmerColoredText
      chars: ['ក', 'ខ', 'ច', 'ឆ'],
      audioFiles: ['letter_ka.mp3', 'letter_kha.mp3', 'letter_cha.mp3', 'letter_chha.mp3']
    },
    // MOON TEAM CONFIG
    rightTeam: {
      name: 'MOON TEAM',
      color: '#6b5cff', // Индиго (как в твоем конфиге)
      textColor: 'text-indigo-400',
      description: 'Deep, bass voice. "O" series.',
      visualRule: 'SPIKY HAIR (Complex top)',
      chars: ['គ', 'ឃ', 'ជ', 'ឈ'],
      audioFiles: ['letter_ko.mp3', 'letter_kho.mp3', 'letter_cho.mp3', 'letter_chho.mp3']
    }
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

// Демо-данные для аркады (чтобы не падало без базы)
const DEMO_DRILLS = [
  { question: 'ក', correct: 0, options: ['SUN ☀️', 'MOON 🌑'] },
  { question: 'គ', correct: 1, options: ['SUN ☀️', 'MOON 🌑'] },
  { question: 'ខ', correct: 0, options: ['SUN ☀️', 'MOON 🌑'] },
  { question: 'ឃ', correct: 1, options: ['SUN ☀️', 'MOON 🌑'] }
];

const BootcampSession = ({ onClose }) => {
  const [phase, setPhase] = useState('theory');
  const [slideIndex, setSlideIndex] = useState(0);
  const [drillQuestions, setDrillQuestions] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [score, setScore] = useState(0);

  // Инициализация
  useEffect(() => {
    const shuffled = [...DEMO_DRILLS, ...DEMO_DRILLS].sort(() => Math.random() - 0.5);
    setDrillQuestions(shuffled);
  }, []);

  // --- AUDIO ENGINE ---
  const playAudio = (fileName) => {
    if (!fileName) return;
    // Путь к файлам в папке public/sounds/
    const audio = new Audio(`/sounds/${fileName}`);
    audio.play().catch(e => console.warn("Audio file missing:", fileName));
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

  // --- RENDERERS ---
  const renderTheoryContent = () => {
    const slide = THEORY_SLIDES[slideIndex];

    switch (slide.type) {
      case 'title':
        return (
          <div className="text-center animate-in fade-in zoom-in duration-500 py-10">
            <div className="text-8xl mb-6">{slide.icon}</div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase tracking-tighter">{slide.title}</h1>
            <p className="text-xl md:text-3xl text-amber-400 mb-8 font-mono">{slide.subtitle}</p>
            <p className="text-lg md:text-xl text-slate-300 max-w-lg mx-auto">{slide.description}</p>
          </div>
        );

      case 'no-spaces':
        return (
          <div className="w-full max-w-3xl text-center py-4">
             <h2 className="text-4xl font-black text-white mb-4">{slide.title}</h2>
             <p className="text-2xl text-amber-400 mb-8">{slide.subtitle}</p>

             {/* English Analogy */}
             <div className="bg-slate-800/50 p-6 rounded-xl mb-6 border border-slate-700">
               <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">English Analogy</p>
               <p className="text-xl md:text-3xl text-white font-mono tracking-tighter bg-black/50 p-4 rounded break-all">
                 {slide.englishAnalogy}
               </p>
             </div>

             {/* KHMER RENDERER - HIGHLIGHTING COMMANDERS */}
             <div className="bg-slate-900 p-8 rounded-xl mb-8 border border-slate-700 shadow-2xl">
                <p className="text-slate-400 text-sm mb-4 uppercase tracking-widest">Khmer Reality</p>
                {/* Используем твой компонент для красивого рендера */}
                <KhmerColoredText
                  text={slide.khmerAnalogy}
                  fontSize={64}
                  className="block w-full text-center"
                  colors={{
                    CONSONANT_A: '#ffffff', // Пока просто белый, чтобы показать хаос
                    CONSONANT_O: '#ffffff',
                    OTHER: '#64748b' // Остальное серым
                  }}
                />
             </div>

             <p className="text-green-400 text-xl font-bold px-4">{slide.solution}</p>
          </div>
        );

      case 'comparison':
        return (
          <div className="w-full max-w-6xl py-2">
            <h2 className="text-3xl font-black text-white mb-2 text-center">{slide.title}</h2>
            <p className="text-slate-400 text-center mb-6">{slide.subtitle}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT: SUN TEAM */}
              <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl flex flex-col items-center shadow-lg shadow-amber-900/10">
                <h3 className={`text-3xl font-black ${slide.leftTeam.textColor} mb-4 uppercase tracking-widest`}>{slide.leftTeam.name}</h3>

                {/* RENDER LETTERS WITH COMPONENT */}
                <div className="flex gap-4 mb-6">
                  {slide.leftTeam.chars.map((char, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="bg-black/50 p-4 rounded-xl border border-white/5 cursor-pointer hover:bg-black/80 transition-colors"
                           onClick={() => playAudio(slide.leftTeam.audioFiles[i])}>
                        <KhmerColoredText
                          text={char}
                          fontSize={60}
                          colors={{ CONSONANT_A: slide.leftTeam.color, OTHER: slide.leftTeam.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 mb-4">
                  <p className="text-amber-200 font-bold text-sm uppercase">{slide.leftTeam.visualRule}</p>
                </div>
                <p className="text-slate-400 text-center text-sm">{slide.leftTeam.description}</p>
              </div>

              {/* RIGHT: MOON TEAM */}
              <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl flex flex-col items-center shadow-lg shadow-indigo-900/10">
                <h3 className={`text-3xl font-black ${slide.rightTeam.textColor} mb-4 uppercase tracking-widest`}>{slide.rightTeam.name}</h3>

                {/* RENDER LETTERS WITH COMPONENT */}
                <div className="flex gap-4 mb-6">
                  {slide.rightTeam.chars.map((char, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="bg-black/50 p-4 rounded-xl border border-white/5 cursor-pointer hover:bg-black/80 transition-colors"
                           onClick={() => playAudio(slide.rightTeam.audioFiles[i])}>
                        <KhmerColoredText
                          text={char}
                          fontSize={60}
                          colors={{ CONSONANT_O: slide.rightTeam.color, OTHER: slide.rightTeam.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 mb-4">
                  <p className="text-indigo-200 font-bold text-sm uppercase">{slide.rightTeam.visualRule}</p>
                </div>
                <p className="text-slate-400 text-center text-sm">{slide.rightTeam.description}</p>
              </div>
            </div>
          </div>
        );

      case 'reading-algorithm':
        return (
          <div className="w-full max-w-3xl py-10">
            <h2 className="text-3xl font-black text-white mb-8 text-center">{slide.title}</h2>
            <div className="space-y-4 mb-8">
              {slide.steps.map((step, i) => (
                <div key={i} className="flex items-center gap-6 bg-slate-800 p-6 rounded-2xl border border-white/5">
                  <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white shrink-0 border border-white/10 shadow-inner">
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
          <div className="text-center py-20">
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
        return null;
    }
  };


  // --- MAIN RENDER ---
  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">

      {/* HEADER */}
      <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-white/5 shrink-0">
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
        <button onClick={onClose} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
          <X className="text-white w-6 h-6" />
        </button>
      </div>

      {/* BODY (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center p-4 pb-32">
          {phase === 'theory' ? renderTheoryContent() : (
            // Тут должна быть практика (VisualDecoder), но мы пока заглушку ставим если что
            <div className="text-white text-2xl">DRILL MODE STARTING...</div>
          )}
        </div>
      </div>

      {/* FOOTER CONTROLS (FIXED BOTTOM) */}
      {phase === 'theory' && THEORY_SLIDES[slideIndex].type !== 'ready' && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 to-slate-950/90 border-t border-white/5 backdrop-blur-lg z-10">
          <div className="max-w-4xl mx-auto flex gap-4">
             <button
                onClick={prevSlide}
                disabled={slideIndex === 0}
                className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 font-bold disabled:opacity-30 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} /> Back
              </button>
              <button
                onClick={nextSlide}
                className="flex-[2] py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                Next Step <ArrowRight size={20} />
              </button>
          </div>
        </div>
      )}

      {/* PROGRESS BAR */}
      <div className="h-1 bg-slate-900 w-full absolute top-[72px]">
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