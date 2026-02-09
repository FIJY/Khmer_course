import React from "react";
import { MousePointerClick } from 'lucide-react';
import LessonCard from '../UI/LessonCard';
import VisualDecoder from '../VisualDecoder';

export default function ConsonantStreamDrill({
  text = "",
  revealedSet = new Set(), // Набор индексов уже найденных букв
  onConsonantClick,
  onNonConsonantClick,
  wordList = []
}) {
  // Проверка: это согласная? (диапазон Unicode для кхмерских согласных)
  const isKhmerConsonant = (char) => {
    if (!char) return false;
    const cp = char.codePointAt(0);
    return cp >= 0x1780 && cp <= 0x17A2;
  };

  const hasWordList = Array.isArray(wordList) && wordList.length > 0;

  const handleGlyphClick = (char, glyphMeta) => {
    const resolvedIndex = Number.isInteger(glyphMeta?.resolvedIndex)
      ? glyphMeta.resolvedIndex
      : -1;
    if (isKhmerConsonant(char)) {
      if (onConsonantClick) onConsonantClick(resolvedIndex, char);
    } else if (onNonConsonantClick) {
      onNonConsonantClick(resolvedIndex, char);
    }
  };

  return (
    <div className="w-full flex justify-center px-4 animate-in fade-in zoom-in duration-300">
      <LessonCard className="max-w-2xl flex flex-col items-center">
        {/* Заголовок упражнения */}
        <div className="mb-8 flex items-center gap-2 text-cyan-300 text-xs font-bold uppercase tracking-widest bg-cyan-950/30 px-4 py-2 rounded-full border border-cyan-500/20">
          <MousePointerClick size={16} />
          <span>Tap Consonants</span>
        </div>

        <div className="w-full">
          <VisualDecoder
            text={text}
            interactionMode="decoder_select"
            selectionMode="multi"
            revealOnSelect={false}
            showTapHint={false}
            feedbackRule=""
            hideDefaultButton={true}
            onGlyphClick={handleGlyphClick}
          />
        </div>

        {hasWordList ? (
          <div className="w-full flex flex-col gap-4 text-left mt-6">
            {wordList.map((entry, idx) => (
              <div
                key={`${entry.khmer || entry.word || idx}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-2xl md:text-3xl font-khmer text-white">
                    {entry.khmer || entry.word}
                  </div>
                  {entry.pronunciation ? (
                    <div className="text-sm text-cyan-300">{entry.pronunciation}</div>
                  ) : null}
                  {entry.translation ? (
                    <div className="text-sm text-slate-300">{entry.translation}</div>
                  ) : null}
                </div>
                {entry.starred ? (
                  <div className="text-2xl">⭐</div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </LessonCard>
    </div>
  );
}
