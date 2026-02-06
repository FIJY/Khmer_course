import React from "react";
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
      return { char, audio: entry.audio };
    })
    .filter(Boolean);

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

  const handlePlay = (entry) => {
    const audio = entry?.audio || getSoundFileForChar(entry?.char);
    if (audio && onPlayAudio) onPlayAudio(audio);
  };

  const renderColumn = (column, entries, accentClass) => (
    <div className="rounded-3xl bg-black/20 p-5 flex flex-col gap-4">
      <div className="text-center">
        <h3 className={`text-sm font-black uppercase tracking-[0.25em] ${accentClass}`}>
          {column?.title || column?.name || "Group"}
        </h3>
        {column?.caption && (
          <p className="mt-2 text-xs text-slate-300">{column.caption}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {entries.map((entry, index) => (
          <button
            key={`${entry.char}-${index}`}
            type="button"
            onClick={() => handlePlay(entry)}
            className="rounded-2xl bg-black/30 p-3 flex items-center justify-center transition hover:bg-black/40"
          >
            <div className="w-16">
              <VisualDecoder
                text={entry.char}
                compact={true}
                hideDefaultButton={true}
                viewBoxPad={40}
                onLetterClick={() => handlePlay(entry)}
              />
            </div>
          </button>
        ))}
      </div>
    </div>
  );

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
          {renderColumn(leftColumn, leftEntries, "text-cyan-200")}
          {renderColumn(rightColumn, rightEntries, "text-emerald-200")}
        </div>
      </LessonFrame>
    </div>
  );
}
