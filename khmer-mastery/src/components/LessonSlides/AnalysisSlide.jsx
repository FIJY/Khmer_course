// src/components/AnalysisSlide.jsx
import React, { useMemo, useState } from "react";
import { RotateCcw, ScanSearch, Volume2 } from "lucide-react";
import VisualDecoder from "../VisualDecoder";
import LessonFrame from "../UI/LessonFrame";
import LessonHeader from "../UI/LessonHeader";
import { getKhmerGlyphCategory } from "../../lib/khmerGlyphRenderer";
import GlyphHintCard from "../UI/GlyphHintCard";
import {
  buildGlyphDisplayChar,
  getGlyphHintContent,
  normalizeGlyphChar,
  truncateHint,
} from "../../lib/glyphHintUtils";

const DEFAULT_KHMER_FONT_URL =
  import.meta.env.VITE_KHMER_FONT_URL ??
  "/fonts/KhmerOS_siemreap.ttf";

const isKhmerConsonant = (ch) => {
  if (!ch) return false;
  const code = ch.codePointAt(0);
  return code >= 0x1780 && code <= 0x17a2;
};

const COENG_CHAR = "្";

export default function AnalysisSlide({ data, onPlayAudio, alphabetDb }) {
  const d = data || {};
  const [selectionIds, setSelectionIds] = useState([]);
  const [selectionResetSeed, setSelectionResetSeed] = useState(0);
  const [renderedGlyphs, setRenderedGlyphs] = useState([]);
  const [activeCharData, setActiveCharData] = useState(null);

  const title = d.title ?? "Analysis";
  const subtitle = d.subtitle ?? "";
  const khmer = d.khmer ?? d.word ?? d.khmerText ?? "";
  const translation = d.translation ?? "";
  const note = d.note ?? "";
  const audio = d.audio ?? d.word_audio ?? d.phrase_audio ?? "";
  const mode = d.mode ?? "";
  const isDecoderSelect = mode === "decoder_select";
  const highlight = Array.isArray(d.highlight) ? d.highlight : [];

  const textLines = useMemo(() => {
    if (!d.text) return [];
    if (Array.isArray(d.text)) return d.text;
    return String(d.text).split("\n").map((s) => s.trim()).filter(Boolean);
  }, [d.text]);

  // ИСПРАВЛЕНО: Правильное определение индексов подписных согласных
  const subscriptGlyphIndices = useMemo(() => {
    const indices = new Set();
    if (!renderedGlyphs || renderedGlyphs.length === 0) return indices;

    renderedGlyphs.forEach((glyph, idx) => {
      // Пропускаем COENG глифы - они не должны считаться как отдельные согласные
      if (glyph.char === COENG_CHAR) return;

      // Если глиф уже помечен как subscript (из VisualDecoder)
      if (glyph.isSubscript) {
        const resolved = glyph.resolvedChar || glyph.char || "";
        if (isKhmerConsonant(resolved)) {
          indices.add(idx);
        }
      }
    });

    return indices;
  }, [renderedGlyphs]);

  // ИСПРАВЛЕНО: Правильный подсчет согласных и subscripts
  const consonantStats = useMemo(() => {
    if (!renderedGlyphs.length) {
      return {
        total: 0,
        selected: 0,
        percentage: 0,
        subscriptTotal: 0,
        subscriptSelected: 0
      };
    }

    let totalBase = 0;
    let totalSub = 0;
    let selectedBase = 0;
    let selectedSub = 0;

    renderedGlyphs.forEach((glyph, idx) => {
      // ВАЖНО: Пропускаем COENG глифы - они не являются согласными
      if (glyph.char === COENG_CHAR) return;

      const resolved = glyph.resolvedChar || glyph.char || "";

      // Пропускаем не-согласные
      if (!isKhmerConsonant(resolved)) return;

      const glyphId = glyph.id ?? idx;
      const isSelected = selectionIds.includes(glyphId);
      const isSub = subscriptGlyphIndices.has(idx);

      if (isSub) {
        totalSub += 1;
        if (isSelected) selectedSub += 1;
      } else {
        totalBase += 1;
        if (isSelected) selectedBase += 1;
      }
    });

    return {
      total: totalBase,
      selected: selectedBase,
      percentage: totalBase > 0 ? Math.round((selectedBase / totalBase) * 100) : 0,
      subscriptTotal: totalSub,
      subscriptSelected: selectedSub,
    };
  }, [renderedGlyphs, selectionIds, subscriptGlyphIndices]);

  function playAudio() {
    if (onPlayAudio && audio) onPlayAudio(audio);
  }

  const hintMaxChars = d.hint_max_chars ?? d.hintMaxChars;

  const fallbackTypeFromChar = (glyphChar) => {
    const normalized = normalizeGlyphChar(glyphChar);
    const khmerMatch = normalized.match(/[\u1780-\u17FF]/);
    const targetChar = khmerMatch ? khmerMatch[0] : normalized;
    const category = getKhmerGlyphCategory(targetChar);

    const map = {
      consonant: "consonant",
      vowel_dep: "vowel_dependent",
      vowel_ind: "vowel_independent",
      diacritic: "diacritic",
      numeral: "numeral",
      space: "space",
      coeng: "consonant"
    };

    return map[category] || "symbol";
  };

  function handleGlyphClick(glyphChar, glyphMeta) {
    const isSub = glyphMeta?.isSubscript;
    const display = buildGlyphDisplayChar({
      glyphChar,
      isSubscript: isSub,
      isSubscriptConsonant: isSub && isKhmerConsonant(glyphChar),
    });
    const { typeLabel, hint, entry } = getGlyphHintContent({
      glyphChar,
      alphabetDb,
      fallbackTypeLabel: fallbackTypeFromChar,
    });
    const truncatedHint = truncateHint(hint, hintMaxChars);

    setActiveCharData({
      char: display,
      type: typeLabel,
      hint: truncatedHint,
      isSubscript: isSub,
    });

    if (onPlayAudio && entry?.audio) {
      onPlayAudio(entry.audio);
    }
  }

  function handleLetterClick(fileName) {
    if (onPlayAudio && fileName) onPlayAudio(fileName);
  }

  function handleResetSelection() {
    setSelectionIds([]);
    setSelectionResetSeed(s => s + 1);
    setActiveCharData(null);
  }

  function renderHighlightedKhmer(str) {
    if (!str || !highlight.length) return str;

    let parts = [{ text: str, hot: false }];

    highlight.forEach(token => {
      if (!token) return;
      const next = [];

      parts.forEach(p => {
        if (p.hot) {
          next.push(p);
          return;
        }

        const chunks = p.text.split(token);
        chunks.forEach((c, i) => {
          if (c) next.push({ text: c, hot: false });
          if (i < chunks.length - 1) next.push({ text: token, hot: true });
        });
      });

      parts = next;
    });

    return parts.map((p, i) =>
      p.hot ? <span key={i} style={styles.hot}>{p.text}</span> : <span key={i}>{p.text}</span>
    );
  }

  return (
    <LessonFrame className="p-6">
      <style>{`
        @font-face {
          font-family: "KhmerFont";
          src: url("${DEFAULT_KHMER_FONT_URL}");
          font-display: swap;
        }
      `}</style>
      <div style={styles.headerRow}>
        <LessonHeader title={title} subtitle={subtitle} align="left" />
        <div style={styles.iconRow}>
          <div style={styles.badge}>
            <ScanSearch size={16} />
            <span>analysis</span>
          </div>
          {audio && !isDecoderSelect && (
            <button style={styles.audioBtn} onClick={playAudio}>
              <Volume2 size={16} />
              <span>Play</span>
            </button>
          )}
        </div>
      </div>

        {textLines.length > 0 && (
          <div style={styles.textBlock}>
            {textLines.map((line, idx) => (
              <div key={idx} style={styles.textLine}>{line}</div>
            ))}
          </div>
        )}

        {khmer && (
          <div style={isDecoderSelect ? styles.khmerBoxCompact : styles.khmerBox}>
            <div style={styles.khmerLabel}>Khmer</div>
            {isDecoderSelect ? (
              <div style={styles.decoderBlock}>
                <div style={styles.decoderHintRow}>
                  <span style={styles.decoderHint}>Tap letters to see details.</span>
                  {selectionIds.length > 0 && (
                    <button onClick={handleResetSelection} style={styles.resetButton}>
                      <RotateCcw size={14} />
                      Reset
                    </button>
                  )}
                </div>

                <div style={styles.consonantCounter}>
                  <span style={styles.counterLabel}>Consonants:</span>
                  <span style={styles.counterValue}>
                    {consonantStats.selected} / {consonantStats.total}
                  </span>
                  {consonantStats.total > 0 && (
                    <span style={styles.counterPercentage}>
                      ({consonantStats.percentage}%)
                    </span>
                  )}
                  <span style={styles.counterDivider} />
                  <span style={styles.counterLabel}>Subscripts:</span>
                  <span style={styles.subscriptValue}>
                    {consonantStats.subscriptSelected} / {consonantStats.subscriptTotal}
                  </span>
                </div>

                <VisualDecoder
                  data={d}
                  text={khmer}
                  interactionMode="persistent_select"
                  selectionMode="multi"
                  compact={true}
                  viewBoxPad={55}
                  resetSelectionKey={selectionResetSeed}
                  onSelectionChange={setSelectionIds}
                  onLetterClick={handleLetterClick}
                  onGlyphsRendered={setRenderedGlyphs}
                  hideDefaultButton={true}
                  onGlyphClick={handleGlyphClick}
                  highlightSubscripts={true}
                  alphabetDb={alphabetDb}
                />
              </div>
            ) : (
              <div style={styles.khmerText}>{renderHighlightedKhmer(khmer)}</div>
            )}
          </div>
        )}

        <div style={styles.infoPanel}>
          {activeCharData ? (
            <GlyphHintCard
              displayChar={activeCharData.char}
              typeLabel={activeCharData.type}
              hint={activeCharData.hint}
              isSubscript={activeCharData.isSubscript}
              variant="detail"
            />
          ) : translation ? (
            <div style={styles.translationContainer}>
              <div style={styles.khmerLabel}>Meaning</div>
              <div style={styles.translationText}>{translation}</div>
            </div>
          ) : null}
        </div>

        {note && !activeCharData && <div style={styles.note}>{note}</div>}
    </LessonFrame>
  );
}

