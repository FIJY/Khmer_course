// src/components/AnalysisSlide.jsx
import React, { useMemo, useState } from "react";
import { RotateCcw, ScanSearch, Volume2 } from "lucide-react";
import VisualDecoder, { HIGHLIGHT_MODES } from "../VisualDecoder";
import { getKhmerGlyphCategory } from "../../lib/khmerGlyphRenderer";

const DEFAULT_KHMER_FONT_URL =
  import.meta.env.VITE_KHMER_FONT_URL ??
  "/fonts/KhmerOS_siemreap.ttf";

const isKhmerConsonant = (ch) => {
  if (!ch) return false;
  const code = ch.codePointAt(0);
  return code >= 0x1780 && code <= 0x17a2;
};

const COENG_CHAR = "្";

const countBaseConsonants = (text) => {
  if (!text) return 0;
  const chars = Array.from(text);
  let count = 0;
  let skipNextConsonant = false;

  for (const char of chars) {
    if (char === COENG_CHAR) {
      skipNextConsonant = true;
      continue;
    }

    if (isKhmerConsonant(char)) {
      if (!skipNextConsonant) count += 1;
      skipNextConsonant = false;
      continue;
    }

    if (skipNextConsonant) skipNextConsonant = false;
  }

  return count;
};

export default function AnalysisSlide({ data, onPlayAudio, alphabetDb }) {
  const d = data || {};
  const [selectionIds, setSelectionIds] = useState([]);
  const [selectionResetSeed, setSelectionResetSeed] = useState(0);
  const [renderedGlyphs, setRenderedGlyphs] = useState([]);

  // НОВОЕ: состояние для постоянной подсказки
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

  const subscriptGlyphIndices = useMemo(() => {
    const indices = new Set();
    if (!renderedGlyphs || renderedGlyphs.length === 0) return indices;

    renderedGlyphs.forEach((glyph, idx) => {
      if (glyph.isSubscript) {
        const resolved = glyph.resolvedChar || glyph.char || "";
        if (isKhmerConsonant(resolved)) indices.add(idx);
        return;
      }

      if (glyph.char !== COENG_CHAR) return;
      const next = renderedGlyphs[idx + 1];
      if (!next) return;
      const resolved = next.resolvedChar || next.char || "";
      if (isKhmerConsonant(resolved)) indices.add(idx + 1);
    });

    return indices;
  }, [renderedGlyphs]);

  const glyphIdToIndex = useMemo(() => {
    const map = new Map();
    renderedGlyphs.forEach((glyph, idx) => {
      const id = glyph.id ?? idx;
      map.set(id, idx);
    });
    return map;
  }, [renderedGlyphs]);

  const consonantStats = useMemo(() => {
    if (!khmer) return { total: 0, selected: 0, percentage: 0 };
    const total = renderedGlyphs.length
      ? renderedGlyphs.filter((glyph, idx) => {
          const resolved = glyph.resolvedChar || glyph.char || "";
          if (!isKhmerConsonant(resolved)) return false;
          return !subscriptGlyphIndices.has(idx);
        }).length
      : countBaseConsonants(khmer);
    const selected = selectionIds.filter((id) => {
      const index = glyphIdToIndex.get(id);
      if (index === undefined) return false;
      const glyph = renderedGlyphs[index];
      const resolved = glyph?.resolvedChar || glyph?.char || "";
      return glyph && isKhmerConsonant(resolved) && !subscriptGlyphIndices.has(index);
    }).length;
    return { total, selected, percentage: total > 0 ? Math.round((selected / total) * 100) : 0 };
  }, [khmer, selectionIds, renderedGlyphs, subscriptGlyphIndices, glyphIdToIndex]);

  function playAudio() {
    if (!onPlayAudio || !audio) return;
    onPlayAudio(audio);
  }

  function handleLetterClick(fileName) {
    if (onPlayAudio && fileName) onPlayAudio(fileName);
  }

  const normalizeLookupChar = (glyphChar) => {
    if (!glyphChar) return "";
    const cleaned = String(glyphChar).replace(/\u25CC/g, "").trim();
    return (cleaned || glyphChar).normalize("NFC");
  };

  const lookupAlphabetEntry = (glyphChar) => {
    if (!alphabetDb || !glyphChar) return null;
    const normalized = normalizeLookupChar(glyphChar);

    if (alphabetDb instanceof Map) {
      if (alphabetDb.has(normalized)) return alphabetDb.get(normalized);
      if (alphabetDb.has(glyphChar)) return alphabetDb.get(glyphChar);
    } else if (typeof alphabetDb === "object") {
      if (alphabetDb[normalized]) return alphabetDb[normalized];
      if (alphabetDb[glyphChar]) return alphabetDb[glyphChar];
    }

    const khmerMatch = normalized.match(/[\u1780-\u17FF]/);
    const fallbackChar = khmerMatch ? khmerMatch[0] : "";
    if (fallbackChar) {
      if (alphabetDb instanceof Map) return alphabetDb.get(fallbackChar) || null;
      if (typeof alphabetDb === "object") return alphabetDb[fallbackChar] || null;
    }

    return null;
  };

  const fallbackTypeFromChar = (glyphChar) => {
    const normalized = normalizeLookupChar(glyphChar);
    const khmerMatch = normalized.match(/[\u1780-\u17FF]/);
    const targetChar = khmerMatch ? khmerMatch[0] : normalized;
    const category = getKhmerGlyphCategory(targetChar);
    switch (category) {
      case "consonant":
        return "consonant";
      case "vowel_dep":
        return "vowel_dependent";
      case "vowel_ind":
        return "vowel_independent";
      case "diacritic":
        return "diacritic";
      case "numeral":
        return "numeral";
      case "space":
        return "space";
      case "coeng":
        return "consonant";
      default:
        return "symbol";
    }
  };

  // ОБНОВЛЕНО: теперь данные сохраняются и не исчезают
  function handleGlyphClick(glyphChar) {
    const charData = lookupAlphabetEntry(glyphChar);
    if (charData) {
      setActiveCharData({
        char: glyphChar,
        type: charData.type || fallbackTypeFromChar(glyphChar) || "",
        hint: charData.hint || charData.name_en || charData.name || charData.description || ""
      });
    } else {
      setActiveCharData({
        char: glyphChar,
        type: fallbackTypeFromChar(glyphChar) || "Unknown",
        hint: ""
      });
    }
  }

  function handleResetSelection() {
    setSelectionIds([]);
    setSelectionResetSeed((prev) => prev + 1);
    setActiveCharData(null); // Сбрасываем инфо при очистке
  }

  function renderHighlightedKhmer(str) {
    if (!str || !highlight.length) return str;
    let parts = [{ text: str, hot: false }];
    highlight.forEach((token) => {
      if (!token) return;
      const next = [];
      parts.forEach((p) => {
        if (p.hot) return next.push(p);
        const chunks = p.text.split(token);
        if (chunks.length === 1) {
          next.push(p);
        } else {
          chunks.forEach((c, idx) => {
            if (c) next.push({ text: c, hot: false });
            if (idx < chunks.length - 1) next.push({ text: token, hot: true });
          });
        }
      });
      parts = next;
    });
    return (
      <>
        {parts.map((p, i) =>
          p.hot ? <span key={i} style={styles.hot}>{p.text}</span> : <span key={i}>{p.text}</span>
        )}
      </>
    );
  }

  return (
    <div style={styles.wrap}>
      <style>{`
        @font-face {
          font-family: "KhmerFont";
          src: url("${DEFAULT_KHMER_FONT_URL}");
          font-display: swap;
        }
      `}</style>

      <div style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <div style={styles.title}>{title}</div>
            {subtitle ? <div style={styles.subtitle}>{subtitle}</div> : null}
          </div>
          <div style={styles.iconRow}>
            <div style={styles.badge}><ScanSearch size={16} /><span>analysis</span></div>
            {audio && !isDecoderSelect ? (
              <button type="button" style={styles.audioBtn} onClick={playAudio}>
                <Volume2 size={16} /><span>Play</span>
              </button>
            ) : null}
          </div>
        </div>

        {textLines.length ? (
          <div style={styles.textBlock}>
            {textLines.map((line, idx) => <div key={idx} style={styles.textLine}>{line}</div>)}
          </div>
        ) : null}

        {khmer ? (
          <div style={isDecoderSelect ? styles.khmerBoxCompact : styles.khmerBox}>
            <div style={styles.khmerLabel}>Khmer</div>
            {isDecoderSelect ? (
              <div style={styles.decoderBlock}>
                <div style={styles.decoderHintRow}>
                  <span style={styles.decoderHint}>Tap letters to see details.</span>
                  {selectionIds.length ? (
                    <button type="button" onClick={handleResetSelection} style={styles.resetButton}>
                      <RotateCcw size={14} />Reset
                    </button>
                  ) : null}
                </div>

                <div style={styles.consonantCounter}>
                  <span style={styles.counterLabel}>Consonants:</span>
                  <span style={styles.counterValue}>{consonantStats.selected} / {consonantStats.total}</span>
                  {consonantStats.total > 0 && <span style={styles.counterPercentage}>({consonantStats.percentage}%)</span>}
                </div>

                <VisualDecoder
                  data={d}
                  text={khmer}
                  highlightMode={HIGHLIGHT_MODES.OFF}
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
                  alphabetDb={alphabetDb}
                />
              </div>
            ) : (
              <div style={styles.khmerText}>{renderHighlightedKhmer(khmer)}</div>
            )}
          </div>
        ) : null}

        {/* НИЖНЯЯ ПАНЕЛЬ: либо инфо о букве, либо перевод */}
        <div style={styles.infoPanel}>
          {activeCharData ? (
            <div style={styles.charDetailBox}>
              <div style={styles.charLarge}>{activeCharData.char}</div>
              <div style={styles.charInfoText}>
                <div style={styles.charType}>{activeCharData.type}</div>
                <div style={styles.charHint}>{activeCharData.hint}</div>
              </div>
            </div>
          ) : (
            translation && (
              <div style={styles.translationContainer}>
                <div style={styles.khmerLabel}>Meaning</div>
                <div style={styles.translationText}>{translation}</div>
              </div>
            )
          )}
        </div>

        {note && !activeCharData ? <div style={styles.note}>{note}</div> : null}
      </div>
    </div>
  );
}

