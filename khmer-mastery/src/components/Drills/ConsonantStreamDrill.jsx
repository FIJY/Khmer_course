import React from "react";
import { MousePointerClick } from 'lucide-react';
import LessonCard from '../UI/LessonCard';

export default function ConsonantStreamDrill({
  text = "",
  revealedSet = new Set(), // Набор индексов уже найденных букв
  onConsonantClick,
  onNonConsonantClick,
  wordList = []
}) {
  // Разбиваем текст на массив символов (правильно работая с Unicode)
  const chars = Array.from(text);

  // Проверка: это согласная? (диапазон Unicode для кхмерских согласных)
  const isKhmerConsonant = (char) => {
    if (!char) return false;
    const cp = char.codePointAt(0);
    return cp >= 0x1780 && cp <= 0x17A2;
  };

  const hasWordList = Array.isArray(wordList) && wordList.length > 0;

  return (
    <div className="w-full flex justify-center px-4 animate-in fade-in zoom-in duration-300">
      <LessonCard className="max-w-2xl flex flex-col items-center">
        {/* Заголовок упражнения */}
        <div className="mb-8 flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-widest bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
          <MousePointerClick size={16} />
          <span>Tap Consonants</span>
        </div>

        {hasWordList ? (
          <div className="w-full flex flex-col gap-4 text-left">
            {wordList.map((entry, idx) => (
              <div
                key={`${entry.khmer || entry.word || idx}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-2xl md:text-3xl font-khmer text-white">
                    {entry.khmer || entry.word}
                  </div>
                  {entry.pronunciation ? (
                    <div className="text-sm text-cyan-300">{entry.pronunciation}</div>
                  ) : null}
                  {entry.translation ? (
                    <div className="text-sm text-slate-300">{entry.translation}</div>
                  ) : null}
                </div>
                {entry.starred ? (
                  <div className="text-2xl">⭐</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center max-w-2xl text-5xl md:text-6xl leading-[1.35] font-semibold tracking-wide">
            {chars.map((char, index) => {
              const isRevealed = revealedSet.has(index);
              const isTarget = isKhmerConsonant(char);

              return (
                <span
                  key={index}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (isTarget) {
                      // Если нажали на согласную - сообщаем наверх
                      if (onConsonantClick) onConsonantClick(index, char);
                    } else {
                      // Если промахнулись
                      if (onNonConsonantClick) onNonConsonantClick(index, char);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      if (isTarget) {
                        if (onConsonantClick) onConsonantClick(index, char);
                      } else if (onNonConsonantClick) {
                        onNonConsonantClick(index, char);
                      }
                    }
                  }}
                  className={`inline-flex cursor-pointer focus-visible:outline-none ${isTarget ? 'mx-1' : ''}`}
                  style={{
                    color: isTarget
                      ? (isRevealed ? '#34d399' : '#ffffff')
                      : (revealedSet.size > 0 ? '#64748b' : '#ffffff'),
                    transform: isRevealed ? 'scale(1.05)' : 'scale(1.0)',
                    transition: 'color 200ms ease, transform 120ms ease'
                  }}
                  title={isTarget ? 'Consonant' : 'Not a consonant'}
                >
                  <span className={!isRevealed && isTarget ? 'hover:underline decoration-2 underline-offset-8' : ''}>
                    {char}
                  </span>
                </span>
              );
            })}
          </div>
        )}
      </LessonCard>
    </div>
  );
}
