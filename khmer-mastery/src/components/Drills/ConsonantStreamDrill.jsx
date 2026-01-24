import React, { useMemo } from 'react';
import { MousePointerClick } from 'lucide-react';

const isKhmerConsonant = (ch) => {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  // Khmer consonants: U+1780..U+17A2
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
    <div className="w-full bg-gray-900/60 p-5 rounded-[2rem] border-2 border-emerald-500/30 mb-4 animate-in fade-in zoom-in duration-300">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm uppercase tracking-widest">
          <MousePointerClick size={18} />
          Click Commanders
        </div>
      </div>

      <div className="select-none text-4xl md:text-5xl leading-[1.6] font-semibold tracking-wide break-words font-khmer text-center">
        {chars.map((ch, i) => {
          const isC = isKhmerConsonant(ch);
          const revealed = isC && revealedSet.has(i);

          // Стиль для НЕ согласных (гласные и знаки)
          if (!isC) {
            return (
              <button
                key={i}
                type="button"
                className="transition-colors duration-300 cursor-pointer hover:text-red-400"
                style={{ color: anyRevealed ? '#64748b' : '#ffffff' }} // Становятся серыми после первого клика
                onClick={() => onNonConsonantClick && onNonConsonantClick(ch)}
              >
                {ch}
              </button>
            );
          }

          // Стиль для СОГЛАСНЫХ (Командиров)
          return (
            <button
              key={i}
              type="button"
              onClick={() => onConsonantClick(i, ch)}
              className={`inline-block transition-all duration-200 ${revealed ? 'scale-110' : 'hover:scale-110 active:scale-95'}`}
              style={{ color: revealed ? '#34d399' : '#ffffff' }}
            >
              <span className={!revealed ? 'border-b-2 border-white/20 pb-1' : ''}>
                {ch}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}