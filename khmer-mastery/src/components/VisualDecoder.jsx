// src/components/VisualDecoder.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { getSoundFileForChar } from "../data/audioMap";
import {
  getKhmerGlyphColor,
  getKhmerGlyphCategory,
  GLYPH_COLORS,
  isKhmerConsonantChar,
} from "../lib/khmerGlyphRenderer";
import { buildShapeApiUrl } from "../lib/apiConfig";
import useAudioPlayer from "../hooks/useAudioPlayer";
import {
  DEFAULT_FEEDBACK_SOUNDS,
  evaluateGlyphSuccess
} from "../lib/glyphFeedback";
import GlyphHintCard from "./UI/GlyphHintCard";
import {
  buildGlyphDisplayChar,
  getGlyphHintContent,
  resolveGlyphMeta,
  truncateHint,
} from "../lib/glyphHintUtils";

const COENG_CHAR = "្";

// Режимы подсветки
export const HIGHLIGHT_MODES = {
  ALL: "all", // все как обычно по палитре
  CONSONANTS: "consonants", // подсвечиваем согласные, остальное приглушаем
  OFF: "off", // все нейтрально (только обводка при выборе)
};

// Фолбэки
const FALLBACK = {
  MUTED: "rgba(255,255,255,0.18)",
  NEUTRAL: "rgba(255,255,255,0.92)",
  SELECTED: GLYPH_COLORS?.SELECTED ?? "#22d3ee",
};

// --- ХЕЛПЕРЫ ---
function isKhmerConsonant(ch) {
  if (!ch) return false;
  try {
    return typeof isKhmerConsonantChar === "function"
      ? isKhmerConsonantChar(ch)
      : ch.codePointAt(0) >= 0x1780 && ch.codePointAt(0) <= 0x17a2;
  } catch {
    return false;
  }
}


function bboxArea(bb) {
  const w = (bb?.x2 ?? 0) - (bb?.x1 ?? 0);
  const h = (bb?.y2 ?? 0) - (bb?.y1 ?? 0);
  return Math.max(0, w) * Math.max(0, h);
}

