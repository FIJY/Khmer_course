import React, { useRef } from 'react';
import VisualDecoder from '../VisualDecoder';
import LessonFrame from '../UI/LessonFrame';

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
      <div ref={cardRef} className="relative">
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
