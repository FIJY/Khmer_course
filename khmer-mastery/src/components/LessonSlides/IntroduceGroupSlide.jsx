import React from "react";
import { Moon, Sun } from "lucide-react";
import LessonFrame from "../UI/LessonFrame";
import VisualDecoder from "../VisualDecoder";
import { getSoundFileForChar } from "../../data/audioMap";

const normalizeEntries = (entries = []) =>
  entries
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") return { char: entry };
      const char = entry.char || entry.letter || entry.text || "";
      if (!char) return null;
      return {
        char,
        audio: entry.audio,
        label: entry.label || entry.sound || entry.pronunciation || entry.reading,
      };
    })
    .filter(Boolean);

const THEMES = {
  solar: {
    titleClass: "text-amber-200",
    panelClass: "bg-gradient-to-b from-amber-900/30 via-black/30 to-black/50",
    tileClass: "bg-black/30 hover:bg-amber-500/10",
    glowClass: "shadow-[0_0_30px_rgba(251,191,36,0.15)]",
    selectedFill: "#fbbf24",
    icon: Sun,
    iconClass: "text-amber-300",
    labelClass: "text-amber-200/80",
  },
  lunar: {
    titleClass: "text-indigo-200",
    panelClass: "bg-gradient-to-b from-indigo-900/30 via-black/30 to-black/50",
    tileClass: "bg-black/30 hover:bg-indigo-500/10",
    glowClass: "shadow-[0_0_30px_rgba(129,140,248,0.18)]",
    selectedFill: "#818cf8",
    icon: Moon,
    iconClass: "text-indigo-300",
    labelClass: "text-indigo-200/80",
  },
};

export default function IntroduceGroupSlide({ data, onPlayAudio }) {
  const columns = Array.isArray(data?.columns) ? data.columns : [];
  const leftColumn = columns[0] || data?.left_group || data?.left || {};
  const rightColumn = columns[1] || data?.right_group || data?.right || {};

  const leftEntries = normalizeEntries(
    leftColumn?.letters ||
      leftColumn?.items ||
      data?.left_letters ||
      data?.left_column ||
      []
  );
  const rightEntries = normalizeEntries(
    rightColumn?.letters ||
      rightColumn?.items ||
      data?.right_letters ||
      data?.right_column ||
      []
  );

  const title = data?.title || "Introduce group";
  const subtitle = data?.subtitle || data?.description || "";
  const maxEntries = Math.max(leftEntries.length, rightEntries.length);

  const handlePlay = (entry) => {
    const audio = entry?.audio || getSoundFileForChar(entry?.char);
    if (audio && onPlayAudio) onPlayAudio(audio);
  };

  const renderColumn = (column, entries, theme) => {
    const Icon = theme.icon;
    const paddedEntries = Array.from({ length: maxEntries }, (_, index) => entries[index] ?? null);
    return (
      <div className={`rounded-3xl p-5 flex flex-col gap-4 ${theme.panelClass} ${theme.glowClass}`}>
        <div className="text-center">
          <div className="flex items-center justify-center mb-3">
            <Icon size={28} className={theme.iconClass} />
          </div>
          <h3 className={`text-sm font-black uppercase tracking-[0.25em] ${theme.titleClass}`}>
            {column?.title || column?.name || "Group"}
          </h3>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {paddedEntries.map((entry, index) => (
            entry ? (
            <button
              key={`${entry.char}-${index}`}
              type="button"
              onClick={() => handlePlay(entry)}
              className="rounded-2xl px-2 py-1 min-h-[64px] flex items-center justify-center transition"
            >
              <div className="w-full flex items-center justify-center gap-3">
                <div className="w-16">
                <VisualDecoder
                  text={entry.char}
                  compact={true}
                  hideDefaultButton={true}
                  viewBoxPad={40}
                  showTapHint={false}
                  selectionMode="single"
                  interactionMode="persistent_select"
                  showSelectionOutline={false}
                  getGlyphFillColor={({ isSelected }) =>
                    isSelected ? theme.selectedFill : "rgba(255,255,255,0.9)"
                  }
                  onLetterClick={() => handlePlay(entry)}
                />
                </div>
                {entry.label ? (
                  <div className={`text-xs font-semibold tracking-[0.12em] ${theme.labelClass}`}>
                    {entry.label}
                  </div>
                ) : null}
              </div>
            </button>
            ) : (
              <div
                key={`empty-${index}`}
                className="rounded-2xl px-2 py-1 min-h-[64px] opacity-20"
                aria-hidden="true"
              />
            )
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
      <LessonFrame className="pt-6 px-6 pb-10 border-0 ring-0" variant="full">
        <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-4 text-center">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-300 text-center mb-8">{subtitle}</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl mx-auto">
          {renderColumn(leftColumn, leftEntries, THEMES.solar)}
          {renderColumn(rightColumn, rightEntries, THEMES.lunar)}
        </div>
      </LessonFrame>
    </div>
  );
}
