import React, { useMemo } from 'react';
import { MousePointerClick } from 'lucide-react';

// Хелпер для определения согласных
const isKhmerConsonant = (ch) => {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return cp >= 0x1780 && cp <= 0x17A2;
};

export default function ConsonantStreamDrill({
  text,
  revealedSet,
  onConsonantClick,
  onNonConsonantClick
}) {
  const chars = useMemo(() => Array.from(text || ''), [text]);
  const anyRevealed = revealedSet.size > 0;

  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-6 flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
        <MousePointerClick size={16} />
        <span>Tap Consonants</span>
      </div>

      <div className="bg-gray-900 border border-white/10 p-8 rounded-[2rem] shadow-2xl w-full text-center">
        <p className="text-5xl md:text-6xl font-khmer leading-[1.8] select-none text-white break-words">
          {chars.map((ch, i) => {
            const isC = isKhmerConsonant(ch);
            const revealed = isC && revealedSet.has(i);

            // ИСПРАВЛЕНИЕ: Теперь имя переменной (baseClass) совпадает с тем, что используется ниже
            const baseClass = "cursor-pointer transition-all duration-100 inline-block px-[2px] active:scale-95";

            // Стили состояний
            const revealedStyle = "text-emerald-400 font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]";
            const normalStyle = "text-white hover:text-cyan-300";
            const errorStyle = "text-gray-500 hover:text-red-400"; // Гласные

            return (
              <span
                key={i}
                onClick={() => isC ? onConsonantClick(i, ch) : (onNonConsonantClick && onNonConsonantClick(ch))}
                className={`${baseClass} ${
                  isC
                    ? (revealed ? revealedStyle : normalStyle)
                    : errorStyle
                }`}
              >
                {ch}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}