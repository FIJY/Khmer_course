import React from "react";
import { MousePointerClick } from 'lucide-react';

export default function ConsonantStreamDrill({
  text = "",
  revealedSet = new Set(), // Набор индексов уже найденных букв
  onConsonantClick,
  onNonConsonantClick
}) {
  // Разбиваем текст на массив символов (правильно работая с Unicode)
  const chars = Array.from(text);

  // Проверка: это согласная? (диапазон Unicode для кхмерских согласных)
  const isKhmerConsonant = (char) => {
    if (!char) return false;
    const cp = char.codePointAt(0);
    return cp >= 0x1780 && cp <= 0x17A2;
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">

      {/* Заголовок упражнения */}
      <div className="mb-8 flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
        <MousePointerClick size={16} />
        <span>Tap Consonants</span>
      </div>

      {/* Контейнер с буквами */}
      <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
        {chars.map((char, index) => {
          const isRevealed = revealedSet.has(index);
          const isTarget = isKhmerConsonant(char);

          return (
            <button
              key={index}
              onClick={() => {
                if (isTarget) {
                  // Если нажали на согласную - сообщаем наверх
                  if (onConsonantClick) onConsonantClick(index, char);
                } else {
                  // Если промахнулись
                  if (onNonConsonantClick) onNonConsonantClick(char);
                }
              }}
              // СТИЛИ КНОПКИ
              className={`
                relative w-16 h-16 rounded-2xl flex items-center justify-center text-4xl font-bold transition-all duration-300
                ${isRevealed
                  ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-110 z-10"
                  : "bg-gray-800/50 text-gray-500 hover:bg-gray-700 hover:text-gray-200 border border-white/5"}
              `}
            >
              <span className={isRevealed ? "drop-shadow-md" : ""}>{char}</span>

              {/* Эффект пульсации при открытии */}
              {isRevealed && (
                <span className="absolute inset-0 rounded-2xl bg-emerald-400 opacity-20 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}