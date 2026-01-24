import React, { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import hbjs from "harfbuzzjs";

// === ЛОКАЛЬНЫЙ ПУТЬ ===
// Файл лежит в папке /public, поэтому доступен от корня /
const WASM_URL = '/vendor/harfbuzzjs.wasm';
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
      setDebugMsg("Initializing Local Engine...");
      setGlyphs([]);

      try {
        // 1. СКАЧИВАЕМ ЛОКАЛЬНО
        setDebugMsg(`Fetching local WASM: ${WASM_URL}`);
        const wasmRes = await fetch(WASM_URL);

        // ПРОВЕРКА НА HTML (Та самая ошибка Magic Word)
        if (!wasmRes.ok) throw new Error(`WASM 404: File not found locally`);
        const contentType = wasmRes.headers.get("content-type");

        // Если сервер вернул HTML, значит файл не найден и Vercel отдал index.html
        if (contentType && contentType.includes("text/html")) {
             throw new Error("SERVER ERROR: Vercel returned HTML instead of WASM. Check public folder.");
        }

        const wasmBuffer = await wasmRes.arrayBuffer();

        // 2. ЗАПУСКАЕМ
        setDebugMsg("Instantiating Module...");
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

        buf.destroy();
        hbFont.destroy();
        hbFace.destroy();
        hbBlob.destroy();

        if (!cancelled) {
            setGlyphs(out);
            setStatus("success");
        }

      } catch (e) {
        console.error("ENGINE CRASH:", e);
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
    if (minX === Infinity) return "0 0 800 300";
    const p = 20;
    return `${minX - p} ${minY - p} ${(maxX - minX) + p * 2} ${(maxY - minY) + p * 2}`;
  }, [glyphs]);

  if (status === "error") return (
    <div className="p-4 bg-red-900/90 border border-red-500 text-white font-mono text-xs rounded m-4 max-w-md">
      <p className="font-bold text-lg mb-2">🛑 LOCAL LOAD ERROR</p>
      <p>{debugMsg}</p>
    </div>
  );

  return (
    <div className="w-full flex flex-col items-center">
      {status !== 'success' && (
          <div className="text-[10px] text-blue-400 font-mono mb-2 animate-pulse">
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