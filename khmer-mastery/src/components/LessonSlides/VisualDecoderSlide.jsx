import React, { useRef } from 'react';
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
  onResetSelection,
  resetSelectionKey,
  onComplete,
  hideDefaultButton = true,
  interactionMode = 'decoder_select'
}) {
  const cardRef = useRef(null);
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

      <div ref={cardRef} className="mt-4 relative">
        <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-[0.3em] pointer-events-none">
          <div className="flex items-center gap-2">
            <span>Selected</span>
            <span className="text-cyan-300 font-black">
              {selectionCount}/{glyphCount || 0}
            </span>
          </div>
          {onResetSelection ? (
            <button
              type="button"
              onClick={onResetSelection}
              className="text-slate-400 hover:text-white transition-colors pointer-events-auto"
            >
              Reset
            </button>
          ) : null}
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
          scrollTargetRef={cardRef}
          resetSelectionKey={resetSelectionKey}
          hideDefaultButton={hideDefaultButton}
        />
      </div>
    </LessonFrame>
  );
}
