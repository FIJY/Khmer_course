import React from 'react';

export default function QuizSlide({
  current,
  quizOptions,
  selectedOption,
  getQuizOption,
  onAnswer,
  showPronunciationPlaceholder = false
}) {
  return (
    <div className="w-full space-y-3">
      <h2 className="text-xl font-black mb-8 italic uppercase text-center text-white">{current?.question ?? ''}</h2>
      {quizOptions.map((opt, i) => {
        const { value, text, pronunciation, audio: optionAudio } = getQuizOption(opt);
        const rawValue = value;

        let buttonClass = 'bg-gray-900 border-white/5 text-white';
        if (selectedOption === rawValue) {
          const isCorrect = String(rawValue).trim() === String(current.correct_answer).trim();
          buttonClass = isCorrect
            ? 'bg-emerald-600 border-emerald-400 text-white'
            : 'bg-red-600 border-red-400 text-white';
        }

        return (
          <button
            key={i}
            disabled={!!selectedOption}
            onClick={() => onAnswer(rawValue, current.correct_answer, optionAudio || current.audio)}
            className={`w-full p-5 border rounded-2xl text-left font-bold transition-all ${buttonClass}`}
          >
            <div className="flex flex-col gap-1">
              <span className="text-2xl font-black">{text}</span>
              {(pronunciation || showPronunciationPlaceholder) && (
                <span className="text-xl font-semibold text-cyan-100 tracking-wide">{pronunciation || '—'}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
