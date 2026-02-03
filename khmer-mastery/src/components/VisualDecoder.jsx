// src/components/VisualDecoder.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { getSoundFileForChar } from "../data/audioMap";
import {
  getKhmerGlyphColor,
  GLYPH_COLORS,
  isKhmerConsonantChar,
  getKhmerGlyphStyle,
} from "../lib/khmerGlyphRenderer";
import { buildShapeApiUrl } from "../lib/apiConfig";

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

function findNextConsonantAfterCoeng(textChars, startIndex) {
  let coengIndex = -1;
  for (let i = startIndex; i < textChars.length; i++) {
    if (textChars[i] === COENG_CHAR) {
      coengIndex = i;
      break;
    }
  }

  const searchStart = coengIndex >= 0 ? coengIndex + 1 : startIndex;
  for (let i = searchStart; i < textChars.length; i++) {
    if (isKhmerConsonant(textChars[i])) {
      return { char: textChars[i], index: i };
    }
  }

  return { char: "", index: -1 };
}

function resolveGlyphMeta(glyphs, text) {
  const textChars = Array.from(text || "");
  const clusterIndices = (glyphs || [])
    .map((glyph) => glyph.clusterIndex)
    .filter((value) => Number.isFinite(value));
  const uniqueClusters = Array.from(new Set(clusterIndices)).sort((a, b) => a - b);
  const clusterSegments = new Map();

  if (uniqueClusters.length > 0 && text) {
    uniqueClusters.forEach((start, idx) => {
      const end = uniqueClusters[idx + 1] ?? text.length;
      const segmentText = text.slice(start, end);
      const chars = Array.from(segmentText);
      const charIndexMap = new Map();
      chars.forEach((ch, index) => {
        if (!charIndexMap.has(ch)) charIndexMap.set(ch, []);
        charIndexMap.get(ch).push(index);
      });
      clusterSegments.set(start, {
        start,
        end,
        text: segmentText,
        chars,
        charIndexMap,
        charIndexCursor: new Map(),
      });
    });
  }

  const findSubscriptConsonantIndices = (chars) => {
    const subscripts = new Set();
    for (let i = 0; i < chars.length - 1; i += 1) {
      if (chars[i] === COENG_CHAR && isKhmerConsonant(chars[i + 1])) {
        subscripts.add(i + 1);
      }
    }
    return subscripts;
  };

  return (glyphs || []).map((glyph) => {
    let resolvedChar = glyph.char || "";
    let resolvedIndex = -1;
    let isSubscript = false;

    const segment = clusterSegments.get(glyph.clusterIndex);

    if (segment) {
      const { chars, start, charIndexMap, charIndexCursor } = segment;
      const subscriptIndices = findSubscriptConsonantIndices(chars);

      if (resolvedChar === COENG_CHAR) {
        const { char, index } = findNextConsonantAfterCoeng(chars, 0);
        if (char) {
          resolvedChar = char;
          resolvedIndex = index + start;
          isSubscript = true;
        }
      } else if (resolvedChar) {
        let localIndex = -1;
        const indexList = charIndexMap?.get(resolvedChar);
        if (indexList && indexList.length) {
          const cursor = charIndexCursor.get(resolvedChar) ?? 0;
          if (cursor < indexList.length) {
            localIndex = indexList[cursor];
            charIndexCursor.set(resolvedChar, cursor + 1);
          }
        } else {
          localIndex = chars.indexOf(resolvedChar);
        }
        if (localIndex !== -1) {
          resolvedIndex = localIndex + start;
        }
        if (isKhmerConsonant(resolvedChar) && subscriptIndices.has(localIndex)) {
          isSubscript = true;
        }
      }
    } else {
      if (resolvedChar === COENG_CHAR) {
        const { char, index } = findNextConsonantAfterCoeng(textChars, 0);
        if (char) {
          resolvedChar = char;
          resolvedIndex = index;
        }
      } else if (resolvedChar) {
        const nextIndex = textChars.indexOf(resolvedChar);
        if (nextIndex !== -1) {
          resolvedIndex = nextIndex;
        }
      }

      isSubscript =
        resolvedIndex > 0 && textChars[resolvedIndex - 1] === COENG_CHAR;
    }

    return {
      ...glyph,
      resolvedChar: resolvedChar || glyph.char || "",
      resolvedIndex,
      isSubscript,
    };
  });
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
    highlightSubscripts = true,
    interactionMode = "persistent_select",
    selectionMode = "multi",
    onSelectionChange,
    resetSelectionKey,
    compact = false,
    viewBoxPad = 70,
    onGlyphClick,
    onGlyphsRendered,
    alphabetDb,
    showSelectionStats = false,
  } = props;
  const text = propText || data?.word || data?.khmerText || "កាហ្វេ";

  const [glyphs, setGlyphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [glyphSoundMap, setGlyphSoundMap] = useState({});

  const svgRef = useRef(null);
  const hitRefs = useRef([]);

  useEffect(() => {
    hitRefs.current = [];
  }, [text]);

  useEffect(() => {
    if (interactionMode !== "persistent_select") return;
    setSelectedIds(new Set());
    setSelectedId(null);
  }, [interactionMode, resetSelectionKey, text]);

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
  }, [text, onGlyphsRendered]);

  const resolvedGlyphMeta = useMemo(
    () => resolveGlyphMeta(glyphs, text),
    [glyphs, text]
  );

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

    const consonantHits = hits.filter((item) => {
      const resolved = resolvedGlyphChars[item.idx] || item.g.char;
      return isKhmerConsonant(resolved);
    });
    if (consonantHits.length > 0) return consonantHits[0];

    const nonCoengHits = hits.filter((item) => item.g.char !== COENG_CHAR);
    if (nonCoengHits.length > 0) return nonCoengHits[0];

    return hits[0];
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

    if (selectionMode === "multi") {
      const additive = e.shiftKey || e.ctrlKey || e.metaKey;
      setSelectedIds((prev) => {
        const next = additive ? new Set(prev) : new Set();
        if (next.has(hitId)) {
          next.delete(hitId);
        } else {
          next.add(hitId);
        }
        return next;
      });
    } else {
      setSelectedId(hitId);
    }

    let soundFile = glyphSoundMap[hit.idx];

    if (!soundFile) {
      soundFile = getSoundFileForChar(resolvedChar);
    }

    if (onLetterClick) onLetterClick(soundFile);
    if (onComplete) onComplete();
  };

  useEffect(() => {
    if (!onSelectionChange) return;
    if (selectionMode === "multi") {
      onSelectionChange(Array.from(selectedIds));
    } else if (selectedId !== null) {
      onSelectionChange([selectedId]);
    } else {
      onSelectionChange([]);
    }
  }, [onSelectionChange, selectedId, selectedIds, selectionMode]);

  useEffect(() => {
    if (resetSelectionKey === undefined) return;
    setSelectedId(null);
    setSelectedIds(new Set());
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

  function colorForGlyph(glyph, idx) {
    const resolved = resolvedGlyphChars[idx] || glyph.char || "";
    const base = getKhmerGlyphColor(glyph.char);
    const glyphId = glyph.id ?? idx;
    const isSelected =
      selectionMode === "multi"
        ? selectedIds.has(glyphId)
        : selectedId === glyphId;

    if (revealOnSelect && !isSelected) {
      return FALLBACK.MUTED;
    }

    if (highlightMode === HIGHLIGHT_MODES.ALL) return base;
    if (highlightMode === HIGHLIGHT_MODES.CONSONANTS) {
      return isKhmerConsonant(resolved) ? FALLBACK.NEUTRAL : FALLBACK.MUTED;
    }
    return FALLBACK.NEUTRAL;
  }

  const selectionStats = useMemo(() => {
    if (!showSelectionStats) return null;
    const totalByChar = new Map();
    glyphs.forEach((glyph) => {
      const ch = glyph.char || "<?>";
      const style = getKhmerGlyphStyle(ch);
      const prev = totalByChar.get(ch);
      if (!prev) {
        totalByChar.set(ch, {
          char: ch,
          total: 1,
          fill: style.fill,
          opacity: style.opacity,
        });
      } else {
        prev.total += 1;
        if (prev.fill !== style.fill) {
          prev.fill = `${prev.fill} | ${style.fill}`;
        }
      }
    });

    const selectedByChar = new Map();
    glyphs.forEach((glyph, idx) => {
      const glyphId = glyph.id ?? idx;
      if (!selectedIds.has(glyphId)) return;
      const ch = glyph.char || "<?>";
      selectedByChar.set(ch, (selectedByChar.get(ch) ?? 0) + 1);
    });

    const rows = Array.from(totalByChar.values()).map((row) => ({
      char: row.char,
      color: row.fill,
      total: row.total,
      selected: selectedByChar.get(row.char) || 0,
    }));

    rows.sort((a, b) => (b.selected - a.selected) || (b.total - a.total));

    const selectedGlyphCount = Array.from(selectedIds).length;
    const selectedUniqueChars = rows.filter((row) => row.selected > 0).length;

    return { rows, selectedGlyphCount, selectedUniqueChars };
  }, [glyphs, selectedIds, showSelectionStats]);

  if (loading) {
    return <div className="text-white animate-pulse text-center p-10">Deciphering...</div>;
  }

  if (error || !glyphs || glyphs.length === 0) {
    return <div className="text-red-400 text-center p-10">Error loading glyphs</div>;
  }

  return (
    <div className={`w-full flex flex-col items-center ${compact ? "py-3" : "py-8"}`}>
      <div className={`w-full ${showSelectionStats ? "flex flex-col gap-4" : ""}`}>
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
                ? selectedIds.has(glyphId)
                : selectedId === glyphId;
            const fillColor = colorForGlyph(glyph, i);
            const isConsonant = isKhmerConsonant(resolvedGlyphChars[i] || glyph.char);
            const isSubscript = subscriptConsonantIndices.has(i);

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

            return (
              <g key={glyphId}>
                <path
                  ref={(el) => (hitRefs.current[i] = el)}
                  d={glyph.d}
                  fill="transparent"
                  stroke="transparent"
                  strokeWidth="50"
                  pointerEvents="none"
                />
                <path
                  d={glyph.d}
                  fill={fillColor}
                  pointerEvents="none"
                  className="transition-all duration-200"
                  style={{
                    stroke: outlineColor,
                    strokeWidth: outlineWidth,
                    vectorEffect: "non-scaling-stroke",
                    paintOrder: "stroke fill",
                    filter: isSelected
                      ? `drop-shadow(0 0 10px ${outlineColor})`
                      : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
                    cursor: "pointer",
                  }}
                />
              </g>
            );
          })}
        </svg>
        {showSelectionStats && selectionStats ? (
          <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
            <div className="text-xs uppercase tracking-[0.2em] text-white/70">
              Selected glyphs: {selectionStats.selectedGlyphCount} · Unique: {selectionStats.selectedUniqueChars}
            </div>
            <div className="mt-3 max-h-48 overflow-auto rounded-xl border border-white/10 p-3 text-sm">
              {selectionStats.rows.length === 0 ? (
                <div className="text-white/60">
                  Click glyphs to select. Hold Shift/Ctrl/Cmd to multi-select.
                </div>
              ) : (
                selectionStats.rows.map((row) => (
                  <div
                    key={row.char}
                    className="flex items-center justify-between gap-3 border-b border-white/10 py-2 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-3 w-3 rounded"
                        style={{ background: row.color, opacity: row.opacity }}
                      />
                      <span className="text-lg">{row.char}</span>
                    </div>
                    <div className={`text-white/80 ${row.selected > 0 ? "font-semibold" : ""}`}>
                      {row.selected} / {row.total}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
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
