import React, { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import hbjs from "harfbuzzjs";

const WASM_URL = '/hb-subset.wasm'; // Берем из public
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
      setDebugMsg("Initializing Engine v9.0...");
      setGlyphs([]);

      try {
        const [wasmRes, fontRes] = await Promise.all([
          fetch(WASM_URL),
          fetch(fontUrl)
        ]);

        if (!wasmRes.ok) throw new Error("WASM file not found in public folder");
        const wasmBuffer = await wasmRes.arrayBuffer();

        if (cancelled) return;

        // Инициализация HarfBuzz
        const hb = await hbjs(wasmBuffer);

        const fontData = await fontRes.arrayBuffer();
        const otFont = opentype.parse(fontData);

        const hbBlob = hb.createBlob(fontData);
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

        buf.destroy();
        hbFont.destroy();
        hbFace.destroy();
        hbBlob.destroy();

        if (!cancelled) {
          setGlyphs(out);
          setStatus("success");
        }
      } catch (e) {
        console.error("V9 ERROR:", e);
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
    const p = 20;
    return `${minX - p} ${minY - p} ${(maxX - minX) + p * 2} ${(maxY - minY) + p * 2}`;
  }, [glyphs]);

  if (status === "error") return (
    <div className="p-4 bg-red-900/80 border border-red-500 text-white font-mono text-xs rounded m-4">
      <p className="font-bold mb-1">❌ SYSTEM ERROR v9.0</p>
      <p>{debugMsg}</p>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        width="100%"
        height="300"
        viewBox={viewBox}
        style={{ overflow: "visible", maxWidth: "900px" }}
        onPointerDown={() => setSelected(null)}
      >
        {glyphs.map((g, idx) => {
          const isSel = selected === idx;
          return (
            <g key={idx} style={{ cursor: "pointer" }}>
              {isSel && (
                <path
                  d={g.d}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={fontSize * 0.05}
                  style={{ filter: "drop-shadow(0 0 15px cyan)" }}
                  pointerEvents="none"
                />
              )}
              <path
                d={g.d}
                fill={isSel ? "#06b6d4" : "white"}
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