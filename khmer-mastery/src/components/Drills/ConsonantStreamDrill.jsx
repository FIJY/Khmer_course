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
    <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
      <div className="mb-6 flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
        <MousePointerClick size={16} />
        <span>Tap Consonants</span>
      </div>

      <div className="w-full bg-gray-900 border border-white/10 p-8 rounded-[2rem] shadow-2xl text-center">
        {/* Используем обычный параграф, чтобы текст не разваливался */}
        <p className="text-5xl md:text-6xl font-khmer leading-[2.0] select-none text-white break-words tracking-normal">
          {chars.map((ch, i) => {
            const isC = isKhmerConsonant(ch);
            const revealed = isC && revealedSet.has(i);

            // Стиль курсора
            const cursorClass = "cursor-pointer hover:opacity-80 active:scale-95 transition-all duration-100 inline-block";

            // Цвет
            let colorClass = "text-white";
            if (isC && revealed) colorClass = "text-emerald-400 font-bold drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]";
            else if (!isC && anyRevealed) colorClass = "text-gray-600"; // Тускнеем гласные после первого клика

            return (
              <span
                key={i}
                onClick={() => isC ? onConsonantClick(i, ch) : (onNonConsonantClick && onNonConsonantClick(ch))}
                className={`${cursorClass} ${colorClass}`}
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