function makeViewBoxFromGlyphs(glyphs, pad = 60) {
  if (!glyphs || glyphs.length === 0) {
    return { minX: 0, minY: 0, w: 300, h: 300 };
  }

  const xs1 = glyphs.map((g) => g.bb?.x1 ?? 0);
  const xs2 = glyphs.map((g) => g.bb?.x2 ?? 0);
  const ys1 = glyphs.map((g) => g.bb?.y1 ?? 0);
  const ys2 = glyphs.map((g) => g.bb?.y2 ?? 0);

  const minX = Math.min(...xs1) - pad;
  const maxX = Math.max(...xs2) + pad;
  const minY = Math.min(...ys1) - pad;
  const maxY = Math.max(...ys2) + pad;

  return {
    minX,
    minY,
    w: Math.max(10, maxX - minX),
    h: Math.max(10, maxY - minY),
  };
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
    highlightSubscripts = false,
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
  const text = propText || data?.word || data?.khmerText || "កាហ្វេ";
  const targetChar =
    feedbackTargetChar ?? data?.target ?? data?.target_char ?? data?.targetChar ?? "";
  const heroHighlight = data?.hero_highlight ?? data?.heroHighlight ?? null;
  console.log("HERO HINT:", { heroHighlight, targetChar, text, data });
  const [glyphs, setGlyphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastTap, setLastTap] = useState(null);

  const [glyphSoundMap, setGlyphSoundMap] = useState({});
  const { playSequence } = useAudioPlayer();

  const svgRef = useRef(null);
  const hitRefs = useRef([]);
  const hintRef = useRef(null);

  useEffect(() => {
    hitRefs.current = [];
  }, [text]);

  useEffect(() => {
    if (interactionMode !== "persistent_select") return;
    setSelectedIds([]);
    setSelectedId(null);
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

  useEffect(() => {
    let active = true;
    if (!text) return;

    setLoading(true);
    setError(null);

    fetch(`${buildShapeApiUrl("/api/shape")}?text=${encodeURIComponent(text)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!active) return;
        const arr = Array.isArray(json) ? json : [];

        // DEBUG: Смотрим структуру данных от API
        console.log("=== API RESPONSE для текста:", text);
        console.log("Всего глифов:", arr.length);
        arr.forEach((g, i) => {
          console.log(`Глиф ${i}:`, {
            char: g.char,
            clusterIndex: g.clusterIndex,
            id: g.id
          });
        });

        setGlyphs(arr);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Decoder error:", err);
        if (!active) return;
        setError(err.message || "Error");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [text]);

  const resolvedGlyphMeta = useMemo(() => {
    const resolved = resolveGlyphMeta(glyphs, text);

    // DEBUG: Смотрим что получилось после resolve
    console.log("=== RESOLVED GLYPH META ===");
    console.log("Текст:", text);
    resolved.forEach((g, i) => {
      if (isKhmerConsonant(g.char)) {
        console.log(`Глиф ${i}:`, {
          char: g.char,
          resolvedChar: g.resolvedChar,
          resolvedIndex: g.resolvedIndex,
          isSubscript: g.isSubscript
        });
      }
    });

    return resolved;
  }, [glyphs, text]);

  useEffect(() => {
    if (!onGlyphsRendered) return;
    onGlyphsRendered(resolvedGlyphMeta);
  }, [onGlyphsRendered, resolvedGlyphMeta]);

  useEffect(() => {
    if (!glyphs.length || !data?.char_split) return;

    const audioMap = data.char_audio_map || {};
    const soundQueues = {};
    const isConsonantRx = (char) => /[\u1780-\u17A2]/.test(char);

    data.char_split.forEach((token) => {
      const cleanToken = token ? token.trim() : "";
      let groupSound = audioMap[token] || audioMap[cleanToken];

      if (!groupSound) groupSound = getSoundFileForChar(cleanToken);

      if (groupSound && groupSound.startsWith("sub_")) {
        groupSound = groupSound.replace("sub_", "letter_");
      }

      for (const char of cleanToken) {
        if (!soundQueues[char]) soundQueues[char] = [];

        const isModifierSound =
          groupSound &&
          (groupSound.includes("sign_") ||
            groupSound.includes("vowel_") ||
            groupSound.includes("diacritic"));

        if (isConsonantRx(char) && isModifierSound) {
          const nativeSound = getSoundFileForChar(char);
          soundQueues[char].push(nativeSound);
        } else {
          soundQueues[char].push(groupSound);
        }
      }
    });

    const newMap = {};
    const queuesCopy = JSON.parse(JSON.stringify(soundQueues));

    glyphs.forEach((glyph, idx) => {
      const char = glyph.char;
      if (queuesCopy[char] && queuesCopy[char].length > 0) {
        newMap[idx] = queuesCopy[char].shift();
      }
    });

    setGlyphSoundMap(newMap);
  }, [glyphs, data]);

  const vb = useMemo(
    () => makeViewBoxFromGlyphs(glyphs, viewBoxPad),
    [glyphs, viewBoxPad]
  );

  const hitOrder = useMemo(() => {
    if (!glyphs) return [];
    return glyphs
      .map((g, idx) => ({ g, idx, area: bboxArea(g.bb) }))
      .sort((a, b) => a.area - b.area);
  }, [glyphs]);

  const resolvedGlyphChars = useMemo(
    () => resolvedGlyphMeta.map((glyph) => glyph.resolvedChar || glyph.char || ""),
    [resolvedGlyphMeta]
  );

  const distanceToGlyphCenter = (item, p) => {
    const bb = item?.g?.bb;
    if (!bb) return Number.POSITIVE_INFINITY;
    const cx = ((bb.x1 ?? 0) + (bb.x2 ?? 0)) / 2;
    const cy = ((bb.y1 ?? 0) + (bb.y2 ?? 0)) / 2;
    const dx = p.x - cx;
    const dy = p.y - cy;
    return dx * dx + dy * dy;
  };

  const pickClosestHit = (items, p) => {
    if (!items.length) return null;
    return items.reduce((best, item) => {
      if (!best) return item;
      const bestDist = distanceToGlyphCenter(best, p);
      const itemDist = distanceToGlyphCenter(item, p);
      if (itemDist !== bestDist) {
        return itemDist < bestDist ? item : best;
      }
      const bestArea = bboxArea(best.g?.bb);
      const itemArea = bboxArea(item.g?.bb);
      return itemArea < bestArea ? item : best;
    }, null);
  };

  const fallbackTypeLabel = (glyphChar) => {
    const category = getKhmerGlyphCategory(glyphChar);
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
    return map[category] || "";
  };

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

  function pickGlyphAtPoint(p) {
    if (!p) return null;

    const hits = [];
    for (const item of hitOrder) {
      const pathEl = hitRefs.current[item.idx];
      if (!pathEl) continue;
      try {
        if (pathEl.isPointInFill?.(p) || pathEl.isPointInStroke?.(p)) {
          hits.push(item);
        }
      } catch {
        // ignore
      }
    }

    if (hits.length === 0) return null;

    const closestOverall = pickClosestHit(hits, p);
    if (closestOverall) {
      const resolved = resolvedGlyphChars[closestOverall.idx] || closestOverall.g.char;
      if (!isKhmerConsonant(resolved)) {
        return closestOverall;
      }
    }

    const consonantHits = hits.filter((item) => {
      const resolved = resolvedGlyphChars[item.idx] || item.g.char;
      return isKhmerConsonant(resolved);
    });
    if (consonantHits.length > 0) return pickClosestHit(consonantHits, p);

    const nonCoengHits = hits.filter((item) => item.g.char !== COENG_CHAR);
    if (nonCoengHits.length > 0) return pickClosestHit(nonCoengHits, p);

    return pickClosestHit(hits, p);
  }

  const handlePointerDown = (e) => {
    e.preventDefault();
    const p = svgPointFromEvent(e);
    const hit = pickGlyphAtPoint(p);
    if (!hit) return;

    const hitId = hit.g.id ?? hit.idx;
    const resolvedChar = resolvedGlyphChars[hit.idx] || hit.g.char;

    if (onGlyphClick) {
      const glyphMeta = resolvedGlyphMeta?.[hit.idx] || {};
      onGlyphClick(resolvedChar, {
        ...glyphMeta,
        resolvedChar,
        isSubscript: glyphMeta?.isSubscript ?? false,
      });
    }

    if (showTapHint) {
      const glyphMeta = resolvedGlyphMeta?.[hit.idx] || {};
      const isSubscript = glyphMeta?.isSubscript ?? false;
      const isSubscriptConsonant = isSubscript && isKhmerConsonant(resolvedChar);
      const { typeLabel, hint } = getGlyphHintContent({
        glyphChar: resolvedChar,
        alphabetDb,
        fallbackTypeLabel,
      });
      const hintMaxChars = data?.hint_max_chars ?? data?.hintMaxChars;
      const truncatedHint = truncateHint(hint, hintMaxChars);

      setLastTap({
        char: resolvedChar,
        displayChar: buildGlyphDisplayChar({
          glyphChar: resolvedChar,
          isSubscript,
          isSubscriptConsonant,
        }),
        typeLabel,
        hint: truncatedHint,
        isSubscript,
      });
    }

    if (selectionMode === "multi") {
      setSelectedIds((prev) => (prev.includes(hitId) ? prev : [...prev, hitId]));
    } else {
      setSelectedId(hitId);
    }

    let soundFile = glyphSoundMap[hit.idx];

    if (!soundFile) {
      soundFile = getSoundFileForChar(resolvedChar);
    }

    const effectiveRule = feedbackRule ?? data?.success_rule ?? data?.successRule;
    if (effectiveRule) {
      const isSuccess = evaluateGlyphSuccess({
        rule: effectiveRule,
        glyphChar: resolvedChar,
        glyphMeta: resolvedGlyphMeta?.[hit.idx],
        targetChar: feedbackTargetChar ?? data?.target ?? data?.target_char
      });
      const sounds = {
        ...DEFAULT_FEEDBACK_SOUNDS,
        ...(feedbackSounds || {})
      };
      const feedbackSound = isSuccess ? sounds.success : sounds.error;
      const sequence = soundFile ? [feedbackSound, soundFile] : [feedbackSound];
      playSequence(sequence, { gapMs: feedbackGapMs });
    } else if (onLetterClick) {
      onLetterClick(soundFile);
    }
    if (onComplete) onComplete();
  };

  useEffect(() => {
    if (!onSelectionChange) return;
    if (selectionMode === "multi") {
      onSelectionChange(selectedIds);
    } else if (selectedId !== null) {
      onSelectionChange([selectedId]);
    } else {
      onSelectionChange([]);
    }
  }, [onSelectionChange, selectedId, selectedIds, selectionMode]);

  useEffect(() => {
    if (resetSelectionKey === undefined) return;
    setSelectedId(null);
    setSelectedIds([]);
  }, [resetSelectionKey]);

  const subscriptConsonantIndices = useMemo(() => {
    const indices = new Set();
    if (!resolvedGlyphMeta || resolvedGlyphMeta.length === 0) return indices;
    resolvedGlyphMeta.forEach((glyph, idx) => {
      if (glyph.isSubscript && isKhmerConsonant(glyph.resolvedChar || glyph.char)) {
        indices.add(idx);
      }
    });
    return indices;
  }, [resolvedGlyphMeta]);

  function colorForGlyph(glyph, idx, isSelected) {
    const resolved = resolvedGlyphChars[idx] || glyph.char || "";
    const base = getKhmerGlyphColor(glyph.char);
    const glyphId = glyph.id ?? idx;
    const resolvedIsSelected =
      isSelected ??
      (selectionMode === "multi"
        ? selectedIds.includes(glyphId)
        : selectedId === glyphId);

    if (typeof getGlyphFillColor === "function") {
      const override = getGlyphFillColor({
        glyph,
        idx,
        isSelected: resolvedIsSelected,
        resolvedChar: resolved,
      });
      if (override) return override;
    }

    if (revealOnSelect && !resolvedIsSelected) {
      return FALLBACK.MUTED;
    }

    if (highlightMode === HIGHLIGHT_MODES.ALL) return base;
    if (highlightMode === HIGHLIGHT_MODES.CONSONANTS) {
      return isKhmerConsonant(resolved) ? FALLBACK.NEUTRAL : FALLBACK.MUTED;
    }
    return FALLBACK.NEUTRAL;
  }

  if (loading) {
    return <div className="text-white animate-pulse text-center p-10">Deciphering...</div>;
  }

  if (error || !glyphs || glyphs.length === 0) {
    return <div className="text-red-400 text-center p-10">Error loading glyphs</div>;
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
        {glyphs.map((glyph, i) => {
          const glyphId = glyph.id ?? i;
          const isSelected =
            selectionMode === "multi"
              ? selectedIds.includes(glyphId)
              : selectedId === glyphId;
          const fillColor = colorForGlyph(glyph, i, isSelected);
          const isConsonant = isKhmerConsonant(resolvedGlyphChars[i] || glyph.char);
          const resolvedChar = resolvedGlyphChars[i] || glyph.char;
          const isTarget = !!targetChar && resolvedChar === targetChar;
          const forceHeroOutline = heroHighlight === "green_outline" && isTarget;

          const isSubscript = subscriptConsonantIndices.has(i);
          const hitStrokeWidth = isSubscript ? 120 : 60;

          let outlineColor = isSelected ? FALLBACK.SELECTED : "transparent";
          let outlineWidth = isSelected ? 5 : 0;

          if (highlightSubscripts && isSubscript && !isSelected) {
            outlineColor = "#facc15";
            outlineWidth = 2;
          }

          if (interactionMode === "persistent_select") {
            if (isSelected) {
              outlineWidth = 4;
              if (isConsonant) {
                outlineColor = isSubscript ? "#facc15" : "#22c55e";
              } else {
                outlineColor = "#ef4444";
              }
            }
          } else if (interactionMode === "find_consonant" && selectedId !== null) {
            outlineWidth = 4;
            if (isSelected) {
              outlineColor = "#22c55e";
            } else if (isSubscript) {
              outlineColor = "#facc15";
            } else {
              outlineColor = "#ef4444";
            }
          }

          if (interactionMode === "decoder_select") {
            outlineWidth = isSelected ? 4 : 0;
            if (isSelected) {
              if (isSubscript) {
                outlineColor = "#facc15";
              } else if (isConsonant) {
                outlineColor = "#22c55e";
              } else {
                outlineColor = "#94a3b8";
              }
            }
          }
          const hintOutlineOn = forceHeroOutline && !isSelected;

          if (!showSelectionOutline) {
                      outlineColor = "transparent";
                      outlineWidth = 0;
                    }
          if (forceHeroOutline && !isSelected) {
            outlineColor = "#22c55e";
            outlineWidth = 4;
          }


          return (
            <g key={glyphId}>
              <path
                ref={(el) => (hitRefs.current[i] = el)}
                d={glyph.d}
                fill="transparent"
                stroke="transparent"
                strokeWidth={hitStrokeWidth}
                pointerEvents="none"
              />
              <path
                d={glyph.d}
                fill={fillColor}
                pointerEvents="none"
                className="transition-[fill,stroke,stroke-width] duration-200"
                style={{
                  stroke: outlineColor,
                  strokeWidth: outlineWidth,
                  vectorEffect: "non-scaling-stroke",
                  paintOrder: "stroke fill",
                  filter: forceHeroOutline
                    ? "drop-shadow(0 4px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 10px rgba(34,197,94,0.85))"
                    : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",

                  cursor: "pointer",
                }}
              />
            </g>
          );
        })}
      </svg>
      {showTapHint ? (
        <div ref={hintRef} className="mt-3 w-full flex justify-center">
          <GlyphHintCard
            displayChar={lastTap?.displayChar}
            typeLabel={lastTap?.typeLabel}
            hint={lastTap?.hint}
            isSubscript={lastTap?.isSubscript}
            placeholder="Tap a glyph"
          />
        </div>
      ) : null}
      {!hideDefaultButton && onComplete ? (
        <button
          type="button"
          onClick={onComplete}
          className="mt-4 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-xs uppercase tracking-widest text-white hover:bg-white/20 transition-all"
        >
          Continue
        </button>
      ) : null}
    </div>
  );
}
