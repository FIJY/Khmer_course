import React, { useMemo } from "react";
import { Volume2, ScanSearch } from "lucide-react";
import LessonCard from "../UI/LessonCard";
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

  function playAudio() {
    if (!onPlayAudio) return;
    if (!phraseAudio) return;
    onPlayAudio(phraseAudio);
  }

  function renderHighlightedKhmer(str) {
    if (!str) return null;
    const highlight = Array.isArray(d.highlight) ? d.highlight : [];
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
            <span
              key={i}
              className="outline outline-2 outline-cyan-400/60 rounded-lg px-1 mx-0.5"
            >
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
    <div className="w-full flex justify-center px-4">
      <style>{`
        @font-face {
          font-family: "KhmerFont";
          src: url("${DEFAULT_KHMER_FONT_URL}");
          font-display: swap;
        }
      `}</style>

      <LessonCard className="max-w-[760px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-black uppercase tracking-[0.08em]">{title}</div>
            {subtitle ? <div className="text-xs text-slate-400 mt-1">{subtitle}</div> : null}
          </div>

          <div className="flex gap-2 flex-wrap items-center justify-end">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs uppercase tracking-widest text-slate-200/80">
              <ScanSearch size={14} />
              <span>analysis</span>
            </div>
          </div>
        </div>

        {textLines.length ? (
          <div className="mt-4 space-y-2 text-sm text-slate-200">
            {textLines.map((line, idx) => (
              <div key={idx} className="leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        ) : null}

        {khmer ? (
          <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Khmer</div>
              {phraseAudio ? (
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
              <div
                className="flex items-center justify-center"
                style={{ fontFamily: "KhmerFont, Noto Sans Khmer, sans-serif" }}
              >
                <VisualDecoder
                  data={{ ...d, word: khmer }}
                  highlightMode={HIGHLIGHT_MODES.OFF}
                  interactionMode="find_consonant"
                  onLetterClick={(file) => onPlayAudio?.(file)}
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
          </div>
        ) : null}

        {translation ? (
          <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-black/30">
            <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400 mb-2">Meaning</div>
            <div className="text-sm text-slate-100 leading-relaxed">{translation}</div>
          </div>
        ) : null}

        {note ? <div className="mt-4 text-xs text-slate-400">{note}</div> : null}
      </LessonCard>
    </div>
  );
}
