// src/components/VisualDecoder.jsx
import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { getSoundFileForChar } from "../data/audioMap";
import {
  getKhmerGlyphColor,
  getKhmerGlyphCategory,
  GLYPH_COLORS,
  isKhmerConsonantChar,
} from "../lib/khmerGlyphRenderer";
import useAudioPlayer from "../hooks/useAudioPlayer";
import {
  DEFAULT_FEEDBACK_SOUNDS,
  evaluateGlyphSuccess
} from "../lib/glyphFeedback";
import GlyphHintCard from "./UI/GlyphHintCard";
import {
  buildGlyphDisplayChar,
  getGlyphHintContent,
  truncateHint,
} from "../lib/glyphHintUtils";
import { useKhmerShaper } from "../hooks/useKhmerShaper";
import { buildUnits } from "../lib/khmerUnitParser";

export const HIGHLIGHT_MODES = {
  ALL: "all",
  CONSONANTS: "consonants",
  OFF: "off",
};

const FALLBACK = {
  MUTED: "rgba(255,255,255,0.18)",
  NEUTRAL: "rgba(255,255,255,0.92)",
  SELECTED: GLYPH_COLORS?.SELECTED ?? "#22d3ee",
};

function unionBBox(glyphs) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const g of glyphs || []) {
    if (!g.bb) continue;
    minX = Math.min(minX, g.bb.x1);
    minY = Math.min(minY, g.bb.y1);
    maxX = Math.max(maxX, g.bb.x2);
    maxY = Math.max(maxY, g.bb.y2);
  }
  if (!Number.isFinite(minX)) return null;
  return { x1: minX, y1: minY, x2: maxX, y2: maxY };
}

