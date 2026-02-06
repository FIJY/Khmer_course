// src/components/LessonSlides/IntroduceGroupSlide.jsx
import React from "react";
import { Moon, Sun } from "lucide-react";
import LessonFrame from "../UI/LessonFrame";
import VisualDecoder from "../VisualDecoder";
import { getSoundFileForChar } from "../../data/audioMap";

const normalizeEntries = (entries = []) =>
  entries
    .map((entry) => {
      if (!entry) return null;
      if (typeof entry === "string") return { char: entry, label: "" };
      const char = entry.char || entry.letter || entry.text || "";
      if (!char) return null;
      return {
        char,
        audio: entry.audio,
        label: entry.label || entry.sound || entry.pronunciation || entry.reading || entry.transliteration || "",
      };
    })
    .filter(Boolean);

const THEMES = {
  solar: {
    titleClass: "text-amber-200",
    panelClass: "bg-gradient-to-b from-amber-900/20 via-black/40 to-black/60",
    glowClass: "shadow-[0_0_40px_rgba(251,191,36,0.1)]",
    selectedFill: "#fbbf24",
    icon: Sun,
    iconClass: "text-amber-400",
    labelClass: "text-amber-100",
  },
  lunar: {
    titleClass: "text-indigo-200",
    panelClass: "bg-gradient-to-b from-indigo-900/20 via-black/40 to-black/60",
    glowClass: "shadow-[0_0_40px_rgba(129,140,248,0.1)]",
    selectedFill: "#818cf8",
    icon: Moon,
    iconClass: "text-indigo-400",
    labelClass: "text-indigo-100",
  },
};

export default function IntroduceGroupSlide({ data, onPlayAudio }) {
  const columns = Array.isArray(data?.columns) ? data.columns : [];
  const leftColumn = columns[0] || data?.left_group || data?.left || {};
  const rightColumn = columns[1] || data?.right_group || data?.right || {};

  const leftEntries = normalizeEntries(
    leftColumn?.letters || leftColumn?.items || data?.left_letters || []
  );
  const rightEntries = normalizeEntries(
    rightColumn?.letters || rightColumn?.items || data?.right_letters || []
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
      <div className={`rounded-[2rem] p-4 flex flex-col gap-2 ${theme.panelClass} ${theme.glowClass} border border-white/5`}>

        {/* Заголовок колонки */}
        <div className="text-center mb-2 pt-2">
          <div className="flex items-center justify-center mb-2">
            <Icon size={24} className={theme.iconClass} />
          </div>
          <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${theme.titleClass}`}>
            {column?.title || column?.name || "Group"}
          </h3>
        </div>

        {/* Список букв */}
        <div className="flex flex-col gap-2">
          {paddedEntries.map((entry, index) => (
            entry ? (
            <button
              key={`${entry.char}-${index}`}
              type="button"
              onClick={() => handlePlay(entry)}
              // ВАЖНО: h-20 задает фиксированную высоту. items-center выравнивает всё строго по центру.
              className="group flex flex-row items-center justify-between w-full h-20 px-3 rounded-xl hover:bg-white/5 transition-all duration-200"
            >
                {/* 1. ГЛИФ СЛЕВА */}
                <div className="w-14 h-14 shrink-0 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 blur-lg" />
                    <div className="w-12 h-12 relative z-10 pointer-events-none flex items-center justify-center">
                      <VisualDecoder
                        text={entry.char}
                        compact={true}
                        hideDefaultButton={true}
                        viewBoxPad={30}
                        showTapHint={false}
                        interactionMode="view_only"
                        showSelectionOutline={false}
                      />
                    </div>
                </div>

                {/* 2. ТЕКСТ СПРАВА */}
                {/* leading-none убирает лишние отступы у шрифта, чтобы он встал ровно по центру */}
                <div className="flex items-center justify-end pl-2 min-w-0 flex-1 h-full">
                  {entry.label ? (
                    <span className={`text-xl font-black uppercase tracking-widest whitespace-nowrap leading-none ${theme.labelClass} opacity-90 group-hover:opacity-100 transition-opacity text-right`}>
                      {entry.label}
                    </span>
                  ) : (
                    <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest leading-none">
                      —
                    </span>
                  )}
                </div>
            </button>
            ) : (
              // Пустая ячейка ТОЖЕ должна иметь фиксированную высоту h-20
              <div key={`empty-${index}`} className="h-20" aria-hidden="true" />
            )
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
      <LessonFrame className="pt-6 px-4 pb-10 border-0 ring-0 bg-transparent" variant="full">
        <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-4 text-center">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-300 text-center mb-6 max-w-md mx-auto leading-relaxed">
            {subtitle}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mx-auto">
          {renderColumn(leftColumn, leftEntries, THEMES.solar)}
          {renderColumn(rightColumn, rightEntries, THEMES.lunar)}
        </div>
      </LessonFrame>
    </div>
  );
}