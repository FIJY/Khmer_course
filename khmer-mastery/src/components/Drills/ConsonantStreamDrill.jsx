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
      {/* Заголовок задания */}
      <div className="mb-8 flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
        <MousePointerClick size={16} />
        <span>Tap Consonants</span>
      </div>

      {/* Текст как поток */}
      <div className="w-full px-4 text-center">
        <div className="inline-block leading-[2.2] text-4xl md:text-5xl font-khmer select-none break-words">
          {chars.map((ch, i) => {
            const isC = isKhmerConsonant(ch);
            const revealed = isC && revealedSet.has(i);

            // Интерактивная буква (Согласная)
            if (isC) {
              return (
                <span
                  key={i}
                  onClick={() => onConsonantClick(i, ch)}
                  className={`
                    transition-all duration-300 cursor-pointer inline-block px-[1px]
                    ${revealed
                      ? 'text-emerald-400 font-bold scale-110 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                      : 'text-white hover:text-cyan-300 active:scale-95'
                    }
                  `}
                >
                  {ch}
                </span>
              );
            }

            // Неактивная буква (Гласная)
            return (
              <span
                key={i}
                onClick={() => onNonConsonantClick && onNonConsonantClick(ch)}
                className={`
                  transition-colors duration-500 inline-block px-[1px] cursor-pointer
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