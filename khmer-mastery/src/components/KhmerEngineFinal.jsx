import React, { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import hbjs from "harfbuzzjs";

// Используем стабильную прямую ссылку на бинарный файл движка
const WASM_URL = 'https://cdn.jsdelivr.net/npm/harfbuzzjs@0.3.3/subset/hb-subset.wasm';
const DEFAULT_FONT = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

/**
 * Преобразует путь OpenType в строку данных для SVG path (d)
 */
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
      setDebugMsg("Initializing Engine v8.0...");
      setGlyphs([]);

      try {
        setDebugMsg("Fetching WASM & Font assets...");

        // 1. Загружаем движок и шрифт параллельно
        // Передаем fetch напрямую в hbjs, чтобы библиотека сама настроила WebAssembly
        const [hb, fontBuffer] = await Promise.all([
          hbjs(fetch(WASM_URL)),
          fetch(fontUrl).then(res => {
            if (!res.ok) throw new Error(`Font 404: ${res.status}`);
            return res.arrayBuffer();
          })
        ]);

        if (cancelled) return;

        // 2. Инициализируем шрифтовой движок OpenType
        const otFont = opentype.parse(fontBuffer);

        // 3. Подготавливаем HarfBuzz для шейпинга (правильного расположения знаков)
        const hbBlob = hb.createBlob(fontBuffer);
        const hbFace = hb.createFace(hbBlob, 0);
        const hbFont = hb.createFont(hbFace);

        const upem = hbFace.upem;
        hbFont.setScale(upem, upem);

        const buf = hb.createBuffer();
        buf.addText(text);
        buf.guessSegmentProperties();
        hb.shape(hbFont, buf, []);

        const shaped = buf.json().glyphs;

        // Масштабирование из единиц шрифта в пиксели
        const scale = fontSize / upem;
        const baseX = padding;
        const baseY = padding + fontSize;

        let penX = 0;
        let penY = 0;

        // 4. Генерируем векторные контуры для каждого глифа
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

        // Освобождаем память в WASM
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
          setDebugMsg(e.message || e.toString());
        }
      }
    })();

    return () => { cancelled = true; };
  }, [text, fontUrl, fontSize, padding]);

  // Вычисляем границы SVG так, чтобы текст всегда был по центру и виден
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
    <div className="p-4 bg-red-900/80 border border-red-500 text-white font-mono text-xs rounded m-4 max-w-lg">
      <p className="font-bold text-sm mb-1">❌ RENDER ERROR v8.0</p>
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
              {/* Эффект свечения для выбранного глифа */}
              {isSelected && (
                <path
                  d={g.d}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth={fontSize * 0.06}
                  style={{ filter: "drop-shadow(0 0 12px rgba(6,182,212,0.8))" }}
                  pointerEvents="none"
                />
              )}
              {/* Основное тело буквы (SVG Path) */}
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