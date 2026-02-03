import React from "react";
import VisualDecoder, { HIGHLIGHT_MODES } from "./VisualDecoder";

export const DEFAULT_LESSON_GLYPH_DECODER_PROPS = {
  highlightMode: HIGHLIGHT_MODES.OFF,
  interactionMode: "persistent_select",
  selectionMode: "multi",
  highlightSubscripts: true,
};

export default function LessonGlyphDecoder({
  highlightMode = DEFAULT_LESSON_GLYPH_DECODER_PROPS.highlightMode,
  interactionMode = DEFAULT_LESSON_GLYPH_DECODER_PROPS.interactionMode,
  selectionMode = DEFAULT_LESSON_GLYPH_DECODER_PROPS.selectionMode,
  highlightSubscripts = DEFAULT_LESSON_GLYPH_DECODER_PROPS.highlightSubscripts,
  ...rest
}) {
  return (
    <VisualDecoder
      highlightMode={highlightMode}
      interactionMode={interactionMode}
      selectionMode={selectionMode}
      highlightSubscripts={highlightSubscripts}
      {...rest}
    />
  );
}
