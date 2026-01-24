import React, { useMemo } from 'react';
import { MousePointerClick } from 'lucide-react';

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

      {/* Контейнер текста: убрали gap, добавили tracking-normal */}
      <div className="bg-gray-900 border border-white/10 p-8 rounded-[2rem] shadow-2xl w-full">
        <div className="flex flex-wrap justify-center text-4xl md:text-5xl font-khmer select-none leading-relaxed break-words text-center">
          {chars.map((ch, i) => {
            const isC = isKhmerConsonant(ch);
            const revealed = isC && revealedSet.has(i);

            // Базовый стиль для всех букв (cursor-pointer делает их "нажимаемыми")
            const baseClass = "cursor-pointer transition-all duration-200 inline-block";

            if (isC) {
              return (
                <span
                  key={i}
                  onClick={() => onConsonantClick(i, ch)}
                  className={`${baseClass}
                    ${revealed
                      ? 'text-emerald-400 font-bold scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] z-10 relative'
                      : 'text-white hover:text-cyan-200 hover:scale-105'
                    }
                  `}
                >
                  {ch}
                </span>
              );
            }

            // Гласные и знаки
            return (
              <span
                key={i}
                onClick={() => onNonConsonantClick && onNonConsonantClick(ch)}
                className={`${baseClass}
                  ${anyRevealed ? 'text-gray-600' : 'text-gray-300'}
                  hover:text-red-400
                `}
              >
                {ch}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}