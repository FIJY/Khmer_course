import React, { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import hbjs from "harfbuzzjs";

const WASM_URL = '/hb-subset.wasm';
const DEFAULT_FONT = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function KhmerEngineFinal({ text = "កាហ្វេ", fontUrl = DEFAULT_FONT, fontSize = 140 }) {
  const [glyphs, setGlyphs] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatus("loading");
        // We pass the fetch promise directly to harfbuzzjs.
        // It will try instantiateStreaming first, which requires the correct MIME type.
        const [hb, fontRes] = await Promise.all([
          hbjs(fetch(WASM_URL)),
          fetch(fontUrl)
        ]);

        const fontBuffer = await fontRes.arrayBuffer();
        const otFont = opentype.parse(fontBuffer);

        if (cancelled) return;

        const hbBlob = hb.createBlob(fontBuffer);
        const hbFace = hb.createFace(hbBlob, 0);
        const hbFont = hb.createFont(hbFace);
        hbFont.setScale(hbFace.upem, hbFace.upem);

        const buf = hb.createBuffer();
        buf.addText(text);
        buf.guessSegmentProperties();
        hb.shape(hbFont, buf, []);

        const shaped = buf.json().glyphs;
        const scale = fontSize / hbFace.upem;

        let penX = 0;
        const out = shaped.map((it) => {
          const glyph = otFont.glyphs.get(it.g);
          const path = glyph.getPath(40 + (penX + it.dx) * scale, 40 + fontSize - (it.dy * scale), fontSize);
          penX += it.ax;
          return { d: path.toPathData(3), bb: path.getBoundingBox() };
        });

        buf.destroy(); hbFont.destroy(); hbFace.destroy(); hbBlob.destroy();

        if (!cancelled) {
          setGlyphs(out);
          setStatus("success");
        }
      } catch (e) {
        console.error("V11 Engine Crash:", e);
        if (!cancelled) {
          setStatus("error");
          setError(e.message);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [text, fontUrl, fontSize]);

  if (status === "error") return (
    <div className="p-4 bg-red-900/20 border border-red-500 rounded text-red-200 text-[10px] font-mono">
      SYSTEM ERROR: {error}
    </div>
  );

  return (
    <div className="w-full flex justify-center py-10">
      {status === "loading" ? (
        <div className="text-cyan-500 animate-pulse font-mono text-xs">SYNCING ENGINE...</div>
      ) : (
        <svg width="100%" height="200" viewBox="0 0 800 200" style={{ overflow: "visible" }}>
          {glyphs.map((g, i) => (
            <path key={i} d={g.d} fill="white" className="drop-shadow-lg" />
          ))}
        </svg>
      )}
    </div>
  );
}