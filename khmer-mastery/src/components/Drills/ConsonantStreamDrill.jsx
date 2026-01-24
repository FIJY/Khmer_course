import React, { useMemo } from 'react';
import { MousePointerClick } from 'lucide-react';
import InteractiveKhmerWord from '../InteractiveKhmerWord'; // <--- ИМПОРТ

export default function ConsonantStreamDrill({
  text,
  revealedSet,
  onConsonantClick,
  onNonConsonantClick
}) {
  const isKhmerConsonant = (ch) => {
    if (!ch) return false;
    const cp = ch.codePointAt(0);
    return cp >= 0x1780 && cp <= 0x17A2;
  };

  const handlePartClick = (char, index) => {
    if (isKhmerConsonant(char)) {
      onConsonantClick(index, char);
    } else {
      if (onNonConsonantClick) onNonConsonantClick(char);
    }
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
      <div className="mb-6 flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-widest bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
        <MousePointerClick size={16} />
        <span>Tap Consonants</span>
      </div>

      <div className="w-full bg-gray-900 border border-white/10 p-8 rounded-[2rem] shadow-2xl flex justify-center">
        {/* Рендерим как ВЕКТОР, а не как текст */}
        <InteractiveKhmerWord
           word={text}
           targetChar={null} // Нам не нужна одна цель, мы обрабатываем все клики сами
           onPartClick={handlePartClick} // Перехватываем клик
           // Передаем состояние "найденных" букв внутрь, чтобы красить их
           revealedIndices={revealedSet}
           fontSize={80}
        />
      </div>
    </div>
  );
}