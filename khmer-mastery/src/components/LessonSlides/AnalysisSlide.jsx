import React, { useMemo, useState } from "react";
import { RotateCcw, ScanSearch, Volume2 } from "lucide-react";
import VisualDecoder, { HIGHLIGHT_MODES } from "../VisualDecoder";

const DEFAULT_KHMER_FONT_URL =
  import.meta.env.VITE_KHMER_FONT_URL ??
  "/fonts/KhmerOS_siemreap.ttf";

/**
 * AnalysisSlide (autonomous)
 *
 * Props:
 *  - data: object (lesson item data)
 *  - onPlayAudio: (filename: string) => void
 *
 * data schema (flexible):
 *  {
 *    title?: string,
 *    subtitle?: string,
 *    text?: string | string[],
 *    khmer?: string,
 *    translation?: string,
 *    note?: string,
 *    audio?: string,
 *    highlight?: string[]   // опционально: список слов/символов, которые подсветить в khmer
 *  }
 */
export default function AnalysisSlide({ data, onPlayAudio }) {
  const d = data || {};
  const [highlightMode, setHighlightMode] = useState(HIGHLIGHT_MODES.ALL);
  const [resetToken, setResetToken] = useState(0);

  const title = d.title ?? "Analysis";
  const subtitle = d.subtitle ?? "";
  const textLines = useMemo(() => {
    if (!d.text) return [];
    if (Array.isArray(d.text)) return d.text;
    return String(d.text).split("\n").map((s) => s.trim()).filter(Boolean);
  }, [d.text]);

  const khmer = d.khmer ?? d.word ?? d.khmerText ?? "";
  const translation = d.translation ?? "";
  const note = d.note ?? "";
  const audio = d.audio ?? "";
  const mode = d.mode ?? "";
  const isDecoderSelect = mode === "decoder_select";

  const [selectionIds, setSelectionIds] = useState([]);
  const [selectionResetSeed, setSelectionResetSeed] = useState(0);

  const showDecoder = mode === "visual_decoder";
  const showDecoderSelect = mode === "decoder_select";

  function playAudio() {
    if (!onPlayAudio) return;
    if (!audio) return;
    onPlayAudio(audio);
  }

  function handleLetterClick(fileName) {
    if (!onPlayAudio) return;
    if (fileName) onPlayAudio(fileName);
  }

  function handleResetSelection() {
    setSelectionIds([]);
    setSelectionResetSeed((prev) => prev + 1);
  }

  // очень простая “подсветка” без парсинга графем:
  // подсвечиваем точные совпадения строк из highlight
  function renderHighlightedKhmer(str) {
    if (!str) return null;
    if (!highlight.length) return str;

    // грубо, но достаточно для теста типов:
    // делаем последовательные split для каждого маркера
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
          p.hot ? (
            <span key={i} style={styles.hot}>
              {p.text}
            </span>
          ) : (
            <span key={i}>{p.text}</span>
          )
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
            <div style={styles.badge}>
              <ScanSearch size={16} />
              <span>analysis</span>
            </div>

            {audio && !isDecoderSelect ? (
              <button type="button" style={styles.audioBtn} onClick={playAudio}>
                <Volume2 size={16} />
                <span>Play</span>
              </button>
            ) : null}
          </div>
        </div>

        {textLines.length ? (
          <div style={styles.textBlock}>
            {textLines.map((line, idx) => (
              <div key={idx} style={styles.textLine}>
                {line}
              </div>
            ))}
          </div>
        ) : null}

        {khmer ? (
          <div style={isDecoderSelect ? styles.khmerBoxCompact : styles.khmerBox}>
            <div style={styles.khmerLabel}>Khmer</div>
            {isDecoderSelect ? (
              <div style={styles.decoderBlock}>
                <div style={styles.decoderHintRow}>
                  <span style={styles.decoderHint}>
                    Tap letters to hear them. Selected letters stay highlighted.
                  </span>
                  {selectionIds.length ? (
                    <button
                      type="button"
                      onClick={handleResetSelection}
                      style={styles.resetButton}
                      aria-label="Reset selection"
                    >
                      <RotateCcw size={14} />
                      Reset
                    </button>
                  ) : null}
                </div>
                <VisualDecoder
                  data={d}
                  text={khmer}
                  highlightMode={HIGHLIGHT_MODES.OFF}
                  interactionMode="decoder_select"
                  selectionMode="multi"
                  compact={true}
                  viewBoxPad={55}
                  resetSelectionKey={selectionResetSeed}
                  onSelectionChange={setSelectionIds}
                  onLetterClick={handleLetterClick}
                  hideDefaultButton={true}
                />
                {translation ? (
                  <div style={styles.inlineTranslation}>
                    <span style={styles.inlineTranslationLabel}>Meaning:</span>
                    {translation}
                  </div>
                ) : null}
              </div>
            ) : (
              <div style={styles.khmerText}>{renderHighlightedKhmer(khmer)}</div>
            )}
          </div>
        ) : null}

        {!isDecoderSelect && translation ? (
          <div style={styles.translationBox}>
            <div style={styles.khmerLabel}>Meaning</div>
            <div style={styles.translationText}>{translation}</div>
          </div>
        ) : null}

        {note ? <div style={styles.note}>{note}</div> : null}
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "760px",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    background: "white",
    boxSizing: "border-box",


  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "10px",
  },
  iconRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "6px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(0,0,0,0.12)",
    fontSize: "12px",
    opacity: 0.85,
  },
  audioBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 10px",
    borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.15)",
    background: "white",
    cursor: "pointer",
    fontSize: "13px",
  },
  title: {
    fontSize: "20px",
    fontWeight: 800,
    lineHeight: 1.15,
  },
  subtitle: {
    marginTop: "4px",
    fontSize: "13px",
    opacity: 0.7,
  },
  textBlock: {
    marginTop: "10px",
    marginBottom: "12px",
  },
  textLine: {
    fontSize: "15px",
    lineHeight: 1.35,
    marginBottom: "6px",
  },
  khmerBox: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.10)",
  },
  khmerBoxCompact: {
    marginTop: "8px",
    padding: "10px",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.10)",
  },
  translationBox: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.10)",
  },
  decoderBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  decoderHintRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
  },
  decoderHint: {
    fontSize: "12px",
    opacity: 0.7,
  },
  resetButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 8px",
    borderRadius: "999px",
    border: "1px solid rgba(0,0,0,0.12)",
    background: "white",
    fontSize: "11px",
    cursor: "pointer",
  },
  khmerLabel: {
    fontSize: "12px",
    opacity: 0.65,
    marginBottom: "8px",
  },
  khmerText: {
    fontFamily: "KhmerFont, Noto Sans Khmer, sans-serif",
    fontSize: "28px",
    lineHeight: 1.25,
  },
  translationText: {
    fontSize: "15px",
    lineHeight: 1.35,
  },
  inlineTranslation: {
    fontSize: "14px",
    lineHeight: 1.4,
    opacity: 0.75,
  },
  inlineTranslationLabel: {
    fontWeight: 600,
    marginRight: "6px",
  },
  note: {
    marginTop: "12px",
    fontSize: "12px",
    opacity: 0.65,
  },
  hot: {
    outline: "2px solid rgba(0,0,0,0.55)",
    borderRadius: "8px",
    padding: "0 4px",
    margin: "0 2px",
  },
};
