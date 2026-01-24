import React, { useMemo } from 'react';
import { MousePointerClick, Volume2 } from 'lucide-react';

const isKhmerConsonant = (ch) => {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  // Khmer consonants range
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
      {/* Подсказка сверху */}
      <div className="mb-6 flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
        <MousePointerClick size={16} />
        <span>Click the Consonants</span>
      </div>

      {/* Текстовый блок - теперь выглядит как текст, а не как кнопки */}
      <div className="bg-gray-900 border border-white/10 p-8 rounded-[2rem] shadow-2xl w-full">
        <div className="flex flex-wrap justify-center gap-[2px] leading-[2.5] text-4xl md:text-5xl font-khmer select-none">
          {chars.map((ch, i) => {
            const isC = isKhmerConsonant(ch);
            const revealed = isC && revealedSet.has(i);

            // Стиль для СОГЛАСНОЙ (Интерактивная)
            if (isC) {
              return (
                <span
                  key={i}
                  onClick={() => onConsonantClick(i, ch)}
                  className={`
                    transition-all duration-300 cursor-pointer px-1 rounded-lg
                    ${revealed
                      ? 'text-emerald-400 font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]' // Найдена
                      : 'text-white hover:text-cyan-200 hover:bg-white/5' // Ждет клика
                    }
                  `}
                >
                  {ch}
                </span>
              );
            }

            // Стиль для ОСТАЛЬНЫХ (Гласные/Пробелы)
            return (
              <span
                key={i}
                onClick={() => onNonConsonantClick && onNonConsonantClick(ch)}
                className={`
                  cursor-pointer px-0.5 transition-colors duration-500
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