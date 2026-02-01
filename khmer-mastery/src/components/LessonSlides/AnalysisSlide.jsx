import React, { useEffect, useMemo, useState } from "react";
import { Volume2, ScanSearch } from "lucide-react";
import LessonCard from "../UI/LessonCard";
import { isKhmerConsonantChar } from "../../lib/khmerGlyphRenderer";

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
  const [selectedIndex, setSelectedIndex] = useState(null);

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

  const khmerGraphemes = useMemo(() => {
    if (!khmer) return [];
    if (typeof Intl !== "undefined" && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter("km", { granularity: "grapheme" });
      return Array.from(segmenter.segment(khmer), (segment) => segment.segment);
    }
    return Array.from(khmer);
  }, [khmer]);

  const khmerGlyphs = useMemo(
    () =>
      khmerGraphemes.map((segment) => {
        const chars = Array.from(segment);
        const hasConsonant = chars.some((char) => isKhmerConsonantChar(char));
        const hasSubscript = chars.includes("្");
        return { text: segment, hasConsonant, hasSubscript };
      }),
    [khmerGraphemes]
  );

  useEffect(() => {
    setSelectedIndex(null);
  }, [khmer]);

  function playAudio() {
    if (!onPlayAudio) return;
    if (!audio) return;
    onPlayAudio(audio);
  }

  const OUTLINE_COLORS = {
    selected: "#22c55e",
    other: "#ef4444",
    subscript: "#facc15",
  };

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
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Khmer</div>
              {audio ? (
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
            <div
              className="text-2xl leading-relaxed flex flex-wrap gap-1"
              style={{ fontFamily: "KhmerFont, Noto Sans Khmer, sans-serif" }}
            >
              {khmerGlyphs.map((glyph, idx) => {
                const isSelected = selectedIndex === idx;
                const outlineColor =
                  selectedIndex === null
                    ? "transparent"
                    : isSelected
                      ? OUTLINE_COLORS.selected
                      : glyph.hasSubscript
                        ? OUTLINE_COLORS.subscript
                        : OUTLINE_COLORS.other;

                return (
                  <span
                    key={`${glyph.text}-${idx}`}
                    role={glyph.hasConsonant ? "button" : undefined}
                    tabIndex={glyph.hasConsonant ? 0 : -1}
                    onClick={() => {
                      if (!glyph.hasConsonant) return;
                      setSelectedIndex(idx);
                    }}
                    onKeyDown={(event) => {
                      if (!glyph.hasConsonant) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedIndex(idx);
                      }
                    }}
                    className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded-lg transition-colors ${
                      glyph.hasConsonant ? "cursor-pointer" : ""
                    }`}
                    style={{
                      outline: selectedIndex === null ? "none" : `2px solid ${outlineColor}`,
                      outlineOffset: "2px",
                    }}
                  >
                    {glyph.text}
                  </span>
                );
              })}
            </div>
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
