import React, { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import hbjs from "harfbuzzjs";

// Используем локальный путь, который мы только что "пробили" через кэш
const WASM_URL = '/vendor/hb-subset.wasm';
const DEFAULT_FONT = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

function toPathData(path) {
  return path.toPathData(3);
}

export default function KhmerEngineFinal({
  text = "កាហ្វេ",
  fontUrl = DEFAULT_FONT,
  fontSize = 150,
  padding = 40,
}) {
  const [glyphs, setGlyphs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("init");
  const [debugMsg, setDebugMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus("loading");
      setDebugMsg("Initializing Engine v10.0...");
      setGlyphs([]);

      try {
        setDebugMsg("Fetching assets...");

        // 1. Загружаем бинарники
        const [wasmRes, fontRes] = await Promise.all([
          fetch(WASM_URL),
          fetch(fontUrl)
        ]);

        if (!wasmRes.ok) throw new Error("WASM not found");
        if (!fontRes.ok) throw new Error("Font not found");

        const [wasmBuffer, fontBuffer] = await Promise.all([
          wasmRes.arrayBuffer(),
          fontRes.arrayBuffer()
        ]);

        if (cancelled) return;

        // 2. Инициализация через библиотеку (она сама сделает правильный instantiate)
        const hb = await hbjs(wasmBuffer);
        const otFont = opentype.parse(fontBuffer);

        // 3. Шейпинг (построение кхмерского слова)
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

          return {
            d: toPathData(path),
            gid,
            cluster: it.cl,
            bb: path.getBoundingBox()
          };
        });

        // Очистка памяти WASM
        buf.destroy();
        hbFont.destroy();
        hbFace.destroy();
        hbBlob.destroy();

        if (!cancelled) {
          setGlyphs(out);
          setStatus("success");
        }

      } catch (e) {
        console.error("V10 ERROR:", e);
        if (!cancelled) {
          setStatus("error");
          setDebugMsg(e.message || e.toString());
        }
      }
    })();

    return () => { cancelled = true; };
  }, [text, fontUrl, fontSize]);

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
    const p = 40;
    return `${minX - p} ${minY - p} ${(maxX - minX) + p * 2} ${(maxY - minY) + p * 2}`;
  }, [glyphs]);

  if (status === "error") return (
    <div className="p-4 bg-gray-900 border border-red-500 text-red-400 font-mono text-[10px] rounded m-4">
      <p className="font-bold text-red-500 mb-1">❌ SYSTEM ERROR v10.0</p>
      <p>{debugMsg}</p>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      {status !== 'success' && (
        <div className="text-[10px] text-cyan-400 font-mono mb-2 animate-pulse italic">
          [{status}] {debugMsg}
        </div>
      )}

      <svg
        width="100%"
        height="300"
        viewBox={viewBox}
        className="drop-shadow-2xl"
        style={{ overflow: "visible", maxWidth: "900px" }}
        onPointerDown={() => setSelected(null)}
      >
        {glyphs.map((g, idx) => {
          const isSelected = selected === idx;
          return (
            <g key={idx} className="transition-all duration-300">
              {isSelected && (
                <path
                  d={g.d}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={fontSize * 0.05}
                  style={{ filter: "drop-shadow(0 0 15px rgba(6,182,212,0.8))" }}
                  pointerEvents="none"
                />
              )}
              <path
                d={g.d}
                fill={isSelected ? "#06b6d4" : "white"}
                className="cursor-pointer"
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