export default function VisualDecoder(props) {
  const {
    data,
    text: propText,
    onLetterClick,
    onComplete,
    hideDefaultButton = true,
    highlightMode = HIGHLIGHT_MODES.OFF,
    revealOnSelect = false,
    interactionMode = "persistent_select",
    selectionMode = "multi",
    onSelectionChange,
    resetSelectionKey,
    compact = false,
    viewBoxPad = 70,
    onGlyphClick,
    onGlyphsRendered,
    alphabetDb,
    scrollTargetRef,
    showTapHint = true,
    getGlyphFillColor,
    showSelectionOutline = true,
    feedbackRule,
    feedbackTargetChar,
    feedbackSounds,
    feedbackGapMs = 200,
  } = props;

  const rawText = propText || data?.word || data?.khmerText || "កាហ្វេ";
  const text = useMemo(() => rawText.normalize("NFC"), [rawText]);
  const targetChar = useMemo(
    () => (feedbackTargetChar ?? data?.target ?? data?.target_char ?? data?.targetChar ?? "").normalize("NFC"),
    [feedbackTargetChar, data?.target, data?.target_char, data?.targetChar]
  );
  const heroHighlight = data?.hero_highlight ?? data?.heroHighlight ?? null;

  const [normalGlyphs, setNormalGlyphs] = useState([]);
  const [splitGlyphs, setSplitGlyphs] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const [selectedUnitIds, setSelectedUnitIds] = useState([]);
  const [lastTap, setLastTap] = useState(null);
  const { playSequence } = useAudioPlayer();

  const svgRef = useRef(null);
  const hintRef = useRef(null);

  const { ready: shaperReady, error: shaperError, shape } = useKhmerShaper('/fonts/KhmerOS_siemreap.ttf');

  useEffect(() => {
    if (!shaperReady || !text) {
      setNormalGlyphs([]);
      setSplitGlyphs([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const normal = await shape(text);
        const split = await shape(text, { mode: 'split' });
        if (!cancelled) {
          setNormalGlyphs(normal);
          setSplitGlyphs(split);
        }
      } catch (err) {
        console.error('Shaping error:', err);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [shaperReady, text, shape]);

  const units = useMemo(() => {
    const manual = data?.units || [];
    return buildUnits(text, manual);
  }, [text, data?.units]);

  const unitsWithGlyphs = useMemo(() => {
    return units.map(unit => {
      const unitCodePoints = Array.from(unit.text).map(ch => ch.codePointAt(0));
      const glyphs = normalGlyphs.filter(g => g.codePoints?.some(cp => unitCodePoints.includes(cp)));
      return { ...unit, glyphs };
    });
  }, [units, normalGlyphs]);

  const splitGlyphToUnit = useMemo(() => {
    const map = new Map();
    splitGlyphs.forEach(glyph => {
      const matchingUnit = units.find(unit => {
        const unitCodePoints = Array.from(unit.text).map(ch => ch.codePointAt(0));
        return glyph.codePoints?.some(cp => unitCodePoints.includes(cp));
      });
      if (matchingUnit) map.set(glyph, matchingUnit);
    });
    return map;
  }, [units, splitGlyphs]);

  useEffect(() => {
    if (!onGlyphsRendered) return;
    const flatMeta = normalGlyphs.map((g, idx) => ({
      ...g,
      blockIndex: idx,
      glyphIndexInBlock: 0,
      resolvedChar: g.chars?.[0] || g.char,
      isSubscript: false,
    }));
    onGlyphsRendered(flatMeta);
  }, [onGlyphsRendered, normalGlyphs]);

  useEffect(() => {
    if (interactionMode !== "persistent_select") return;
    setSelectedUnitIds([]);
    setSelectedUnitId(null);
  }, [interactionMode, resetSelectionKey, text]);

  useEffect(() => {
    setLastTap(null);
  }, [text]);

  useEffect(() => {
    if (!lastTap) return;
    const target = scrollTargetRef?.current || hintRef.current;
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "end" });
    const parent = target.closest?.("[data-scroll-container='true']");
    if (parent) {
      requestAnimationFrame(() => {
        parent.scrollTop = parent.scrollHeight;
        parent.scrollTo({ top: parent.scrollHeight, behavior: "smooth" });
      });
    }
  }, [lastTap, scrollTargetRef]);

  function svgPointFromEvent(evt) {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  }

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    const p = svgPointFromEvent(e);
    if (!p) return;

    // Поиск по split-глифам
    let hitUnit = null;
    for (const glyph of splitGlyphs) {
      const pathEl = document.getElementById(`split-${glyph.id}`);
      if (pathEl && pathEl.isPointInFill(p)) {
        hitUnit = splitGlyphToUnit.get(glyph);
        if (hitUnit) break;
      }
    }

    if (!hitUnit) return;

    const selectedChar = hitUnit.text[0] || '?';

    if (onGlyphClick) {
      onGlyphClick(selectedChar, {
        unitId: hitUnit.id,
        glyphs: hitUnit.glyphs,
        primaryChar: selectedChar,
        allChars: Array.from(hitUnit.text),
        isSubscript: hitUnit.kind === 'subscript',
      });
    }

    if (showTapHint) {
      const isSubscriptConsonant = hitUnit.kind === 'subscript';
      const { typeLabel, hint } = getGlyphHintContent({
        glyphChar: selectedChar,
        alphabetDb,
        fallbackTypeLabel: (ch) => {
          const cat = getKhmerGlyphCategory(ch);
          const map = {
            consonant: "consonant",
            vowel_dep: "vowel_dependent",
            vowel_ind: "vowel_independent",
            diacritic: "diacritic",
            numeral: "numeral",
            coeng: "coeng",
            space: "space",
            other: "other",
          };
          return map[cat] || "";
        },
      });
      const hintMaxChars = data?.hint_max_chars ?? data?.hintMaxChars;
      const truncatedHint = truncateHint(hint, hintMaxChars);

      setLastTap({
        char: selectedChar,
        displayChar: buildGlyphDisplayChar({
          glyphChar: selectedChar,
          isSubscript: hitUnit.kind === 'subscript',
          isSubscriptConsonant,
        }),
        typeLabel,
        hint: truncatedHint,
        isSubscript: hitUnit.kind === 'subscript',
      });
    }

    if (selectionMode === "multi") {
      setSelectedUnitIds((prev) => (prev.includes(hitUnit.id) ? prev : [...prev, hitUnit.id]));
    } else {
      setSelectedUnitId(hitUnit.id);
    }

    let soundFile = getSoundFileForChar(selectedChar);
    const effectiveRule = feedbackRule ?? data?.success_rule ?? data?.successRule;
    if (effectiveRule) {
      const isSuccess = evaluateGlyphSuccess({
        rule: effectiveRule,
        glyphChar: selectedChar,
        glyphMeta: { isSubscript: hitUnit.kind === 'subscript' },
        targetChar,
      });
      const sounds = {
        ...DEFAULT_FEEDBACK_SOUNDS,
        ...(feedbackSounds || {}),
      };
      const feedbackSound = isSuccess ? sounds.success : sounds.error;
      const sequence = soundFile ? [feedbackSound, soundFile] : [feedbackSound];
      playSequence(sequence, { gapMs: feedbackGapMs });
    } else if (onLetterClick) {
      onLetterClick(soundFile);
    }

    if (onComplete) onComplete();
  }, [splitGlyphs, splitGlyphToUnit, onGlyphClick, showTapHint, alphabetDb, targetChar, feedbackRule, feedbackSounds, feedbackGapMs, onLetterClick, onComplete, playSequence, selectionMode, data]);

  useEffect(() => {
    if (!onSelectionChange) return;
    if (selectionMode === "multi") {
      onSelectionChange(selectedUnitIds);
    } else if (selectedUnitId !== null) {
      onSelectionChange([selectedUnitId]);
    } else {
      onSelectionChange([]);
    }
  }, [onSelectionChange, selectedUnitId, selectedUnitIds, selectionMode]);

  useEffect(() => {
    if (resetSelectionKey === undefined) return;
    setSelectedUnitId(null);
    setSelectedUnitIds([]);
  }, [resetSelectionKey]);

  function colorForUnit(unit) {
    const isSelected = selectionMode === "multi" ? selectedUnitIds.includes(unit.id) : selectedUnitId === unit.id;
    const base = getKhmerGlyphColor(unit.text[0] || '');
    if (revealOnSelect && !isSelected) return FALLBACK.MUTED;
    if (highlightMode === HIGHLIGHT_MODES.ALL) return base;
    if (highlightMode === HIGHLIGHT_MODES.CONSONANTS) {
      const isCons = isKhmerConsonantChar(unit.text[0] || '');
      return isCons ? FALLBACK.NEUTRAL : FALLBACK.MUTED;
    }
    return FALLBACK.NEUTRAL;
  }

  const vb = useMemo(() => {
    const allGlyphs = unitsWithGlyphs.flatMap(u => u.glyphs);
    const bb = unionBBox(allGlyphs);
    if (!bb) return { minX: 0, minY: 0, w: 300, h: 300 };
    return {
      minX: bb.x1 - viewBoxPad,
      minY: bb.y1 - viewBoxPad,
      w: (bb.x2 - bb.x1) + viewBoxPad * 2,
      h: (bb.y2 - bb.y1) + viewBoxPad * 2,
    };
  }, [unitsWithGlyphs, viewBoxPad]);

  if (shaperError) {
    return <div className="text-red-400 text-center p-10">HarfBuzz error: {shaperError}</div>;
  }
  if (!shaperReady) {
    return <div className="text-white animate-pulse text-center p-10">Loading shaping engine...</div>;
  }
  if (!normalGlyphs.length) {
    return <div className="text-red-400 text-center p-10">No glyphs to render</div>;
  }

  return (
    <div className={`w-full flex flex-col items-center ${compact ? "py-3" : "py-8"}`}>
      <svg
        ref={svgRef}
        viewBox={`${vb.minX} ${vb.minY} ${vb.w} ${vb.h}`}
        className={`${compact ? "max-h-[190px]" : "max-h-[250px]"} w-full overflow-visible select-none`}
        style={{
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          userSelect: "none",
        }}
        onPointerDown={handlePointerDown}
      >
        {/* Фон normal-глифы (полупрозрачные) */}
        {normalGlyphs.map((g) => (
          <path
            key={`bg-${g.id}`}
            d={g.d}
            fill="rgba(148,163,184,0.08)"
            stroke="none"
            pointerEvents="none"
          />
        ))}

        {/* Невидимые split-глифы для хит-теста */}
        {splitGlyphs.map((g) => (
          <path
            key={`split-${g.id}`}
            id={`split-${g.id}`}
            d={g.d}
            fill="transparent"
            stroke="none"
            pointerEvents="all"
            style={{ cursor: "pointer" }}
          />
        ))}

        {/* Заливка выбранных юнитов (normal-глифы) */}
        {unitsWithGlyphs.map((unit) => {
          const isSelected = selectionMode === "multi" ? selectedUnitIds.includes(unit.id) : selectedUnitId === unit.id;
          if (!isSelected) return null;
          const fillColor = colorForUnit(unit);
          return unit.glyphs.map((g) => (
            <path
              key={`fill-${unit.id}-${g.id}`}
              d={g.d}
              fill={fillColor}
              fillOpacity="0.7"
              stroke="none"
              pointerEvents="none"
            />
          ));
        })}

        {/* Контуры normal-глифов */}
        {normalGlyphs.map((g) => (
          <path
            key={`outline-${g.id}`}
            d={g.d}
            fill="transparent"
            stroke="rgba(148,163,184,0.3)"
            strokeWidth="1.5"
            pointerEvents="none"
          />
        ))}
      </svg>

      {showTapHint && (
        <div ref={hintRef} className="mt-3 w-full flex justify-center">
          <GlyphHintCard
            displayChar={lastTap?.displayChar}
            typeLabel={lastTap?.typeLabel}
            hint={lastTap?.hint}
            isSubscript={lastTap?.isSubscript}
            placeholder="Tap a glyph"
          />
        </div>
      )}

      {!hideDefaultButton && onComplete && (
        <button
          type="button"
          onClick={onComplete}
          className="mt-4 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-xs uppercase tracking-widest text-white hover:bg-white/20 transition-all"
        >
          Continue
        </button>
      )}
    </div>
  );
}