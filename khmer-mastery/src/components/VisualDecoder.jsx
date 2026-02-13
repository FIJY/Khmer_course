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

// Режимы подсветки (экспортируются для других компонентов)
export const HIGHLIGHT_MODES = {
  ALL: "all",
  CONSONANTS: "consonants",
  OFF: "off",
};

const COENG_CHAR = "្";
const HIT_DISTANCE_THRESHOLD = 35; // не используется, оставим для совместимости

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

function makeViewBoxFromClusters(clusters, pad = 60) {
  if (!clusters || clusters.length === 0) {
    return { minX: 0, minY: 0, w: 300, h: 300 };
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  clusters.forEach(cluster => {
    cluster.forEach(g => {
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

  const [glyphs, setGlyphs] = useState([]); // все глифы с сервера
  const [clusters, setClusters] = useState([]); // сгруппированные по cluster
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null); // id кластера (индекс в clusters)
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

  // Скролл к подсказке
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
      setClusters([]);
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

        // Группируем по cluster
        const map = new Map();
        arr.forEach(g => {
          const clusterId = g.cluster ?? 0;
          if (!map.has(clusterId)) map.set(clusterId, []);
          map.get(clusterId).push(g);
        });
        // Преобразуем в массив кластеров, сортируя по clusterId
        const sortedClusters = Array.from(map.entries())
          .sort(([a], [b]) => a - b)
          .map(([_, clusterGlyphs]) => clusterGlyphs);
        setClusters(sortedClusters);

        setLoading(false);
      })
      .catch((err) => {
        console.error("Decoder error:", err);
        if (!active) return;
        setError(err.message || "Error");
        setLoading(false);
      });

    return () => { active = false; };
  }, [text]);

  // Звуки (можно оставить без изменений, полагаясь на getSoundFileForChar)
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

  // Вычисляем viewBox на основе кластеров
  const vb = useMemo(
    () => makeViewBoxFromClusters(clusters, viewBoxPad),
    [clusters, viewBoxPad]
  );

  // Оповещаем о рендере (передаём кластеры, преобразованные в формат, ожидаемый родителем)
  useEffect(() => {
    if (!onGlyphsRendered) return;
    // Преобразуем кластеры в плоский массив с мета-информацией (для совместимости)
    const flatMeta = clusters.flatMap((cluster, clusterIdx) => {
      return cluster.map((g, gIdx) => ({
        ...g,
        clusterIndex: clusterIdx,
        glyphIndexInCluster: gIdx,
        resolvedChar: getPrimaryCharFromGlyph(g),
        isSubscript: false, // можно вычислить позже, если нужно
      }));
    });
    onGlyphsRendered(flatMeta);
  }, [onGlyphsRendered, clusters]);

  // ---- НОВАЯ ЛОГИКА ВЫБОРА КЛАСТЕРА ----
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

  function pickClusterAtPoint(p) {
    if (!p || !clusters.length) return null;

    // Проходим по всем глифам всех кластеров в порядке, удобном для поиска
    // Но чтобы определить кластер, нам достаточно найти любой глиф, в который попала точка,
    // и вернуть его кластер.
    for (let clusterIdx = 0; clusterIdx < clusters.length; clusterIdx++) {
      const cluster = clusters[clusterIdx];
      for (let gIdx = 0; gIdx < cluster.length; gIdx++) {
        const glyph = cluster[gIdx];
        const pathEl = document.getElementById(`glyph-${clusterIdx}-${gIdx}`);
        if (!pathEl) continue;
        try {
          if (pathEl.isPointInFill(p)) {
            return { clusterIdx, glyph, glyphIdx: gIdx };
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
    const hit = pickClusterAtPoint(p);
    if (!hit) return;

    const { clusterIdx, glyph } = hit;
    const cluster = clusters[clusterIdx];
    const primaryChar = getPrimaryCharFromGlyph(glyph); // можно взять от любого глифа кластера, они все относятся к одному символу
    const allChars = getAllCharsFromGlyph(glyph); // все codePoints этого глифа

    const hitId = clusterIdx; // используем индекс кластера как идентификатор

    if (onGlyphClick) {
      onGlyphClick(primaryChar, {
        clusterIdx,
        glyphs: cluster,
        primaryChar,
        allChars,
        isSubscript: false, // можно вычислить позже
      });
    }

    if (showTapHint) {
      const isSubscript = false; // пока упростим
      const isSubscriptConsonant = false;
      const { typeLabel, hint } = getGlyphHintContent({
        glyphChar: primaryChar,
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
        char: primaryChar,
        displayChar: primaryChar, // просто символ, без ◌
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

    // Звук: попробуем найти для первого символа
    let soundFile = glyphSoundMap[glyph.id]; // осторожно: glyphSoundMap индексирован по индексу глифа в исходном массиве glyphs, а не по кластеру
    if (!soundFile) {
      soundFile = getSoundFileForChar(primaryChar);
    }

    const effectiveRule = feedbackRule ?? data?.success_rule ?? data?.successRule;
    if (effectiveRule) {
      const isSuccess = evaluateGlyphSuccess({
        rule: effectiveRule,
        glyphChar: primaryChar,
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

  // Цвет заливки для глифа (учитываем выделение кластера)
  function colorForGlyph(glyph, clusterIdx, gIdx, isSelected) {
    const primaryChar = getPrimaryCharFromGlyph(glyph);
    const base = getKhmerGlyphColor(primaryChar);
    const resolvedIsSelected = isSelected ?? (selectionMode === "multi"
      ? selectedIds.includes(clusterIdx)
      : selectedId === clusterIdx);

    if (typeof getGlyphFillColor === "function") {
      const override = getGlyphFillColor({
        glyph,
        idx: clusterIdx, // передаём индекс кластера
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

  if (error || !clusters || clusters.length === 0) {
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
        {clusters.map((cluster, clusterIdx) => {
          const isClusterSelected =
            selectionMode === "multi"
              ? selectedIds.includes(clusterIdx)
              : selectedId === clusterIdx;

          // Определяем, является ли кластер целевым (если его основной символ совпадает с targetChar)
          const primaryChar = getPrimaryCharFromGlyph(cluster[0]); // берём первый глиф
          const allChars = cluster.flatMap(g => getAllCharsFromGlyph(g));
          const isTarget = !!targetChar && allChars.includes(targetChar);
          const forceHeroOutline = heroHighlight === "green_outline" && isTarget;

          return (
            <g key={clusterIdx}>
              {cluster.map((glyph, gIdx) => {
                const fillColor = colorForGlyph(glyph, clusterIdx, gIdx, isClusterSelected);
                const isConsonant = isKhmerConsonant(primaryChar);
                const isSubscript = false; // TODO: можно определить по наличию COENG в исходном тексте

                let outlineColor = isClusterSelected ? FALLBACK.SELECTED : "transparent";
                let outlineWidth = isClusterSelected ? 5 : 0;

                if (highlightSubscripts && isSubscript && !isClusterSelected) {
                  outlineColor = "#facc15";
                  outlineWidth = 2;
                }

                if (interactionMode === "persistent_select") {
                  if (isClusterSelected) {
                    outlineWidth = 4;
                    if (isConsonant) {
                      outlineColor = isSubscript ? "#facc15" : "#22c55e";
                    } else {
                      outlineColor = "#ef4444";
                    }
                  }
                } else if (interactionMode === "find_consonant" && selectedId !== null) {
                  outlineWidth = 4;
                  if (isClusterSelected) {
                    outlineColor = "#22c55e";
                  } else if (isSubscript) {
                    outlineColor = "#facc15";
                  } else {
                    outlineColor = "#ef4444";
                  }
                }

                if (interactionMode === "decoder_select") {
                  outlineWidth = isClusterSelected ? 4 : 0;
                  if (isClusterSelected) {
                    if (isSubscript) {
                      outlineColor = "#facc15";
                    } else if (isConsonant) {
                      outlineColor = "#22c55e";
                    } else {
                      outlineColor = "#94a3b8";
                    }
                  }
                }

                if (!showSelectionOutline) {
                  outlineColor = "transparent";
                  outlineWidth = 0;
                }

                if (forceHeroOutline && !isClusterSelected) {
                  outlineColor = "#22c55e";
                  outlineWidth = 4;
                }

                return (
                  <path
                    key={`${clusterIdx}-${gIdx}`}
                    id={`glyph-${clusterIdx}-${gIdx}`}
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