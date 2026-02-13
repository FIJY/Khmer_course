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
import { normalizeKhmerText } from "../lib/khmerTextUtils";
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
import { COMPOUND_CHAR_MAP } from "../lib/khmerCompoundChars";

export const HIGHLIGHT_MODES = {
  ALL: "all",
  CONSONANTS: "consonants",
  OFF: "off",
};

const COENG_CHAR = "្";
const COENG_CP = 0x17D2;

const FALLBACK = {
  MUTED: "rgba(255,255,255,0.18)",
  NEUTRAL: "rgba(255,255,255,0.92)",
  SELECTED: GLYPH_COLORS?.SELECTED ?? "#22d3ee",
};

// --- Хелперы для работы с codePoints ---
function getPrimaryCharFromGlyph(glyph) {
  const cps = glyph?.codePoints;
  if (Array.isArray(cps) && cps.length > 0) {
    try { return String.fromCodePoint(cps[0]); } catch { /* ignore */ }
  }
  return glyph?.char || "";
}

function getAllCharsFromGlyph(glyph) {
  const cps = glyph?.codePoints;
  if (Array.isArray(cps) && cps.length > 0) {
    try { return cps.map((cp) => String.fromCodePoint(cp)); } catch { /* ignore */ }
  }
  const c = glyph?.char || "";
  return c ? [c] : [];
}

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

function isConsonantCp(cp) {
  return cp >= 0x1780 && cp <= 0x17A2;
}

function isCoengCp(cp) {
  return cp === COENG_CP;
}

function isVowelDepCp(cp) {
  return cp >= 0x17B6 && cp <= 0x17C5;
}

function isVowelIndCp(cp) {
  return cp >= 0x17A3 && cp <= 0x17B3;
}

function isDiacriticCp(cp) {
  return cp >= 0x17C6 && cp <= 0x17D1 && cp !== COENG_CP;
}

