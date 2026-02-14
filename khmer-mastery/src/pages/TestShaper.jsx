// src/components/TestShaper.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useKhmerShaper } from "../hooks/useKhmerShaper";
import { getSoundFileForChar } from "../data/audioMap";
import { buildUnits } from "../lib/khmerUnitParser";
import { getKhmerGlyphColor } from "../lib/khmerGlyphRenderer";

const DEFAULT_TEXT = "កម្ពុជា";

function unionBBox(glyphs) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const g of glyphs || []) {
    if (!g.bb) continue;
    minX = Math.min(minX, g.bb.x1);
    minY = Math.min(minY, g.bb.y1);
    maxX = Math.max(maxX, g.bb.x2);
    maxY = Math.max(maxY, g.bb.y2);
  }
  if (!Number.isFinite(minX)) return null;
  return { x1: minX, y1: minY, x2: maxX, y2: maxY };
}

function bbArea(bb) {
  return bb ? Math.max(0, bb.x2 - bb.x1) * Math.max(0, bb.y2 - bb.y1) : 0;
}

function pointInBBox(p, bb) {
  return p.x >= bb.x1 && p.x <= bb.x2 && p.y >= bb.y1 && p.y <= bb.y2;
}

export default function TestShaper({ manualUnits = [] }) {
  const { ready, error, shape } = useKhmerShaper();
  const [text, setText] = useState(DEFAULT_TEXT);
  const [normalGlyphs, setNormalGlyphs] = useState([]);
  const [splitGlyphs, setSplitGlyphs] = useState([]);
  const [selectedUnitId, setSelectedUnitId] = useState(null);
  const audioRef = useRef(null);
  const svgRef = useRef(null);

  const playChar = (ch) => {
    try {
      const src = getSoundFileForChar(ch);
      if (!src) return;
      if (!audioRef.current) audioRef.current = new Audio();
      const a = audioRef.current;
      a.pause();
      a.currentTime = 0;
      a.src = src;
      a.play().catch(() => {});
    } catch {}
  };

  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      try {
        const normal = await shape(text);
        const split = await shape(text, { mode: 'split' });
        setNormalGlyphs(normal);
        setSplitGlyphs(split);
        setSelectedUnitId(null);
      } catch (e) {
        console.error("Shape error:", e);
      }
    };
    load();
  }, [ready, shape, text]);

  const units = useMemo(() => {
    return buildUnits(text, manualUnits);
  }, [text, manualUnits]);

  const unitsWithGlyphs = useMemo(() => {
    return units.map(unit => {
      const unitCodePoints = Array.from(unit.text).map(ch => ch.codePointAt(0));
      const glyphs = normalGlyphs.filter(g => g.codePoints?.some(cp => unitCodePoints.includes(cp)));
      return { ...unit, glyphs };
    });
  }, [units, normalGlyphs]);

  const splitGlyphToUnit = useMemo(() => {
    const map = new Map();
    splitGlyphs.forEach(glyph => {
      const matchingUnit = units.find(unit => {
        const unitCodePoints = Array.from(unit.text).map(ch => ch.codePointAt(0));
        return glyph.codePoints?.some(cp => unitCodePoints.includes(cp));
      });
      if (matchingUnit) map.set(glyph, matchingUnit);
    });
    return map;
  }, [units, splitGlyphs]);

  const bbox = useMemo(() => unionBBox(normalGlyphs), [normalGlyphs]);

  const viewBox = useMemo(() => {
    if (!bbox) return "0 0 300 300";
    const pad = 90;
    return `${bbox.x1 - pad} ${bbox.y1 - pad} ${(bbox.x2 - bbox.x1) + pad * 2} ${(bbox.y2 - bbox.y1) + pad * 2}`;
  }, [bbox]);

  const svgPointFromEvent = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  };

  const handleClick = (e) => {
    const p = svgPointFromEvent(e);
    if (!p) return;

    // Поиск по split-глифам (точное попадание)
    let hitUnit = null;
    for (const glyph of splitGlyphs) {
      const pathEl = document.getElementById(`split-${glyph.id}`);
      if (pathEl && pathEl.isPointInFill(p)) {
        hitUnit = splitGlyphToUnit.get(glyph);
        if (hitUnit) break;
      }
    }

    if (!hitUnit) return;

    setSelectedUnitId(hitUnit.id);
    playChar(hitUnit.text[0] || '');
  };

  if (error) {
    return <div className="p-8 text-red-400">Error: {error}</div>;
  }
  if (!ready) {
    return <div className="p-8 text-white/60">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-white font-bold text-xl">TestShaper (финальный)</div>
        <input
          className="bg-gray-800 border border-white/10 rounded px-3 py-2 text-white w-[240px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          className="px-3 py-2 rounded bg-gray-700 text-white/90 hover:bg-gray-600"
          onClick={() => setSelectedUnitId(null)}
        >
          Clear
        </button>
        <div className="text-white/60 text-sm font-mono">
          glyphs: {normalGlyphs.length} | units: {units.length} | selected: {selectedUnitId || "null"}
        </div>
      </div>

      <div className="bg-gray-800 p-5 rounded-lg">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="w-full max-h-[360px]"
          style={{ background: "#111" }}
          onClick={handleClick}
        >
          {/* Фон normal-глифы (полупрозрачные) */}
          {normalGlyphs.map((g) => (
            <path
              key={`bg-${g.id}`}
              d={g.d}
              fill="rgba(148,163,184,0.08)"
              stroke="none"
              pointerEvents="none"
            />
          ))}

          {/* Невидимые split-глифы для хит-теста */}
          {splitGlyphs.map((g) => (
            <path
              key={`split-${g.id}`}
              id={`split-${g.id}`}
              d={g.d}
              fill="transparent"
              stroke="none"
              pointerEvents="all"
              style={{ cursor: "pointer" }}
            />
          ))}

          {/* Заливка выбранного юнита (normal-глифы) */}
          {unitsWithGlyphs.map((unit) => {
            if (unit.id !== selectedUnitId) return null;
            const fillColor = getKhmerGlyphColor(unit.text[0] || '');
            return unit.glyphs.map((g) => (
              <path
                key={`fill-${unit.id}-${g.id}`}
                d={g.d}
                fill={fillColor}
                fillOpacity="0.7"
                stroke="none"
                pointerEvents="none"
              />
            ));
          })}

          {/* Контуры normal-глифов */}
          {normalGlyphs.map((g) => (
            <path
              key={`outline-${g.id}`}
              d={g.d}
              fill="transparent"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth="1.5"
              pointerEvents="none"
            />
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {units.map((unit) => {
          const isSelected = unit.id === selectedUnitId;
          const color = getKhmerGlyphColor(unit.text[0] || '');
          return (
            <button
              key={unit.id}
              className="text-left bg-gray-800 rounded p-3 border-l-4 hover:bg-gray-700"
              style={{ borderColor: isSelected ? "rgba(250,204,21,0.95)" : color }}
              onClick={() => {
                setSelectedUnitId(unit.id);
                playChar(unit.text[0] || '');
              }}
            >
              <div className="text-white font-mono">
                <strong>{unit.id}</strong> — {unit.kind} <span className="text-white/60">"{unit.text}"</span>
              </div>
              <div className="text-white/50 text-xs font-mono mt-1">
                индексы: [{unit.indices?.join(', ') || ''}] | глифов: {unit.glyphs?.length ?? 0}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}