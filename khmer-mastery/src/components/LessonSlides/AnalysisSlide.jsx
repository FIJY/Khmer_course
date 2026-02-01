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
 *  - alphabetDb?: Map<char, {type: string, ...}> (база данных алфавита с подсказками)
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
export default function AnalysisSlide({ data, onPlayAudio, alphabetDb }) {
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
  const audio = d.audio ?? d.word_audio ?? d.phrase_audio ?? "";
  const mode = d.mode ?? "";
  const isDecoderSelect = mode === "decoder_select";
  const highlight = Array.isArray(d.highlight) ? d.highlight : [];

  const [selectionIds, setSelectionIds] = useState([]);
  const [selectionResetSeed, setSelectionResetSeed] = useState(0);

  // Для подсказок
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const showDecoder = mode === "visual_decoder";
  const showDecoderSelect = mode === "decoder_select";

  // Подсчет согласных
  const consonantStats = useMemo(() => {
    if (!khmer) return { total: 0, selected: 0, percentage: 0 };

    const chars = Array.from(khmer);
    const isConsonant = (ch) => {
      // Проверка: это символ Кхмерской согласной (U+1780 - U+17A2)
      const code = ch.codePointAt(0);
      return code >= 0x1780 && code <= 0x17a2;
    };

    const total = chars.filter(isConsonant).length;
    const selected = selectionIds.length;

    return {
      total,
      selected,
      percentage: total > 0 ? Math.round((selected / total) * 100) : 0,
    };
  }, [khmer, selectionIds]);

  function playAudio() {
    if (!onPlayAudio) return;
    if (!audio) return;
    onPlayAudio(audio);
  }

  function handleLetterClick(fileName) {
    if (!onPlayAudio) return;
    if (fileName) onPlayAudio(fileName);
  }

  function handleGlyphClick(glyphChar, clickEvent) {
    // Получаем подсказку из БД алфавита
    let tip = null;

    if (alphabetDb && alphabetDb.has(glyphChar)) {
      const charData = alphabetDb.get(glyphChar);
      tip = charData.type || charData.hint || `${glyphChar} (${charData.name || 'unknown'})`;
    } else {
      // Fallback: если БД не предоставлена
      tip = glyphChar;
    }

    // Позиция подсказки (рядом с курсором)
    const rect = clickEvent?.currentTarget?.getBoundingClientRect?.();
    const x = rect ? rect.left + rect.width / 2 : clickEvent?.clientX || 0;
    const y = rect ? rect.top : clickEvent?.clientY || 0;

    setTooltipData(tip);
    setTooltipPosition({ x, y });

    // Скрывать подсказку через 2 секунды
    setTimeout(() => {
      setTooltipData(null);
    }, 2000);
  }

  function handleResetSelection() {
    setSelectionIds([]);
    setSelectionResetSeed((prev) => prev + 1);
  }

  // Простая подсветка без парсинга графем:
  // подсвечиваем точные совпадения строк из highlight
  function renderHighlightedKhmer(str) {
    if (!str) return null;
    if (!highlight.length) return str;

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

                {/* Счетчик согласных */}
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
                  hideDefaultButton={true}
                  onGlyphClick={handleGlyphClick}
                  alphabetDb={alphabetDb}
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

      {/* Всплывающая подсказка */}
      {tooltipData && (
        <div
          style={{
            ...styles.tooltip,
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
          }}
        >
          {tooltipData}
        </div>
      )}
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
    position: "relative",
  },
  card: {
    width: "100%",
    maxWidth: "760px",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: "28px",
    padding: "18px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    background: "rgba(15, 23, 42, 0.92)",
    boxSizing: "border-box",
    color: "rgba(226,232,240,0.95)",
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
    border: "1px solid rgba(255,255,255,0.12)",
    fontSize: "12px",
    opacity: 0.9,
  },
  audioBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(34, 211, 238, 0.45)",
    background: "rgba(34, 211, 238, 0.12)",
    cursor: "pointer",
    fontSize: "13px",
    color: "rgba(207,250,254,0.95)",
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
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
  },
  khmerBoxCompact: {
    marginTop: "8px",
    padding: "10px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.22)",
  },
  translationBox: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.25)",
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
  consonantCounter: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 10px",
    borderRadius: "10px",
    background: "rgba(34, 211, 238, 0.1)",
    border: "1px solid rgba(34, 211, 238, 0.2)",
    fontSize: "13px",
  },
  counterLabel: {
    opacity: 0.7,
    fontWeight: 500,
  },
  counterValue: {
    fontWeight: 700,
    color: "rgba(34, 211, 238, 0.95)",
  },
  counterPercentage: {
    opacity: 0.6,
    fontSize: "12px",
  },
  resetButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15,23,42,0.55)",
    fontSize: "11px",
    cursor: "pointer",
    color: "rgba(226,232,240,0.9)",
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
    outline: "2px solid rgba(34,211,238,0.55)",
    borderRadius: "8px",
    padding: "0 4px",
    margin: "0 2px",
  },
  tooltip: {
    position: "fixed",
    transform: "translate(-50%, -120%)",
    backgroundColor: "rgba(34, 211, 238, 0.9)",
    color: "rgba(15, 23, 42, 0.95)",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    pointerEvents: "none",
    zIndex: 1000,
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.5)",
    animation: "fadeInOut 2s ease-in-out",
  },
};

// Добавляем CSS-анимацию в стиль
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeInOut {
    0% {
      opacity: 0;
      transform: translate(-50%, -120%) scale(0.8);
    }
    10% {
      opacity: 1;
      transform: translate(-50%, -120%) scale(1);
    }
    90% {
      opacity: 1;
      transform: translate(-50%, -120%) scale(1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -120%) scale(0.8);
    }
  }
`;
if (typeof document !== "undefined") {
  document.head.appendChild(styleSheet);
}