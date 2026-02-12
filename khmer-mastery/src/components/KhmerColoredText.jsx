import React, { useEffect, useState, useMemo } from "react";
import { GLYPH_COLORS, getKhmerGlyphStyle } from "../lib/khmerGlyphRenderer";
import { buildShapeApiUrl } from "../lib/apiConfig";
import { normalizeKhmerText } from "../lib/khmerTextUtils";

const makeViewBoxFromGlyphs = (glyphs, padding = 60) => {
  if (!glyphs || glyphs.length === 0) return "0 0 100 100";

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const g of glyphs) {
    if (!g.bb) continue;
    minX = Math.min(minX, g.bb.x1);
    minY = Math.min(minY, g.bb.y1);
    maxX = Math.max(maxX, g.bb.x2);
    maxY = Math.max(maxY, g.bb.y2);
  }

  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  return `${minX} ${minY} ${Math.max(1, maxX - minX)} ${Math.max(1, maxY - minY)}`;
};

export default function KhmerColoredText({
  text,
  fontSize = 96,
  highlightMode = "series",
  frequencyByChar = null,
  selectionStyle = "outline", // "outline" | "glow"
}) {
  const normalizedText = useMemo(() => normalizeKhmerText(text), [text]);
  const [glyphs, setGlyphs] = useState([]);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchGlyphs = async () => {
      if (!normalizedText) {
        setGlyphs([]);
        return;
      }

      try {
        setError(null);
        const response = await fetch(
          `${buildShapeApiUrl("/api/shape")}?text=${encodeURIComponent(normalizedText)}`
        );

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();

        if (isMounted) {
          setGlyphs(Array.isArray(data) ? data : data.glyphs || []);
        }
      } catch (e) {
        console.error("KhmerColoredText fetch error:", e);
        if (isMounted) {
          setError(e.message);
          setGlyphs([]);
        }
      }
    };

    fetchGlyphs();
    return () => {
      isMounted = false;
    };
  }, [normalizedText]);

  const viewBox = useMemo(() => makeViewBoxFromGlyphs(glyphs, 80), [glyphs]);

  if (error) {
    return <div style={{ color: "red" }}>Error: {error}</div>;
  }

  return (
    <div style={{ width: "100%", height: "200px" }}>
      <svg
        width="100%"
        height="100%"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
      >
        {glyphs.map((glyph) => {
          const isSelected = selectedId === glyph.id;

          const style = getKhmerGlyphStyle(glyph.char, {
            mode: highlightMode,
            frequencyByChar,
          });

          const selectedOutline =
            isSelected && selectionStyle === "outline"
              ? {
                  stroke: GLYPH_COLORS.SELECTED,
                  strokeWidth: 55,
                  paintOrder: "stroke",
                }
              : {};

          const filter =
            isSelected && selectionStyle === "glow"
              ? `drop-shadow(0 0 14px ${GLYPH_COLORS.SELECTED})`
              : "drop-shadow(0 2px 4px rgba(0,0,0,0.35))";

          return (
            <g
              key={glyph.id}
              onClick={() => setSelectedId(glyph.id)}
              style={{ cursor: "pointer" }}
            >
              <path
                d={glyph.d}
                fill={style.fill}
                opacity={style.opacity}
                {...selectedOutline}
                style={{ filter, transition: "filter 150ms ease, opacity 150ms ease" }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
