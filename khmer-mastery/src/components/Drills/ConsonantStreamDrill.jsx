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
    <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
      <div className="mb-6 flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
        <MousePointerClick size={16} />
        <span>Tap Consonants</span>
      </div>

      <div className="w-full bg-gray-900 border border-white/10 p-8 rounded-[2rem] shadow-2xl text-center">
        <div className="flex flex-wrap justify-center text-5xl md:text-6xl font-khmer leading-[2.0] break-words">
          {chars.map((ch, i) => {
            const isC = isKhmerConsonant(ch);
            const revealed = isC && revealedSet.has(i);

            // ИСПРАВЛЕНИЕ: Используем button вместо span для надежного клика
            return (
              <button
                key={i}
                type="button"
                onClick={() => isC ? onConsonantClick(i, ch) : (onNonConsonantClick && onNonConsonantClick(ch))}
                className={`
                  transition-all duration-200 px-1 rounded-lg focus:outline-none
                  ${isC
                    ? (revealed
                        ? 'text-emerald-400 font-bold scale-110 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                        : 'text-white hover:text-cyan-300 hover:bg-white/5 active:scale-95')
                    : (anyRevealed
                        ? 'text-gray-600 cursor-default'
                        : 'text-gray-400 hover:text-red-400 active:animate-ping')
                  }
                `}
              >
                {ch}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}