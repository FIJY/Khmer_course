import React, { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import hbjs from "harfbuzzjs";

// Ссылка на движок в облаке
const WASM_URL = 'https://unpkg.com/harfbuzzjs@0.3.3/hb-subset.wasm';
// Твой локальный шрифт
const DEFAULT_FONT = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

async function loadArrayBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch font: ${url}`);
  return await res.arrayBuffer();
}

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
        console.log("Starting engine loading...");

        // 1. СКАЧИВАЕМ WASM ВРУЧНУЮ (Самый надежный способ)
        const wasmRes = await fetch(WASM_URL);
        if (!wasmRes.ok) throw new Error(`WASM Fetch Error: ${wasmRes.status}`);
        const wasmBuffer = await wasmRes.arrayBuffer();

        // 2. Инициализируем WebAssembly сами
        const { instance } = await WebAssembly.instantiate(wasmBuffer);

        // 3. Передаем готовый инстанс в HarfBuzz
        const hb = hbjs(instance);
        console.log("Engine loaded!");

        // 4. Скачиваем шрифт
        const fontData = await loadArrayBuffer(fontUrl);
        if (cancelled) return;

        // 5. Запускаем обработку (как раньше)
        const otFont = opentype.parse(fontData);
        const hbBlob = hb.createBlob(fontData);
        const hbFace = hb.createFace(hbBlob, 0);
        const hbFont = hb.createFont(hbFace);

        const upem = hbFace.upem;
        hbFont.setScale(upem, upem);

        const buf = hb.createBuffer();
        buf.addText(text);
        buf.guessSegmentProperties();
        hb.shape(hbFont, buf, []);

        const shaped = buf.json().glyphs;

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
          const d = toPathData(path);
          const bb = path.getBoundingBox();

          penX += it.ax;
          penY += it.ay;

          return { d, gid, cluster: it.cl, bb };
        });

        buf.destroy();
        hbFont.destroy();
        hbFace.destroy();
        hbBlob.destroy();

        if (!cancelled) setGlyphs(out);

      } catch (e) {
        console.error("Critical Render Error:", e);
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
    <div className="flex flex-col items-center justify-center p-4 border border-red-500 bg-red-900/20 text-red-200 rounded-lg">
      <p className="font-bold">Render Error</p>
      <pre className="text-xs mt-2">{error}</pre>
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
              {isSelected && (
                <path
                  d={g.d}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={fontSize * 0.05}
                  style={{
                    filter: "drop-shadow(0 0 15px rgba(6,182,212, 0.8))",
                    transition: "all 0.3s ease"
                  }}
                  pointerEvents="none"
                />
              )}
              <path
                d={g.d}
                fill={isSelected ? "#06b6d4" : "white"}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelected(idx);
                }}
                style={{ transition: "fill 0.2s ease" }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}