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
  evaluateGlyphSuccess,
} from "../lib/glyphFeedback";
import GlyphHintCard from "./UI/GlyphHintCard";
import {
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

// --- Khmer classification helpers ---
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
function cpToChar(cp) {
  try {
    return String.fromCodePoint(cp);
  } catch {
    return "";
  }
}
function charsToCodePoints(str = "") {
  return Array.from(str).map((c) => c.codePointAt(0));
}
function isKhmerConsonant(ch) {
  if (!ch) return false;
  try {
    return typeof isKhmerConsonantChar === "function"
      ? isKhmerConsonantChar(ch)
      : ch.codePointAt(0) >= 0x1780 && ch.codePointAt(0) <= 0x17A2;
  } catch {
    return false;
  }
}

function classifyCp(cp, prevCp) {
  if (isCoengCp(cp)) return "coeng";
  if (isConsonantCp(cp)) {
    if (isCoengCp(prevCp)) return "subscript_consonant";
    return "base_consonant";
  }
  if (isVowelDepCp(cp)) return "dependent_vowel";
  if (isVowelIndCp(cp)) return "independent_vowel";
  if (isDiacriticCp(cp)) return "diacritic";
  return "other";
}

// split token into atomic edu units
function splitTokenToEduAtoms(token, tokenIndex) {
  const cps = charsToCodePoints(token);
  const atoms = [];

  for (let i = 0; i < cps.length; i += 1) {
    const cp = cps[i];
    const prevCp = i > 0 ? cps[i - 1] : undefined;

    if (isCoengCp(cp)) {
      const nextCp = cps[i + 1];
      if (typeof nextCp === "number" && isConsonantCp(nextCp)) {
        atoms.push({
          id: `t${tokenIndex}-a${atoms.length}`,
          type: "subscript_consonant",
          text: COENG_CHAR + cpToChar(nextCp),
          codePoints: [cp, nextCp],
          tokenIndex,
          priority: 4,
          isSubscript: true,
        });
        i += 1;
        continue;
      }

      atoms.push({
        id: `t${tokenIndex}-a${atoms.length}`,
        type: "coeng",
        text: cpToChar(cp),
        codePoints: [cp],
        tokenIndex,
        priority: 1,
        isSubscript: false,
      });
      continue;
    }

    const type = classifyCp(cp, prevCp);
    atoms.push({
      id: `t${tokenIndex}-a${atoms.length}`,
      type,
      text: cpToChar(cp),
      codePoints: [cp],
      tokenIndex,
      priority:
        type === "base_consonant" ? 5
          : type === "subscript_consonant" ? 4
            : type === "dependent_vowel" ? 3
              : type === "diacritic" ? 2
                : 1,
      isSubscript: type === "subscript_consonant",
    });
  }

  return atoms;
}

function normalizeCharSplitInput(text, charSplit) {
  if (Array.isArray(charSplit) && charSplit.length > 0) {
    const cleaned = charSplit
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  }
  return [text];
}

function buildEduUnits(text, charSplit) {
  const tokens = normalizeCharSplitInput(text, charSplit);
  const units = [];

  tokens.forEach((token, tokenIndex) => {
    const tokenCps = charsToCodePoints(token);
    const extra = COMPOUND_CHAR_MAP[token] || [];
    const atoms = splitTokenToEduAtoms(token, tokenIndex);

    const tokenMeta = {
      token,
      tokenIndex,
      tokenCodePoints: tokenCps,
      tokenExtraCodePoints: extra,
    };

    atoms.forEach((a, atomIndex) => {
      units.push({
        ...a,
        id: `${a.id}-${atomIndex}`,
        token: tokenMeta.token,
        tokenIndex: tokenMeta.tokenIndex,
        tokenCodePoints: tokenMeta.tokenCodePoints,
        tokenExtraCodePoints: tokenMeta.tokenExtraCodePoints,
      });
    });
  });

  return units;
}

function makeViewBoxFromBlocks(blocks, pad = 60) {
  if (!blocks || blocks.length === 0) {
    return { minX: 0, minY: 0, w: 300, h: 300 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  blocks.forEach((block) => {
    block.glyphs.forEach((g) => {
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

// map edu units -> render glyph ids (without merge-by-overlap)
function mapEduUnitsToGlyphs(glyphs, eduUnits) {
  const mapping = new Map();      // unitId -> Set(glyphId)
  const glyphToUnits = new Map(); // glyphId -> [unit]

  eduUnits.forEach((u) => mapping.set(u.id, new Set()));

  const normalize = (s) => String(s || "").normalize("NFC");

  const arrayEquals = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i += 1) {
      if (Number(a[i]) !== Number(b[i])) return false;
    }
    return true;
  };

  function scoreMatch(unit, glyph) {
    const gCps = Array.isArray(glyph.codePoints) ? glyph.codePoints : [];
    const uCps = Array.isArray(unit.codePoints) ? unit.codePoints : [];
    const tokenCps = Array.isArray(unit.tokenCodePoints) ? unit.tokenCodePoints : [];
    const gSet = new Set(gCps);

    // 1) direct cp intersection
    if (uCps.some((cp) => gSet.has(cp))) {
      return { ok: true, score: 100, reason: "direct-cp" };
    }

    // 2) token-level cp fallback
    if (arrayEquals(tokenCps, gCps)) {
      return { ok: true, score: 80, reason: "token-cp-eq" };
    }

    if (tokenCps.length > 0 && gCps.some((cp) => tokenCps.includes(cp))) {
      return { ok: true, score: 70, reason: "token-cp-intersect" };
    }

    // 3) text fallback by cluster metadata
    const gText = normalize(
      glyph.clusterText ||
      (Array.isArray(glyph.chars) ? glyph.chars.join("") : "")
    );
    const uText = normalize(unit.text || "");
    const tokenText = normalize(unit.token || "");

    if (uText && gText && (gText === uText || gText.includes(uText))) {
      return { ok: true, score: 60, reason: "text-unit-in-cluster" };
    }

    if (tokenText && gText && (gText === tokenText || gText.includes(tokenText))) {
      return { ok: true, score: 50, reason: "text-token-in-cluster" };
    }

    return { ok: false, score: 0, reason: "no-match" };
  }

  glyphs.forEach((g) => {
    const matches = [];

    eduUnits.forEach((u) => {
      const res = scoreMatch(u, g);
      if (res.ok) {
        matches.push({ unit: u, score: res.score, reason: res.reason });
      }
    });

    matches.sort((a, b) => {
      const byScore = b.score - a.score;
      if (byScore !== 0) return byScore;
      return (b.unit.priority || 0) - (a.unit.priority || 0);
    });

    if (matches.length > 0) {
      const units = matches.map((m) => m.unit);
      glyphToUnits.set(g.id, units);

      units.forEach((u) => {
        const set = mapping.get(u.id);
        if (set) set.add(g.id);
      });
    }
  });

  if (typeof window !== "undefined" && window.__EDU_DEBUG__) {
    const unmatched = eduUnits
      .filter((u) => !mapping.get(u.id) || mapping.get(u.id).size === 0)
      .map((u) => ({
        id: u.id,
        text: u.text,
        type: u.type,
        cps: u.codePoints,
        token: u.token,
        tokenCps: u.tokenCodePoints,
      }));

    // eslint-disable-next-line no-console
    console.log("[EDU DEBUG] unmatched units:", unmatched);
    // eslint-disable-next-line no-console
    console.log("[EDU DEBUG] glyphToUnits:", glyphToUnits);
  }

  return { mapping, glyphToUnits };
}

function unitDisplayChar(unit) {
  if (!unit) return "";
  if (unit.text) return unit.text;
  if (Array.isArray(unit.codePoints) && unit.codePoints.length > 0) {
    return unit.codePoints.map(cpToChar).join("");
  }
  return "";
}

function preferredUnitFromSharedGlyph(hitPoint, glyph, units) {
  if (!glyph?.bb || !units?.length) return units?.[0] || null;

  const bb = glyph.bb;
  const w = Math.max(1, bb.x2 - bb.x1);
  const h = Math.max(1, bb.y2 - bb.y1);

  const relX = (hitPoint.x - bb.x1) / w;
  const relY = (hitPoint.y - bb.y1) / h;

  // 1) subscript prefers lower zone
  const subs = units.filter((u) => u.type === "subscript_consonant" || u.isSubscript);
  if (subs.length && relY > 0.58) return subs[0];

  // 2) dependent vowel often top/left/right
  const dep = units.filter((u) => u.type === "dependent_vowel");
  if (dep.length) {
    if (relY < 0.38 || relX < 0.25 || relX > 0.75) return dep[0];
  }

  // 3) base consonant center
  const base = units.filter((u) => u.type === "base_consonant");
  if (base.length && relY >= 0.32 && relY <= 0.78 && relX >= 0.2 && relX <= 0.8) {
    return base[0];
  }

  // 4) priority fallback
  const sorted = [...units].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  return sorted[0] || units[0] || null;
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
  const text = useMemo(() => normalizeKhmerText(rawText), [rawText]);
  const targetChar = normalizeKhmerText(
    feedbackTargetChar ?? data?.target ?? data?.target_char ?? data?.targetChar ?? ""
  );
  const heroHighlight = data?.hero_highlight ?? data?.heroHighlight ?? null;

  const [glyphs, setGlyphs] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [eduUnits, setEduUnits] = useState([]);
  const [eduMap, setEduMap] = useState(new Map()); // kept for debug/shadow mode
  const [glyphToUnits, setGlyphToUnits] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastTap, setLastTap] = useState(null);
  const [glyphSoundMap, setGlyphSoundMap] = useState({});

  const { playSequence } = useAudioPlayer();
  const svgRef = useRef(null);
  const hintRef = useRef(null);

  // reset selection
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

  // load glyphs + eduUnits + mapping
  useEffect(() => {
    let active = true;

    if (!text) {
      setGlyphs([]);
      setBlocks([]);
      setEduUnits([]);
      setEduMap(new Map());
      setGlyphToUnits(new Map());
      setLoading(false);
      return () => {};
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

        const units = buildEduUnits(text, data?.char_split);
        setEduUnits(units);

        const { mapping, glyphToUnits: g2u } = mapEduUnitsToGlyphs(arr, units);
        setEduMap(mapping);
        setGlyphToUnits(g2u);

        const renderBlocks = arr.map((g, idx) => {
          const related = g2u.get(g.id) || [];
          const primaryUnit =
            related.find((u) => u.type === "base_consonant")
            || [...related].sort((a, b) => (b.priority || 0) - (a.priority || 0))[0]
            || null;

          return {
            blockId: idx,
            glyphs: [g], // one glyph = one block
            glyphId: g.id,
            codePoints: Array.isArray(g.codePoints) ? g.codePoints : [],
            primaryChar: primaryUnit ? unitDisplayChar(primaryUnit) : (g.primaryChar || g.char || "?"),
            relatedUnits: related,
            hasSharedGlyph: related.length > 1,
          };
        });

        setBlocks(renderBlocks);

        if (typeof window !== "undefined" && window.__EDU_DEBUG__) {
          // eslint-disable-next-line no-console
          console.log("[EDU DEBUG] units:", units);
          // eslint-disable-next-line no-console
          console.log("[EDU DEBUG] mapping:", mapping);
          // eslint-disable-next-line no-console
          console.log("[EDU DEBUG] shared blocks:", renderBlocks.filter((b) => b.hasSharedGlyph));
        }

        setLoading(false);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Decoder error:", err);
        if (!active) return;
        setError(err.message || "Error");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [text, data?.char_split]);

  // optional debug snapshot to avoid "unused state" warnings in some setups
  useEffect(() => {
    if (typeof window !== "undefined" && window.__EDU_DEBUG__) {
      window.__EDU_UNITS__ = eduUnits;
      window.__EDU_MAP__ = eduMap;
    }
  }, [eduUnits, eduMap]);

  // sounds
  useEffect(() => {
    if (!glyphs.length) return;

    const audioMap = data?.char_audio_map || {};
    const newMap = {};

    glyphs.forEach((glyph, idx) => {
      const related = glyphToUnits.get(glyph.id) || [];
      const preferred =
        related.find((u) => u.type === "base_consonant")
        || related.find((u) => u.type === "dependent_vowel")
        || related[0];

      const ch = preferred ? unitDisplayChar(preferred) : (glyph.primaryChar || glyph.char || "");
      const clean = (ch || "").trim();

      let sound = audioMap[clean] || getSoundFileForChar(clean);
      if (sound && sound.startsWith("sub_")) {
        sound = sound.replace("sub_", "letter_");
      }

      newMap[idx] = sound;
    });

    setGlyphSoundMap(newMap);
  }, [glyphs, data, glyphToUnits]);

  const vb = useMemo(
    () => makeViewBoxFromBlocks(blocks, viewBoxPad),
    [blocks, viewBoxPad]
  );

  useEffect(() => {
    if (!onGlyphsRendered) return;

    const flatMeta = blocks.flatMap((block, blockIdx) =>
      block.glyphs.map((g, gIdx) => {
        const related = block.relatedUnits || [];
        const primary =
          related.find((u) => u.type === "base_consonant")
          || [...related].sort((a, b) => (b.priority || 0) - (a.priority || 0))[0]
          || null;

        return {
          ...g,
          blockIndex: blockIdx,
          glyphIndexInBlock: gIdx,
          resolvedChar: primary ? unitDisplayChar(primary) : block.primaryChar,
          isSubscript: !!primary?.isSubscript,
          relatedUnits: related,
          sharedGlyph: related.length > 1,
        };
      })
    );

    onGlyphsRendered(flatMeta);
  }, [onGlyphsRendered, blocks]);

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

    for (let blockIdx = 0; blockIdx < blocks.length; blockIdx += 1) {
      const block = blocks[blockIdx];
      for (let gIdx = 0; gIdx < block.glyphs.length; gIdx += 1) {
        const glyph = block.glyphs[gIdx];
        const pathEl = document.getElementById(`glyph-${blockIdx}-${gIdx}`);
        if (!pathEl) continue;

        try {
          if (pathEl.isPointInFill(p)) {
            return { blockIdx, glyph, glyphIdx: gIdx, block };
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

    const { blockIdx, glyph, block } = hit;
    const relatedUnits = block.relatedUnits || [];

    let chosenUnit = null;
    if (relatedUnits.length > 1) {
      chosenUnit = preferredUnitFromSharedGlyph(p, glyph, relatedUnits);
    } else {
      chosenUnit = relatedUnits[0] || null;
    }

    const selectedChar = chosenUnit
      ? unitDisplayChar(chosenUnit)
      : (block.primaryChar || glyph.primaryChar || glyph.char || "?");

    const selectedIsSubscript = !!chosenUnit?.isSubscript;

    if (onGlyphClick) {
      onGlyphClick(selectedChar, {
        blockIdx,
        glyphs: block.glyphs,
        primaryChar: selectedChar,
        allChars: (glyph.codePoints || []).map(cpToChar),
        isSubscript: selectedIsSubscript,
        unitType: chosenUnit?.type || null,
        sharedGlyph: relatedUnits.length > 1,
      });
    }

    if (showTapHint) {
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
        typeLabel: chosenUnit?.type || typeLabel,
        hint: truncatedHint,
        isSubscript: selectedIsSubscript,
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
        glyphMeta: {
          isSubscript: selectedIsSubscript,
          unitType: chosenUnit?.type || null,
        },
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

  // notify selection
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

  // reset selection by key
  useEffect(() => {
    if (resetSelectionKey === undefined) return;
    setSelectedId(null);
    setSelectedIds([]);
  }, [resetSelectionKey]);

  function colorForGlyph(glyph, blockIdx, gIdx, isSelected) {
    const block = blocks[blockIdx];
    const primaryChar = block.primaryChar;
    const base = getKhmerGlyphColor(primaryChar);

    const resolvedIsSelected = isSelected ?? (
      selectionMode === "multi"
        ? selectedIds.includes(blockIdx)
        : selectedId === blockIdx
    );

    if (typeof getGlyphFillColor === "function") {
      const override = getGlyphFillColor({
        glyph,
        idx: blockIdx,
        isSelected: resolvedIsSelected,
        resolvedChar: primaryChar,
        relatedUnits: block.relatedUnits || [],
      });
      if (override) return override;
    }

    if (revealOnSelect && !resolvedIsSelected) return FALLBACK.MUTED;

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

          const isTarget = !!targetChar && block.codePoints.some((cp) => cpToChar(cp) === targetChar);
          const forceHeroOutline = heroHighlight === "green_outline" && isTarget;
          const isConsonant = block.codePoints.some(isConsonantCp);

          return (
            <g key={block.blockId ?? blockIdx}>
              {block.glyphs.map((glyph, gIdx) => {
                const fillColor = colorForGlyph(glyph, blockIdx, gIdx, isBlockSelected);

                let outlineColor = isBlockSelected ? FALLBACK.SELECTED : "transparent";
                let outlineWidth = isBlockSelected ? 5 : 0;

                if (interactionMode === "persistent_select") {
                  if (isBlockSelected) {
                    outlineWidth = 4;
                    outlineColor = isConsonant ? "#22c55e" : "#ef4444";
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
