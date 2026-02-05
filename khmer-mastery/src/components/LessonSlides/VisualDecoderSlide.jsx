import React from 'react';
import VisualDecoder from '../VisualDecoder';
import LessonFrame from '../UI/LessonFrame';
import LessonHeader from '../UI/LessonHeader';

export default function VisualDecoderSlide({
  variant = 'full',
  current,
  highlightMode,
  onSelectionChange,
  onGlyphsRendered,
  onLetterClick,
  alphabetDb,
  selectionCount = 0,
  glyphCount = 0,
  onComplete,
  hideDefaultButton = true,
  interactionMode = 'decoder_select'
}) {
  if (variant === 'preview') {
    return (
      <VisualDecoder
        data={current}
        onComplete={onComplete}
        hideDefaultButton={hideDefaultButton}
      />
    );
  }

  return (
    <LessonFrame className="p-6">
      <LessonHeader
        title="Visual Decoder"
        hint={current?.instruction || current?.hint || 'Task: tap the glyphs to reveal and identify them.'}
      />

      <div className="mt-4 relative">
        <div className="absolute top-3 left-4 flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-[0.3em]">
          <span>Selected</span>
          <span className="text-cyan-300 font-black">
            {selectionCount}/{glyphCount || 0}
          </span>
        </div>
        <VisualDecoder
          data={current}
          highlightMode={highlightMode}
          interactionMode={interactionMode}
          selectionMode="multi"
          revealOnSelect={true}
          onSelectionChange={onSelectionChange}
          onGlyphsRendered={onGlyphsRendered}
          onLetterClick={onLetterClick}
          alphabetDb={alphabetDb}
          hideDefaultButton={hideDefaultButton}
        />
      </div>
    </LessonFrame>
  );
}
