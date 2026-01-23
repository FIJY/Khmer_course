import React, { useState, useEffect } from 'react';
import KhmerColoredText from '../KhmerColoredText';
import VisualDecoder from '../VisualDecoder'; // ВЕРНУЛИ ДВИЖОК ИГРЫ
import useCourseMap from '../../hooks/useCourseMap'; // ВЕРНУЛИ БАЗУ ДАННЫХ
import { X, Volume2, Zap, ArrowRight, ArrowLeft } from 'lucide-react';

// --- 1. ТЕОРИЯ (ПРЕЗЕНТАЦИЯ) ---
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
    solution: 'Don\'t panic. We just need to find the COMMANDERS (Consonants).'
  },
  {
    type: 'comparison',
    title: 'TWO TEAMS',
    subtitle: 'Every consonant belongs to a team. This determines the VOWEL sound.',
    leftTeam: {
      name: 'SUN TEAM',
      color: '#ffb020',
      textColor: 'text-amber-400',
      description: 'Light, natural voice. "A" series.',
      visualRule: 'SMOOTH HEAD',
      chars: ['ក', 'ខ', 'ច', 'ឆ'],
      audioFiles: ['letter_ka.mp3', 'letter_kha.mp3', 'letter_cha.mp3', 'letter_chha.mp3']
    },
    rightTeam: {
      name: 'MOON TEAM',
      color: '#6b5cff',
      textColor: 'text-indigo-400',
      description: 'Deep, bass voice. "O" series.',
      visualRule: 'SPIKY HAIR',
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

const BootcampSession = ({ onClose }) => {
  const { loadUnitData } = useCourseMap(); // Подключаем хук базы
  const [phase, setPhase] = useState('theory');
  const [slideIndex, setSlideIndex] = useState(0);

  // Состояние игры
  const [drillQuestions, setDrillQuestions] = useState([]);
  const [drillIndex, setDrillIndex] = useState(0);
  const [score, setScore] = useState(0);

  // Состояние загрузки
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState(null);

  // --- ЗАГРУЗКА ИЗ БАЗЫ ДАННЫХ ---
  useEffect(() => {
    const initBootcamp = async () => {
      try {
        console.log("Loading Unit 10100...");
        // ВАЖНО: Грузим Unit 10100, который ты показала на скриншоте таблицы lessons
        const data = await loadUnitData('10100');

        if (data && data.content) {
          // Вытаскиваем все упражнения типа visual_decoder
          const allDrills = data.content.flatMap(lesson =>
             lesson.slides ? lesson.slides.filter(s => s.type === 'visual_decoder') : []
          );

          if (allDrills.length > 0) {
            // Перемешиваем
            const shuffled = [...allDrills, ...allDrills].sort(() => Math.random() - 0.5);
            setDrillQuestions(shuffled);
          } else {
            console.warn("No drills found in JSON content for 10100");
            setDataError("No drills found. Check content JSON.");
          }
        } else {
           console.error("Unit 10100 not found or empty");
           setDataError("Unit data missing.");
        }
      } catch (err) {
        console.error("DB Load Error:", err);
        setDataError("Connection error.");
      } finally {
        setDataLoading(false);
      }
    };
    initBootcamp();
  }, []);

  const playAudio = (fileName) => {
    if (!fileName) return;
    // Файлы должны лежать в папке public/sounds/ твоего проекта
    const audio = new Audio(`/sounds/${fileName}`);
    audio.play().catch(e => console.warn("Audio file missing in /public/sounds/:", fileName));
  };

  const nextSlide = () => {
    if (slideIndex < THEORY_SLIDES.length - 1) {
      setSlideIndex(prev => prev + 1);
    } else {
      // ПЕРЕХОД К ПРАКТИКЕ
      if (dataError || drillQuestions.length === 0) {
        alert("Error loading drills: " + (dataError || "No questions"));
        return;
      }
      setPhase('practice');
    }
  };

  const prevSlide = () => {
    if (slideIndex > 0) setSlideIndex(prev => prev - 1);
  };

  const handleDrillComplete = () => {
    setScore(s => s + 10);
    // Авто-переход
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
          <div className="text-center animate-in fade-in zoom-in duration-500 py-10">
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

             {/* English Analogy */}
             <div className="bg-slate-800/50 p-6 rounded-xl mb-6 border border-slate-700">
               <p className="text-slate-400 text-sm mb-2 uppercase tracking-widest">English Analogy</p>
               <p className="text-xl md:text-2xl text-white font-mono tracking-tighter bg-black/50 p-4 rounded break-all">
                 {slide.englishAnalogy}
               </p>
             </div>

             {/* KHMER REALITY (С ЦВЕТНЫМ ТЕКСТОМ) */}
             <div className="bg-slate-900 p-8 rounded-xl mb-8 border border-slate-700 shadow-2xl relative">
                <p className="text-slate-400 text-sm mb-4 uppercase tracking-widest">Khmer Reality</p>
                {/* Компонент с фиксом краша */}
                <KhmerColoredText
                  text={slide.khmerAnalogy}
                  fontSize={48}
                  className="block w-full text-center"
                  // Подсвечиваем согласные белым, остальное серым, чтобы выделить структуру
                  colors={{ CONSONANT_A: '#ffffff', CONSONANT_O: '#ffffff', OTHER: '#475569' }}
                />
             </div>

             <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/30">
                <p className="text-green-400 text-lg font-bold">{slide.solution}</p>
             </div>
          </div>
        );

      case 'comparison':
        return (
          <div className="w-full py-2">
            <h2 className="text-2xl font-black text-white mb-2 text-center">{slide.title}</h2>
            <p className="text-slate-400 text-center mb-6 text-sm">{slide.subtitle}</p>

            <div className="grid grid-cols-1 gap-6 pb-24">
              {/* LEFT: SUN TEAM */}
              <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl flex flex-col items-center shadow-lg shadow-amber-900/10">
                <h3 className={`text-2xl font-black ${slide.leftTeam.textColor} mb-4 uppercase tracking-widest`}>{slide.leftTeam.name}</h3>

                <div className="flex gap-2 mb-4">
                  {slide.leftTeam.chars.map((char, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <button className="bg-black/50 p-2 rounded-xl border border-white/5 cursor-pointer hover:bg-black/80 transition-colors active:scale-95"
                           onClick={() => playAudio(slide.leftTeam.audioFiles[i])}>
                        <KhmerColoredText
                          text={char}
                          fontSize={42}
                          colors={{ CONSONANT_A: slide.leftTeam.color, OTHER: slide.leftTeam.color }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 mb-2">
                  <p className="text-amber-200 font-bold text-xs uppercase">{slide.leftTeam.visualRule}</p>
                </div>
              </div>

              {/* RIGHT: MOON TEAM */}
              <div className="bg-slate-900 border border-indigo-500/30 p-4 rounded-2xl flex flex-col items-center shadow-lg shadow-indigo-900/10">
                <h3 className={`text-2xl font-black ${slide.rightTeam.textColor} mb-4 uppercase tracking-widest`}>{slide.rightTeam.name}</h3>

                <div className="flex gap-2 mb-4">
                  {slide.rightTeam.chars.map((char, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <button className="bg-black/50 p-2 rounded-xl border border-white/5 cursor-pointer hover:bg-black/80 transition-colors active:scale-95"
                           onClick={() => playAudio(slide.rightTeam.audioFiles[i])}>
                        <KhmerColoredText
                          text={char}
                          fontSize={42}
                          colors={{ CONSONANT_O: slide.rightTeam.color, OTHER: slide.rightTeam.color }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 mb-2">
                  <p className="text-indigo-200 font-bold text-xs uppercase">{slide.rightTeam.visualRule}</p>
                </div>
              </div>
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
                  <div className="bg-slate-900 w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0 border border-white/10 shadow-inner">
                    {step.id}
                  </div>
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
            <p className="text-xl text-slate-300 mb-8 max-w-md mx-auto">{slide.description}</p>

            {/* ИНДИКАТОР ЗАГРУЗКИ */}
            {dataLoading && <p className="text-amber-400 mb-4 animate-pulse">Loading drills from database...</p>}
            {dataError && <p className="text-red-400 mb-4 bg-red-900/20 p-2 rounded border border-red-500/50">{dataError}</p>}

            <button
              onClick={nextSlide}
              disabled={dataLoading || !!dataError}
              className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-black text-xl font-black py-5 px-16 rounded-full shadow-xl shadow-amber-500/20 transition-transform hover:scale-105 active:scale-95"
            >
              {dataLoading ? 'WAIT...' : slide.buttonText}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  // --- RENDER ---
  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-slate-950 flex flex-col shadow-2xl relative overflow-hidden">

        {/* HEADER */}
        <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-white/5 shrink-0 z-20 relative">
          <div className="flex items-center gap-3">
            {phase === 'theory' ? (
              <span className="text-slate-400 font-mono text-xs">BRIEFING: {slideIndex + 1}/{THEORY_SLIDES.length}</span>
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

        {/* PROGRESS */}
        <div className="h-1 bg-slate-900 w-full relative z-20">
          <div
            className={`h-full transition-all duration-300 ${phase === 'theory' ? 'bg-blue-500' : 'bg-amber-400'}`}
            style={{ width: phase === 'theory'
              ? `${((slideIndex + 1) / THEORY_SLIDES.length) * 100}%`
              : `${((drillIndex) / drillQuestions.length) * 100}%`
            }}
          />
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32">
          {phase === 'theory' ? renderTheoryContent() : (
            <div className="flex flex-col items-center justify-center h-full">
              {drillIndex < drillQuestions.length ? (
                 // --- ВОТ ОН, ДВИЖОК! БОЛЬШЕ НИКАКИХ "DRILL STARTING" ---
                 <VisualDecoder
                    key={drillIndex}
                    data={drillQuestions[drillIndex]}
                    onComplete={() => handleDrillComplete()}
                    hideContinue={true} // Режим Аркады
                  />
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

        {/* FOOTER NAV (Только для теории) */}
        {phase === 'theory' && THEORY_SLIDES[slideIndex].type !== 'ready' && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-30">
            <div className="flex gap-3">
               <button
                  onClick={prevSlide}
                  disabled={slideIndex === 0}
                  className="flex-1 py-4 rounded-xl bg-slate-800 text-slate-400 font-bold disabled:opacity-0 hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
};

export default BootcampSession;