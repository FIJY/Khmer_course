import React, { useState } from "react";
import { Check, X, ArrowRight } from "lucide-react";
import LessonFrame from "../UI/LessonFrame";
import VisualDecoder from "../VisualDecoder";

export default function SameDifferentSlide({ data, onComplete, onPlayAudio }) {
  const [selected, setSelected] = useState(null); // 'same' | 'different'
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const leftChar = data?.left_char || "";
  const rightChar = data?.right_char || "";
  const correctAnswer = (data?.correct_answer || "different").toLowerCase(); // 'same' | 'different'
  const explanation = data?.explanation || "";
  const title = data?.title || "Same or Different?";

  const handleSelect = (choice) => {
    if (hasSubmitted) return;
    setSelected(choice);
    setHasSubmitted(true);

    // Если ответ верный - сразу сообщаем плееру, что можно идти дальше
    const isCorrect = choice === correctAnswer;
    if (isCorrect && onComplete) {
      onComplete();
    }
  };

  const isCorrect = selected === correctAnswer;

  // Цвет рамок в зависимости от состояния
  const getBorderColor = () => {
    if (!hasSubmitted) return "border-white/10";
    return isCorrect ? "border-emerald-500/50" : "border-rose-500/50";
  };

  const getBgColor = () => {
    if (!hasSubmitted) return "bg-black/20";
    return isCorrect ? "bg-emerald-500/10" : "bg-rose-500/10";
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
      <LessonFrame className="pt-6 px-6 pb-10" variant="full">

        {/* Заголовок */}
        <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-8 text-center">
          {title}
        </h2>

        {/* Блок сравнения */}
        <div className="flex items-center justify-center gap-4 mb-10 w-full max-w-sm mx-auto relative">

          {/* Левая буква */}
          <div className={`flex-1 aspect-square rounded-3xl border-2 ${getBorderColor()} ${getBgColor()} flex items-center justify-center relative transition-all duration-500`}>
            <div className="w-2/3">
               <VisualDecoder
                 text={leftChar}
                 compact={true}
                 hideDefaultButton={true}
                 viewBoxPad={40}
                 onLetterClick={onPlayAudio} // Можно послушать при клике
               />
            </div>
          </div>

          {/* VS Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-900 border border-white/20 rounded-full w-10 h-10 flex items-center justify-center z-10 shadow-xl">
            <span className="text-[10px] font-black italic text-slate-400">VS</span>
          </div>

          {/* Правая буква */}
          <div className={`flex-1 aspect-square rounded-3xl border-2 ${getBorderColor()} ${getBgColor()} flex items-center justify-center relative transition-all duration-500`}>
            <div className="w-2/3">
               <VisualDecoder
                 text={rightChar}
                 compact={true}
                 hideDefaultButton={true}
                 viewBoxPad={40}
                 onLetterClick={onPlayAudio}
               />
            </div>
          </div>
        </div>

        {/* Вопрос */}
        <p className="text-xl font-bold text-white text-center mb-8">
          Do they sound the same?
        </p>

        {/* Кнопки ответа */}
        {!hasSubmitted ? (
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto">
            <button
              onClick={() => handleSelect("same")}
              className="py-4 rounded-2xl bg-gray-800 border border-white/10 text-white font-bold hover:bg-gray-700 hover:border-cyan-400/50 transition-all active:scale-95"
            >
              Same
            </button>
            <button
              onClick={() => handleSelect("different")}
              className="py-4 rounded-2xl bg-gray-800 border border-white/10 text-white font-bold hover:bg-gray-700 hover:border-cyan-400/50 transition-all active:scale-95"
            >
              Different
            </button>
          </div>
        ) : (
          /* Результат */
          <div className="w-full animate-in zoom-in-95 duration-300">
            <div className={`p-6 rounded-2xl border ${isCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`}>
              <div className="flex items-center gap-3 mb-2">
                {isCorrect ? <Check className="text-emerald-400" /> : <X className="text-rose-400" />}
                <span className={`font-black uppercase tracking-widest ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                  {isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              <p className="text-white font-bold text-lg mb-1">
                {selected === "same" ? "They are Same." : "They are Different."}
              </p>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {explanation}
              </p>
            </div>

            {/* Кнопка продолжить (если ошибся, чтобы все равно мог пройти дальше) */}
            {!isCorrect && (
               <button
                 onClick={onComplete}
                 className="mt-6 w-full py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
               >
                 Got it, continue
               </button>
            )}
          </div>
        )}

      </LessonFrame>
    </div>
  );
}