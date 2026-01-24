import React, { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import hbjs from "harfbuzzjs";

// ВАЖНО: Магия Vite. Мы просим сборщик найти файл ВНУТРИ пакета и дать нам ссылку.
// "?url" в конце говорит: "не пытайся читать файл, просто дай мне путь к нему".
import hbWasmUrl from 'harfbuzzjs/hb-subset.wasm?url';

const DEFAULT_FONT = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

function toPathData(path) {
  return path.toPathData(3);
}

export default function MicroGlyphWord({
  text = "កាហ្វេ",
  fontUrl = DEFAULT_FONT,
  fontSize = 150,
  padding = 40,
}) {
  const [glyphs, setGlyphs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setError(null);
      setGlyphs([]);
      setSelected(null);

      try {
        console.log("Loading HarfBuzz from:", hbWasmUrl);

        // 1. Загружаем шрифт и движок параллельно
        // Мы передаем fetch(hbWasmUrl) прямо в библиотеку. Она сама разберется.
        const [fontBuffer, hb] = await Promise.all([
          fetch(fontUrl).then(res => {
             if (!res.ok) throw new Error(`Font Load Error: ${res.status}`);
             return res.arrayBuffer();
          }),
          hbjs(fetch(hbWasmUrl)) // <--- Передаем промис с правильным URL
        ]);

        if (cancelled) return;

        // 2. Инициализируем OpenType
        const otFont = opentype.parse(fontBuffer);

        // 3. Инициализируем HarfBuzz Blob
        const hbBlob = hb.createBlob(fontBuffer);
        const hbFace = hb.createFace(hbBlob, 0);
        const hbFont = hb.createFont(hbFace);

        // Настраиваем масштаб
        const upem = hbFace.upem;
        hbFont.setScale(upem, upem);

        // 4. Шейпинг (Самое главное)
        const buf = hb.createBuffer();
        buf.addText(text);
        buf.guessSegmentProperties();
        hb.shape(hbFont, buf, []);

        const shaped = buf.json().glyphs;

        // Координаты
        const baseX = padding;
        const baseY = padding + fontSize;
        const scale = fontSize / upem;

        let penX = 0;
        let penY = 0;

        const out = shaped.map((it) => {
          const gid = it.g;
          const x = (penX + it.dx) * scale;
          const y = (penY + it.dy) * scale;

          const glyph = otFont.glyphs.get(gid);
          const path = glyph.getPath(baseX + x, baseY - y, fontSize);

          penX += it.ax;
          penY += it.ay;

          return {
            d: toPathData(path),
            gid,
            cluster: it.cl,
            bb: path.getBoundingBox()
          };
        });

        // Уборка
        buf.destroy();
        hbFont.destroy();
        hbFace.destroy();
        hbBlob.destroy();

        if (!cancelled) setGlyphs(out);

      } catch (e) {
        console.error("MicroGlyph Crash:", e);
        if (!cancelled) setError(e.toString());
      }
    })();

    return () => { cancelled = true; };
  }, [text, fontUrl, fontSize, padding]);

  const viewBox = useMemo(() => {
    if (!glyphs.length) return `0 0 800 300`;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    glyphs.forEach(g => {
        if (g.bb.x1 !== undefined) {
            minX = Math.min(minX, g.bb.x1);
            minY = Math.min(minY, g.bb.y1);
            maxX = Math.max(maxX, g.bb.x2);
            maxY = Math.max(maxY, g.bb.y2);
        }
    });
    if (minX === Infinity) return "0 0 800 300";
    const p = 20;
    const w = (maxX - minX) + p * 2;
    const h = (maxY - minY) + p * 2;
    return `${minX - p} ${minY - p} ${w} ${h}`;
  }, [glyphs]);

  if (error) return (
    <div className="p-4 border border-red-500 bg-black text-red-400 font-mono text-xs rounded">
      CRITICAL ERROR: {error}
      <br/>
      Check console for details.
    </div>
  );

  return (
    <div className="w-full flex justify-center">
      <svg
        width="100%"
        height="300"
        viewBox={viewBox}
        style={{ overflow: "visible", maxWidth: "800px" }}
        onPointerDown={() => setSelected(null)}
      >
        {glyphs.map((g, idx) => {
          const isSelected = selected === idx;
          return (
            <g key={idx} style={{ cursor: "pointer" }}>
              {/* Подсветка */}
              {isSelected && (
                <path
                  d={g.d}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={fontSize * 0.05}
                  style={{ filter: "drop-shadow(0 0 15px cyan)" }}
                />
              )}
              {/* Глиф */}
              <path
                d={g.d}
                fill={isSelected ? "#06b6d4" : "white"}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelected(idx);
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}