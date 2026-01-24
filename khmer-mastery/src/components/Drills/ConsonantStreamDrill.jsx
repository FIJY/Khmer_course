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
    <div className="w-full bg-gray-900/60 p-5 rounded-[2rem] border-2 border-emerald-500/30 mb-4">
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

          if (!isC) {
            return (
              <span
                key={`${ch}-${i}`}
                className="transition-colors duration-300 cursor-default"
                style={{ color: anyRevealed ? '#64748b' : '#ffffff' }}
                onClick={() => onNonConsonantClick?.(ch)}
              >
                {ch}
              </span>
            );
          }

          return (
            <button
              key={`${ch}-${i}`}
              type="button"
              onClick={() => onConsonantClick?.(i, ch)}
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