function makeViewBoxFromBlocks(blocks, pad = 60) {
  if (!blocks || blocks.length === 0) {
    return { minX: 0, minY: 0, w: 300, h: 300 };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  blocks.forEach(block => {
    block.glyphs.forEach(g => {
      if (g.bb) {
        minX = Math.min(minX, g.bb.x1);
        minY = Math.min(minY, g.bb.y1);
        maxX = Math.max(maxX, g.bb.x2);
        maxY = Math.max(maxY, g.bb.y2);
      }
    });
  });
  if (minX === Infinity) minX = 0;
  if (minY === Infinity) minY = 0;
  if (maxX === -Infinity) maxX = 100;
  if (maxY === -Infinity) maxY = 100;

  return {
    minX: minX - pad,
    minY: minY - pad,
    w: Math.max(10, maxX - minX + pad * 2),
    h: Math.max(10, maxY - minY + pad * 2),
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

  const rawText = propText || data?.word || data?.khmerText || "កាហ្វេ";
  const text = useMemo(() => normalizeKhmerText(rawText), [rawText]);
  const targetChar = normalizeKhmerText(
    feedbackTargetChar ?? data?.target ?? data?.target_char ?? data?.targetChar ?? ""
  );
  const heroHighlight = data?.hero_highlight ?? data?.heroHighlight ?? null;

  const [glyphs, setGlyphs] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastTap, setLastTap] = useState(null);
  const [glyphSoundMap, setGlyphSoundMap] = useState({});

  const { playSequence } = useAudioPlayer();
  const svgRef = useRef(null);
  const hintRef = useRef(null);

  // Сброс выбора
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

  // Загрузка глифов
  useEffect(() => {
    let active = true;
    if (!text) {
      setGlyphs([]);
      setBlocks([]);
      setLoading(false);
      return;
    }

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

        // --- Группировка по char_split (если есть) ---
        if (data?.char_split && Array.isArray(data.char_split) && data.char_split.length > 0) {
          // Для каждого элемента split создаём запись с компонентами
          const splitItems = data.char_split.map((part, idx) => {
            const partCodePoints = Array.from(part).map(c => c.codePointAt(0));
            // Если для этого символа есть составные части, добавляем их codePoints к списку
            const extraCodePoints = COMPOUND_CHAR_MAP[part] || [];
            return {
              index: idx,
              part,
              codePoints: [...partCodePoints, ...extraCodePoints],
            };
          });

          // Для каждого глифа определяем, к какому splitItem он относится
          const glyphToSplit = arr.map(glyph => {
            const glyphCPs = glyph.codePoints || [];
            const matches = [];
            splitItems.forEach(item => {
              if (glyphCPs.some(cp => item.codePoints.includes(cp))) {
                matches.push(item.index);
              }
            });
            return matches;
          });

          // Объединяем splitItem, которые имеют общие глифы
          const splitGroups = [];
          const visited = new Array(splitItems.length).fill(false);

          for (let i = 0; i < splitItems.length; i++) {
            if (visited[i]) continue;

            const groupIndices = new Set([i]);
            const stack = [i];
            while (stack.length) {
              const current = stack.pop();
              visited[current] = true;
              for (let g = 0; g < arr.length; g++) {
                if (glyphToSplit[g].includes(current)) {
                  glyphToSplit[g].forEach(otherIdx => {
                    if (!visited[otherIdx] && !groupIndices.has(otherIdx)) {
                      groupIndices.add(otherIdx);
                      stack.push(otherIdx);
                    }
                  });
                }
              }
            }
            splitGroups.push(Array.from(groupIndices).sort());
          }

          // Для каждой группы собираем глифы
          const newBlocks = splitGroups.map((groupIndices, blockIdx) => {
            const groupGlyphs = [];
            const groupCPs = new Set();
            groupIndices.forEach(idx => {
              arr.forEach((glyph, gIdx) => {
                if (glyphToSplit[gIdx].includes(idx)) {
                  if (!groupGlyphs.includes(glyph)) {
                    groupGlyphs.push(glyph);
                    glyph.codePoints?.forEach(cp => groupCPs.add(cp));
                  }
                }
              });
            });

            // Первый символ группы (для подсказки) — берём из первого splitItem
            const primaryChar = splitItems[groupIndices[0]].part[0] || '?';

            return {
              glyphs: groupGlyphs,
              codePoints: Array.from(groupCPs),
              primaryChar,
              splitIndices: groupIndices,
            };
          });

          setBlocks(newBlocks);
        } else {
          // Если char_split нет, группируем по cluster
          const map = new Map();
          arr.forEach(g => {
            const clusterId = g.cluster ?? 0;
            if (!map.has(clusterId)) map.set(clusterId, []);
            map.get(clusterId).push(g);
          });
          const sortedClusters = Array.from(map.entries())
            .sort(([a], [b]) => a - b)
            .map(([_, clusterGlyphs]) => clusterGlyphs);

          const fallbackBlocks = sortedClusters.map(cluster => ({
            glyphs: cluster,
            codePoints: cluster.flatMap(g => g.codePoints || []),
            primaryChar: cluster[0]?.char || '?',
          }));
          setBlocks(fallbackBlocks);
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error("Decoder error:", err);
        if (!active) return;
        setError(err.message || "Error");
        setLoading(false);
      });

    return () => { active = false; };
  }, [text, data?.char_split]);

  // Звуки (без изменений)
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
    () => makeViewBoxFromBlocks(blocks, viewBoxPad),
    [blocks, viewBoxPad]
  );

  // Оповещаем о рендере
  useEffect(() => {
    if (!onGlyphsRendered) return;
    const flatMeta = blocks.flatMap((block, blockIdx) =>
      block.glyphs.map((g, gIdx) => ({
        ...g,
        blockIndex: blockIdx,
        glyphIndexInBlock: gIdx,
        resolvedChar: block.primaryChar,
        isSubscript: false,
      }))
    );
    onGlyphsRendered(flatMeta);
  }, [onGlyphsRendered, blocks]);

  // ---- Логика выбора блока ----
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

  function pickBlockAtPoint(p) {
    if (!p || !blocks.length) return null;

    for (let blockIdx = 0; blockIdx < blocks.length; blockIdx++) {
      const block = blocks[blockIdx];
      for (let gIdx = 0; gIdx < block.glyphs.length; gIdx++) {
        const glyph = block.glyphs[gIdx];
        const pathEl = document.getElementById(`glyph-${blockIdx}-${gIdx}`);
        if (!pathEl) continue;
        try {
          if (pathEl.isPointInFill(p)) {
            return { blockIdx, glyph, glyphIdx: gIdx };
          }
        } catch {
          // ignore
        }
      }
    }
    return null;
  }

  const handlePointerDown = (e) => {
    e.preventDefault();
    const p = svgPointFromEvent(e);
    const hit = pickBlockAtPoint(p);
    if (!hit) return;

    const { blockIdx, glyph } = hit;
    const block = blocks[blockIdx];

    let selectedChar = block.primaryChar;

    // Если блок содержит несколько splitIndices, пытаемся разделить по горизонтали
    if (block.splitIndices && block.splitIndices.length > 1 && block.glyphs[0]?.bb) {
      const bbox = block.glyphs[0].bb;
      const totalWidth = bbox.x2 - bbox.x1;
      // Пропорции можно настроить под конкретный шрифт, пока 50/50
      const partWidth = totalWidth / block.splitIndices.length;
      const clickX = p.x - bbox.x1;
      const partIndex = Math.floor(clickX / partWidth);
      if (partIndex >= 0 && partIndex < block.splitIndices.length) {
        const splitIdx = block.splitIndices[partIndex];
        const splitPart = data.char_split[splitIdx];
        selectedChar = splitPart[0] || selectedChar;
      }
    }

    if (onGlyphClick) {
      onGlyphClick(selectedChar, {
        blockIdx,
        glyphs: block.glyphs,
        primaryChar: selectedChar,
        allChars: block.codePoints.map(cp => String.fromCodePoint(cp)),
        isSubscript: false,
      });
    }

    if (showTapHint) {
      const isSubscriptConsonant = false;
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
        displayChar: selectedChar,
        typeLabel,
        hint: truncatedHint,
        isSubscript: false,
      });
    }

    if (selectionMode === "multi") {
      setSelectedIds((prev) => (prev.includes(blockIdx) ? prev : [...prev, blockIdx]));
    } else {
      setSelectedId(blockIdx);
    }

    let soundFile = glyphSoundMap[glyph.id];
    if (!soundFile) {
      soundFile = getSoundFileForChar(selectedChar);
    }

    const effectiveRule = feedbackRule ?? data?.success_rule ?? data?.successRule;
    if (effectiveRule) {
      const isSuccess = evaluateGlyphSuccess({
        rule: effectiveRule,
        glyphChar: selectedChar,
        glyphMeta: { isSubscript: false },
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
  };

  // Оповещение о выборе
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

  // Сброс выбора
  useEffect(() => {
    if (resetSelectionKey === undefined) return;
    setSelectedId(null);
    setSelectedIds([]);
  }, [resetSelectionKey]);

  // Цвет заливки для глифа
  function colorForGlyph(glyph, blockIdx, gIdx, isSelected) {
    const block = blocks[blockIdx];
    const primaryChar = block.primaryChar;
    const base = getKhmerGlyphColor(primaryChar);
    const resolvedIsSelected = isSelected ?? (selectionMode === "multi"
      ? selectedIds.includes(blockIdx)
      : selectedId === blockIdx);

    if (typeof getGlyphFillColor === "function") {
      const override = getGlyphFillColor({
        glyph,
        idx: blockIdx,
        isSelected: resolvedIsSelected,
        resolvedChar: primaryChar,
      });
      if (override) return override;
    }

    if (revealOnSelect && !resolvedIsSelected) {
      return FALLBACK.MUTED;
    }

    if (highlightMode === HIGHLIGHT_MODES.ALL) return base;
    if (highlightMode === HIGHLIGHT_MODES.CONSONANTS) {
      return isKhmerConsonant(primaryChar) ? FALLBACK.NEUTRAL : FALLBACK.MUTED;
    }
    return FALLBACK.NEUTRAL;
  }

  if (loading) {
    return <div className="text-white animate-pulse text-center p-10">Deciphering...</div>;
  }

  if (error || !blocks || blocks.length === 0) {
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
        {blocks.map((block, blockIdx) => {
          const isBlockSelected =
            selectionMode === "multi"
              ? selectedIds.includes(blockIdx)
              : selectedId === blockIdx;

          const isTarget = !!targetChar && block.codePoints.some(cp => String.fromCodePoint(cp) === targetChar);
          const forceHeroOutline = heroHighlight === "green_outline" && isTarget;
          const isConsonant = block.codePoints.some(isConsonantCp);

          return (
            <g key={blockIdx}>
              {block.glyphs.map((glyph, gIdx) => {
                const fillColor = colorForGlyph(glyph, blockIdx, gIdx, isBlockSelected);

                let outlineColor = isBlockSelected ? FALLBACK.SELECTED : "transparent";
                let outlineWidth = isBlockSelected ? 5 : 0;

                if (interactionMode === "persistent_select") {
                  if (isBlockSelected) {
                    outlineWidth = 4;
                    if (isConsonant) {
                      outlineColor = "#22c55e";
                    } else {
                      outlineColor = "#ef4444";
                    }
                  }
                } else if (interactionMode === "find_consonant" && selectedId !== null) {
                  if (isBlockSelected) {
                    outlineWidth = 4;
                    outlineColor = "#22c55e";
                  } else {
                    outlineWidth = 0;
                    outlineColor = "transparent";
                  }
                }

                if (!showSelectionOutline) {
                  outlineColor = "transparent";
                  outlineWidth = 0;
                }

                if (forceHeroOutline && !isBlockSelected) {
                  outlineColor = "#22c55e";
                  outlineWidth = 4;
                }

                return (
                  <path
                    key={`${blockIdx}-${gIdx}`}
                    id={`glyph-${blockIdx}-${gIdx}`}
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
                );
              })}
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