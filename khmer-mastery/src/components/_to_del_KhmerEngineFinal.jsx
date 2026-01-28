import React, { useMemo, useState } from "react";
import shapedData from "../data/shaped-text.json";

export default function KhmerEngineFinal({ text = "កាហ្វេ", onLetterClick }) {
  const glyphs = shapedData?.[text] || [];
  const [selected, setSelected] = useState(null);

  const viewBox = useMemo(() => {
    if (!glyphs.length) return "0 0 800 400";
    const minX = Math.min(...glyphs.map((g) => g.bb.x1));
    const maxX = Math.max(...glyphs.map((g) => g.bb.x2));
    const minY = Math.min(...glyphs.map((g) => g.bb.y1));
    const maxY = Math.max(...glyphs.map((g) => g.bb.y2));
    const pad = 30;
    return `${minX - pad} ${minY - pad} ${maxX - minX + pad * 2} ${maxY - minY + pad * 2}`;
  }, [glyphs]);

  if (!glyphs.length) {
    return (
      <div className="text-red-400 text-sm font-mono">
        Слово не сгенерировано: <b>{text}</b>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center bg-black py-8 rounded-3xl border border-white/10">
      <svg viewBox={viewBox} className="w-full max-h-[350px] overflow-visible">
        {glyphs.map((g, idx) => {
          const isSelected = selected === idx;
          return (
            <path
              key={`${g.id ?? idx}`}
              d={g.d}
              fill={isSelected ? "#4ECDC4" : "white"}
              className="cursor-pointer transition-all duration-150 hover:opacity-80"
              style={{
                pointerEvents: "all",
                filter: isSelected ? "drop-shadow(0 0 10px #4ECDC4)" : "none",
              }}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSelected(idx);

                const cluster = g.clusterIndex ?? 0;
                const ch = text[cluster] ?? null;
                if (ch && onLetterClick) onLetterClick(ch, { cluster, glyphIndex: idx, char: g.char });
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}