const styles = {
  wrap: { width: "100%", display: "flex", justifyContent: "center", padding: "16px", boxSizing: "border-box" },
  card: { width: "100%", maxWidth: "760px", border: "1px solid rgba(255,255,255,0.10)", borderRadius: "28px", padding: "18px", boxShadow: "0 12px 40px rgba(0,0,0,0.35)", background: "rgba(15, 23, 42, 0.92)", color: "rgba(226,232,240,0.95)" },
  headerRow: { display: "flex", justifyContent: "space-between", gap: "12px", marginBottom: "10px" },
  iconRow: { display: "flex", gap: "10px", alignItems: "center" },
  badge: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "999px", border: "1px solid rgba(255,255,255,0.12)", fontSize: "12px" },
  audioBtn: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 10px", borderRadius: "999px", border: "1px solid rgba(34, 211, 238, 0.45)", background: "rgba(34, 211, 238, 0.12)", color: "white", cursor: "pointer" },
  title: { fontSize: "20px", fontWeight: 800 },
  subtitle: { fontSize: "13px", opacity: 0.7 },
  textBlock: { marginBottom: "12px" },
  textLine: { fontSize: "15px", marginBottom: "6px" },
  khmerBox: { padding: "12px", borderRadius: "18px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)" },
  khmerBoxCompact: { padding: "10px", borderRadius: "18px", background: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.1)" },
  decoderBlock: { display: "flex", flexDirection: "column", gap: "8px" },
  consonantCounter: { display: "flex", gap: "8px", padding: "8px 10px", borderRadius: "10px", background: "rgba(34, 211, 238, 0.1)", border: "1px solid rgba(34, 211, 238, 0.2)", fontSize: "13px" },
  counterValue: { fontWeight: 700, color: "#22d3ee" },
  resetButton: { display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "999px", background: "rgba(15,23,42,0.55)", border: "1px solid rgba(255,255,255,0.12)", color: "white", cursor: "pointer", fontSize: "11px" },
  khmerLabel: { fontSize: "12px", opacity: 0.65, marginBottom: "4px" },
  khmerText: { fontFamily: "KhmerFont, sans-serif", fontSize: "28px" },
  infoPanel: { marginTop: "12px", minHeight: "80px" },
  charDetailBox: { display: "flex", alignItems: "center", gap: "20px", padding: "15px", borderRadius: "18px", background: "rgba(34, 211, 238, 0.15)", border: "1px solid rgba(34, 211, 238, 0.3)" },
  charLarge: { fontFamily: "KhmerFont, sans-serif", fontSize: "48px", color: "#22d3ee" },
  charInfoText: { display: "flex", flexDirection: "column", gap: "4px" },
  charType: { fontSize: "18px", fontWeight: 700, color: "white", textTransform: "uppercase" },
  charHint: { fontSize: "14px", opacity: 0.8 },
  translationContainer: { padding: "12px", borderRadius: "18px", background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.1)" },
  translationText: { fontSize: "16px", fontWeight: 500 },
  note: { marginTop: "12px", fontSize: "12px", opacity: 0.65 },
  hot: { outline: "2px solid #22d3ee", borderRadius: "8px", padding: "0 4px" },
  decoderHintRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  decoderHint: { fontSize: "12px", opacity: 0.7 }
};
