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

      <div className="w-full bg-gray-900/50 border border-white/5 p-8 rounded-[2rem]">
        {/* tracking-normal и leading-relaxed важны для кхмерского */}
        <p className="text-4xl md:text-5xl font-khmer leading-[2.0] text-center select-none break-words tracking-normal">
          {chars.map((ch, i) => {
            const isC = isKhmerConsonant(ch);
            const revealed = isC && revealedSet.has(i);

            return (
              <span
                key={i}
                onClick={() => isC ? onConsonantClick(i, ch) : (onNonConsonantClick && onNonConsonantClick(ch))}
                className={`
                  cursor-pointer transition-all duration-300 inline-block px-[1px]
                  ${isC
                    ? (revealed ? 'text-emerald-400 font-bold scale-110' : 'text-white hover:text-cyan-300')
                    : (anyRevealed ? 'text-gray-700' : 'text-gray-400 hover:text-red-400')
                  }
                `}
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