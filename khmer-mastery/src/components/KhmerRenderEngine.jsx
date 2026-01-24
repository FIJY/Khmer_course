import React, { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import hbjs from "harfbuzzjs";

// Используем UNPKG (он часто надежнее для raw файлов)
const WASM_URL = 'https://unpkg.com/harfbuzzjs@0.3.3/hb-subset.wasm';
const DEFAULT_FONT = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

function toPathData(path) {
  return path.toPathData(3);
}

export default function KhmerRenderEngine({
  text = "កាហ្វេ",
  fontUrl = DEFAULT_FONT,
  fontSize = 150,
  padding = 40,
}) {
  const [glyphs, setGlyphs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("init"); // init, loading, success, error
  const [debugMsg, setDebugMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus("loading");
      setDebugMsg("Starting Engine v4.0...");
      setGlyphs([]);

      try {
        // 1. СКАЧИВАЕМ ДВИЖОК
        setDebugMsg(`Fetching WASM from: ${WASM_URL}`);
        const wasmRes = await fetch(WASM_URL);
        if (!wasmRes.ok) throw new Error(`WASM 404: ${wasmRes.status}`);
        const wasmBuffer = await wasmRes.arrayBuffer();

        // 2. ЗАПУСКАЕМ
        setDebugMsg("Instantiating WebAssembly...");
        const { instance } = await WebAssembly.instantiate(wasmBuffer);
        const hb = hbjs(instance);

        // 3. СКАЧИВАЕМ ШРИФТ
        setDebugMsg("Loading Font...");
        const fontRes = await fetch(fontUrl);
        if (!fontRes.ok) throw new Error(`Font 404: ${fontRes.status}`);
        const fontBuffer = await fontRes.arrayBuffer();

        // 4. ШЕЙПИНГ
        const otFont = opentype.parse(fontBuffer);
        const hbBlob = hb.createBlob(fontBuffer);
        const hbFace = hb.createFace(hbBlob, 0);
        const hbFont = hb.createFont(hbFace);
        hbFont.setScale(hbFace.upem, hbFace.upem);

        const buf = hb.createBuffer();
        buf.addText(text);
        buf.guessSegmentProperties();
        hb.shape(hbFont, buf, []);

        const shaped = buf.json().glyphs;
        const upem = hbFace.upem;
        const scale = fontSize / upem;
        const baseX = padding;
        const baseY = padding + fontSize;

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
          return { d: toPathData(path), gid, bb: path.getBoundingBox() };
        });

        // Cleanup
        buf.destroy();
        hbFont.destroy();
        hbFace.destroy();
        hbBlob.destroy();

        if (!cancelled) {
            setGlyphs(out);
            setStatus("success");
        }

      } catch (e) {
        console.error("ENGINE ERROR:", e);
        if (!cancelled) {
            setStatus("error");
            setDebugMsg(e.toString());
        }
      }
    })();

    return () => { cancelled = true; };
  }, [text, fontUrl, fontSize]);

  // Вычисляем границы
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

  if (status === "error") return (
    <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 text-xs font-mono rounded m-4">
      <p className="font-bold">❌ RENDER ERROR:</p>
      <p>{debugMsg}</p>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      {/* ИНДИКАТОР ВЕРСИИ (Исчезнет при успехе, или будет зеленым) */}
      {status !== 'success' && (
          <div className="text-[10px] text-cyan-500 font-mono mb-2 animate-pulse">
            [{status}] {debugMsg}
          </div>
      )}

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
                  style={{ filter: "drop-shadow(0 0 15px cyan)" }}
                />
              )}
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