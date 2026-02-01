// src/components/VisualDecoder.jsx
import React, { useMemo, useRef, useState, useEffect } from "react";
import { getSoundFileForChar } from "../data/audioMap";
import {
  getKhmerGlyphColor,
  GLYPH_COLORS,
  isKhmerConsonantChar,
} from "../lib/khmerGlyphRenderer";
import { buildShapeApiUrl } from "../lib/apiConfig";

const COENG_CHAR = "្";

// Режимы подсветки (временно, пока не задашь жестко по урокам)
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
  // можно использовать из lib, но оставим фолбэк
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

export default function VisualDecoder({
  data,
  text: propText,
  onLetterClick,
  onComplete,
  hideDefaultButton = true,
  highlightMode = HIGHLIGHT_MODES.ALL,
  interactionMode = "default",
}) {
  const text = propText || data?.word || data?.khmerText || "កាហ្វេ";

  const [glyphs, setGlyphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Карта звуков для точного воспроизведения из БД
  const [glyphSoundMap, setGlyphSoundMap] = useState({});

  const svgRef = useRef(null);
  const hitRefs = useRef([]);

  useEffect(() => {
    hitRefs.current = [];
  }, [text]);

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
        // для твоего дебага в консоли
        window.__lastGlyphs = arr;
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

  // ГЕНЕРАЦИЯ КАРТЫ ЗВУКОВ (Sound Queue)
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

  const vb = useMemo(() => makeViewBoxFromGlyphs(glyphs, 70), [glyphs]);

  const hitOrder = useMemo(() => {
    if (!glyphs) return [];
    return glyphs
      .map((g, idx) => ({ g, idx, area: bboxArea(g.bb) }))
      .sort((a, b) => a.area - b.area);
  }, [glyphs]);

  // Восстановление символов (важно для coeng/сабскриптов)
  const resolvedGlyphChars = useMemo(() => {
    const textChars = Array.from(text || "");
    let textIndex = 0;

    return (glyphs || []).map((glyph) => {
      let resolvedChar = glyph.char || "";

      // если видим coeng, для клика мы хотим взять СЛЕДУЮЩУЮ согласную как “звук”,
      // а цвет — оставлять по glyph.char (coeng) или по реальному символу, в зависимости от режима
      if (resolvedChar === COENG_CHAR) {
        const { char, index } = findNextConsonantAfterCoeng(textChars, textIndex);
        if (char) {
          resolvedChar = char;
          textIndex = index + 1;
        }
      } else if (resolvedChar) {
        const nextIndex = textChars.indexOf(resolvedChar, textIndex);
        if (nextIndex !== -1) textIndex = nextIndex + 1;
      }

      return resolvedChar || glyph.char || "";
    });
  }, [glyphs, text]);

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

    // приоритет: если попали в согласную — берем ее
    const consonantHits = hits.filter((item) => {
      const resolved = resolvedGlyphChars[item.idx] || item.g.char;
      return isKhmerConsonant(resolved);
    });
    if (consonantHits.length > 0) return consonantHits[0];

    // дальше избегаем “голого” coeng, если есть что-то еще
    const nonCoengHits = hits.filter((item) => item.g.char !== COENG_CHAR);
    if (nonCoengHits.length > 0) return nonCoengHits[0];

    return hits[0];
  }

  const handlePointerDown = (e) => {
    e.preventDefault();
    const p = svgPointFromEvent(e);
    const hit = pickGlyphAtPoint(p);
    if (!hit) return;

    setSelectedId(hit.g.id);

    // Приоритет 1: звук из очереди (из БД/карты)
    let soundFile = glyphSoundMap[hit.idx];

    // Приоритет 2: авто-определение по восстановленному символу
    if (!soundFile) {
      const resolvedChar = resolvedGlyphChars[hit.idx] || hit.g.char;
      soundFile = getSoundFileForChar(resolvedChar);
    }

    if (onLetterClick) onLetterClick(soundFile);
    if (onComplete) onComplete();
  };

  const subscriptConsonantIndices = useMemo(() => {
    const indices = new Set();
    if (!glyphs || glyphs.length === 0) return indices;
    glyphs.forEach((glyph, idx) => {
      if (glyph.char !== COENG_CHAR) return;
      const next = glyphs[idx + 1];
      if (!next) return;
      const resolved = resolvedGlyphChars[idx + 1] || next.char || "";
      if (isKhmerConsonant(resolved)) indices.add(idx + 1);
    });
    return indices;
  }, [glyphs, resolvedGlyphChars]);

  function colorForGlyph(glyph, idx) {
    const resolved = resolvedGlyphChars[idx] || glyph.char || "";
    const base = getKhmerGlyphColor(glyph.char); // цвет формы — по глифу (coeng останется SUBSCRIPT)

    if (highlightMode === HIGHLIGHT_MODES.ALL) return base;

    if (highlightMode === HIGHLIGHT_MODES.CONSONANTS) {
      return isKhmerConsonant(resolved) ? FALLBACK.NEUTRAL : FALLBACK.MUTED;
    }

    // OFF
    return FALLBACK.NEUTRAL;
  }

  if (loading) {
    return <div className="text-white animate-pulse text-center p-10">Deciphering...</div>;
  }

  if (error || !glyphs || glyphs.length === 0) {
    return <div className="text-red-400 text-center p-10">Error loading glyphs</div>;
  }

  return (
    <div className="w-full flex flex-col items-center py-8">
      <svg
        ref={svgRef}
        viewBox={`${vb.minX} ${vb.minY} ${vb.w} ${vb.h}`}
        className="max-h-[250px] w-full overflow-visible select-none"
        style={{
          touchAction: "manipulation",
          WebkitTapHighlightColor: "transparent",
          userSelect: "none",
        }}
        onPointerDown={handlePointerDown}
      >
        {glyphs.map((glyph, i) => {
          const isSelected = selectedId === glyph.id;
          const fillColor = colorForGlyph(glyph, i);
          const isConsonant = isKhmerConsonant(resolvedGlyphChars[i] || glyph.char);
          const isSubscript = subscriptConsonantIndices.has(i);

          let outlineColor = isSelected ? FALLBACK.SELECTED : "transparent";
          let outlineWidth = isSelected ? 5 : 0;

          if (interactionMode === "find_consonant" && selectedId !== null) {
            outlineWidth = 4;
            if (isSelected) {
              outlineColor = "#22c55e";
            } else if (isSubscript) {
              outlineColor = "#facc15";
            } else if (isConsonant) {
              outlineColor = "#ef4444";
            } else {
              outlineColor = "#ef4444";
            }
          }

          return (
            <g key={glyph.id ?? i}>
              {/* hit-слой: толстый, невидимый; нужен для точного клика */}
              <path
                ref={(el) => (hitRefs.current[i] = el)}
                d={glyph.d}
                fill="transparent"
                stroke="transparent"
                strokeWidth="50"
                pointerEvents="none"
              />

              {/* видимый слой: ВАЖНО — не меняем fill на голубой, только обводка */}
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
                }}
              />
            </g>
          );
        })}
      </svg>
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
