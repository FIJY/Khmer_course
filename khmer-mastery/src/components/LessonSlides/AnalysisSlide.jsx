import React, { useMemo } from "react";
import { Volume2, ScanSearch } from "lucide-react";

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
  const phraseAudio = d.word_audio ?? d.phrase_audio ?? d.audio ?? "";
  const mode = d.mode ?? "text";

  const showDecoder = mode === "visual_decoder";
  const showDecoderSelect = mode === "decoder_select";

  function playAudio() {
    if (!onPlayAudio) return;
    if (!audio) return;
    onPlayAudio(audio);
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

            {audio ? (
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
          <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Khmer</div>
              {!showDecoderSelect && phraseAudio ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-cyan-400/50 text-cyan-100 bg-cyan-500/15 hover:bg-cyan-500/25 text-xs font-semibold"
                  onClick={playAudio}
                >
                  <Volume2 size={14} />
                  <span>Play</span>
                </button>
              ) : null}
            </div>
            {showDecoder ? (
              <>
                <div className="flex justify-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setHighlightMode(HIGHLIGHT_MODES.ALL)}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                      highlightMode === HIGHLIGHT_MODES.ALL
                        ? "bg-cyan-500 text-black border-cyan-300"
                        : "bg-gray-900 text-white border-white/10"
                    }`}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setHighlightMode(HIGHLIGHT_MODES.CONSONANTS)}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                      highlightMode === HIGHLIGHT_MODES.CONSONANTS
                        ? "bg-cyan-500 text-black border-cyan-300"
                        : "bg-gray-900 text-white border-white/10"
                    }`}
                  >
                    Consonants
                  </button>
                  <button
                    type="button"
                    onClick={() => setHighlightMode(HIGHLIGHT_MODES.OFF)}
                    className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                      highlightMode === HIGHLIGHT_MODES.OFF
                        ? "bg-cyan-500 text-black border-cyan-300"
                        : "bg-gray-900 text-white border-white/10"
                    }`}
                  >
                    Off
                  </button>
                </div>
                <div
                  className="flex items-center justify-center"
                  style={{ fontFamily: "KhmerFont, Noto Sans Khmer, sans-serif" }}
                >
                  <VisualDecoder
                    data={{ ...d, word: khmer }}
                    highlightMode={highlightMode}
                    interactionMode="find_consonant"
                    onLetterClick={(file) => onPlayAudio?.(file)}
                    hideDefaultButton={true}
                  />
                </div>
              </>
            ) : showDecoderSelect ? (
              <div
                className="flex items-center justify-center"
                style={{ fontFamily: "KhmerFont, Noto Sans Khmer, sans-serif" }}
              >
                <VisualDecoder
                  data={{ ...d, word: khmer }}
                  highlightMode={HIGHLIGHT_MODES.OFF}
                  interactionMode="persistent_select"
                  onLetterClick={(file) => onPlayAudio?.(file)}
                  resetSelectionKey={resetToken}
                  hideDefaultButton={true}
                />
              </div>
            ) : (
              <div
                className="text-2xl leading-relaxed text-slate-100"
                style={{ fontFamily: "KhmerFont, Noto Sans Khmer, sans-serif" }}
              >
                {renderHighlightedKhmer(khmer)}
              </div>
            )}
            {showDecoderSelect ? (
              <div className="mt-3 flex items-end justify-between gap-3 text-xs text-slate-400">
                <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">
                  Tap the heroes
                </div>
                <button
                  type="button"
                  onClick={() => setResetToken((prev) => prev + 1)}
                  className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[11px] uppercase tracking-widest text-slate-200 hover:bg-white/10"
                >
                  Reset
                </button>
              </div>
            ) : null}
            {showDecoderSelect && translation ? (
              <div className="mt-3 text-xs text-slate-300">
                <span className="uppercase tracking-[0.2em] text-slate-500">Meaning: </span>
                {translation}
              </div>
            ) : null}
          </div>
        ) : null}

        {translation && !showDecoderSelect ? (
          <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-black/30">
            <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-2">Meaning</div>
            <div className="text-sm text-slate-100 leading-relaxed">{translation}</div>
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
  translationBox: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "14px",
    border: "1px solid rgba(0,0,0,0.10)",
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