const styles = {
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "16px",
    gap: "12px"
  },
  iconRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: "12px"
  },
  audioBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "999px",
    border: "1px solid rgba(34, 211, 238, 0.45)",
    background: "rgba(34, 211, 238, 0.12)",
    color: "white",
    cursor: "pointer",
    fontSize: "13px"
  },
  textBlock: {
    marginBottom: "12px"
  },
  textLine: {
    fontSize: "16px",
    marginBottom: "8px",
    lineHeight: 1.5
  },
  khmerBox: {
    padding: "16px",
    borderRadius: "20px",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  khmerBoxCompact: {
    padding: "12px",
    borderRadius: "20px",
    background: "rgba(0,0,0,0.22)",
    border: "1px solid rgba(255,255,255,0.08)"
  },
  decoderBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  consonantCounter: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "rgba(34, 211, 238, 0.08)",
    border: "1px solid rgba(34, 211, 238, 0.2)",
    fontSize: "14px",
    flexWrap: "wrap"
  },
  counterLabel: {
    opacity: 0.7
  },
  counterValue: {
    fontWeight: 700,
    color: "#22d3ee"
  },
  counterPercentage: {
    fontSize: "12px",
    opacity: 0.6
  },
  subscriptValue: {
    fontWeight: 700,
    color: "#facc15"
  },
  counterDivider: {
    width: "1px",
    height: "16px",
    background: "rgba(255,255,255,0.15)"
  },
  resetButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 12px",
    borderRadius: "999px",
    background: "rgba(15,23,42,0.5)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
    transition: "all 0.2s"
  },
  khmerLabel: {
    fontSize: "12px",
    opacity: 0.5,
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  khmerText: {
    fontFamily: "KhmerFont, sans-serif",
    fontSize: "32px",
    lineHeight: 1.4
  },
  infoPanel: {
    marginTop: "16px",
    minHeight: "90px"
  },
  translationContainer: {
    padding: "16px",
    borderRadius: "20px",
    background: "rgba(0,0,0,0.15)",
    border: "1px solid rgba(255,255,255,0.05)"
  },
  translationText: {
    fontSize: "18px",
    fontWeight: 500,
    lineHeight: 1.4
  },
  note: {
    marginTop: "14px",
    fontSize: "13px",
    opacity: 0.5,
    fontStyle: "italic"
  },
  hot: {
    background: "rgba(34, 211, 238, 0.2)",
    borderBottom: "2px solid #22d3ee",
    padding: "0 2px",
    borderRadius: "2px"
  },
  decoderHintRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  decoderHint: {
    fontSize: "12px",
    opacity: 0.5
  }
};
