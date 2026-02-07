import React, { useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import LessonFrame from "../UI/LessonFrame";
import { getSoundFileForChar } from "../../data/audioMap";
import VisualDecoder from "../VisualDecoder";

export default function DrillChoiceSlide({ data, onPlayAudio, onComplete }) {
  const {
    title = "Quiz",
    prompt = "Select the correct item",
    audio_question = null, // Если есть - это Аудио Дрилл, если нет - Визуальный
    options = [],
    correct_id,
    shuffle = true,
  } = data || {};

  const [status, setStatus] = useState("idle"); // idle | correct | wrong
  const [completed, setCompleted] = useState(false);
  const [shakeId, setShakeId] = useState(null);

  // Перемешивание
  const shuffledOptions = useMemo(() => {
    const arr = Array.isArray(options) ? [...options] : [];
    if (!shuffle) return arr;
    return arr.sort(() => Math.random() - 0.5);
  }, [options, shuffle]);

  // УМНАЯ СЕТКА: Настраиваем колонки и ширину в зависимости от числа опций
  const getGridConfig = () => {
    const n = shuffledOptions.length;
    if (n === 2) return "grid-cols-2 max-w-xs"; // Две рядом, узко
    if (n === 3) return "grid-cols-3 max-w-md"; // Три в ряд
    if (n === 4) return "grid-cols-2 max-w-sm"; // Классика 2x2
    if (n >= 6) return "grid-cols-3 max-w-lg";  // Большая сетка 3x2
    return "grid-cols-2 max-w-sm"; // Дефолт
  };

  const handleSelect = (option) => {
    if (completed) return;

    if (option.id === correct_id) {
      setStatus("correct");
      setCompleted(true);
      if (onPlayAudio) onPlayAudio("success.mp3");
      if (onComplete) setTimeout(onComplete, 1000);
    } else {
      setStatus("wrong");
      setShakeId(option.id);

      if (onPlayAudio) {
        const sound = option.audio || getSoundFileForChar(option.text);
        onPlayAudio(sound || "error.mp3");
      }

      setTimeout(() => {
        setStatus("idle");
        setShakeId(null);
      }, 500);
    }
  };

  // Авто-плей вопроса (если это аудио-дрилл)
  useEffect(() => {
    if (audio_question && onPlayAudio && !completed) {
      const timer = setTimeout(() => onPlayAudio(audio_question), 500);
      return () => clearTimeout(timer);
    }
  }, [audio_question, onPlayAudio, completed]);

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
      <LessonFrame className="pt-6 px-6 pb-10 border-0 ring-0 bg-transparent" variant="full">
        <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-2 text-center">
          {title}
        </h2>

        {/* Блок вопроса */}
        <div className="mb-8 text-center flex flex-col items-center gap-4 min-h-[80px] justify-center">
             {audio_question ? (
                // ВАРИАНТ 1: Кнопка звука (Audio Drill)
                <button
                  onClick={() => onPlayAudio && onPlayAudio(audio_question)}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 hover:scale-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(34,211,238,0.2)] animate-pulse"
                >
                  <Volume2 size={40} />
                </button>
             ) : (
                // ВАРИАНТ 2: Текст вопроса (Visual Drill)
                <p className="text-3xl font-black text-white leading-tight max-w-sm drop-shadow-md">
                   {prompt}
                </p>
             )}
             {/* Если аудио, подпись поменьше снизу */}
             {audio_question && <p className="text-sm text-slate-400 uppercase tracking-widest">{prompt}</p>}
        </div>

        {/* Сетка вариантов */}
        <div className={`grid ${getGridConfig()} gap-4 w-full mx-auto transition-all duration-300`}>
            {shuffledOptions.map((opt) => {
                const isCorrect = opt.id === correct_id;
                const isShaking = shakeId === opt.id;

                let baseClass = "relative aspect-square rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-200 active:scale-95";
                let colorClass = "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10";
                let textClass = "text-white";

                if (completed && isCorrect) {
                    colorClass = "border-emerald-500 bg-emerald-500/20 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105 z-10";
                    textClass = "text-emerald-400";
                } else if (isShaking) {
                    colorClass = "border-rose-500 bg-rose-500/20 shake";
                    textClass = "text-rose-400";
                } else if (completed && !isCorrect) {
                    colorClass = "border-transparent bg-transparent opacity-20 grayscale";
                }

                return (
                    <button
                        key={opt.id}
                        onClick={() => handleSelect(opt)}
                        disabled={completed}
                        className={`${baseClass} ${colorClass}`}
                    >
                        <div className={`w-3/4 h-3/4 pointer-events-none ${textClass}`}>
                            <VisualDecoder
                                text={opt.text}
                                compact={true}
                                hideDefaultButton={true}
                                interactionMode="view_only"
                                getGlyphFillColor={() => completed && isCorrect ? "#34d399" : (isShaking ? "#fb7185" : "currentColor")}
                            />
                        </div>
                    </button>
                );
            })}
        </div>
      </LessonFrame>
      <style>{`
        .shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
      `}</style>
    </div>
  );
}