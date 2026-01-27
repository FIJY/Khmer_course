import React, { useMemo, useRef, useState, useEffect } from "react";
import { getSoundFileForChar } from "../data/audioMap";

// --- ХЕЛПЕРЫ ГЕОМЕТРИИ ---
function bboxArea(bb) {
  const w = (bb?.x2 ?? 0) - (bb?.x1 ?? 0);
  const h = (bb?.y2 ?? 0) - (bb?.y1 ?? 0);
  return Math.max(0, w) * Math.max(0, h);
}

function makeViewBoxFromGlyphs(glyphs, pad = 60) {
  const xs1 = glyphs.map((g) => g.bb?.x1 ?? 0);
  const xs2 = glyphs.map((g) => g.bb?.x2 ?? 0);
  const ys1 = glyphs.map((g) => g.bb?.y1 ?? 0);
  const ys2 = glyphs.map((g) => g.bb?.y2 ?? 0);

  const minX = Math.min(...xs1) - pad;
  const maxX = Math.max(...xs2) + pad;
  const minY = Math.min(...ys1) - pad;
  const maxY = Math.max(...ys2) + pad;

  return { minX, minY, w: Math.max(10, maxX - minX), h: Math.max(10, maxY - minY) };
}

export default function VisualDecoder({ data, text: propText, onLetterClick, onComplete, hideDefaultButton }) {
  const text = propText || data?.word || data?.khmerText || "កាហ្វេ";

  const [glyphs, setGlyphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [glyphSoundMap, setGlyphSoundMap] = useState({});

  const svgRef = useRef(null);
  const hitRefs = useRef([]);

  // --- БЕЗОПАСНАЯ ОЧИСТКА ---
  // Сбрасываем ссылки только когда меняется само СЛОВО.
  useEffect(() => {
    hitRefs.current = [];
  }, [text]);

  // 1. ЗАГРУЗКА SVG
  useEffect(() => {
    let active = true;
    if (!text) return;

    setLoading(true);
    fetch(`http://localhost:3001/api/shape?text=${encodeURIComponent(text)}`)
      .then(res => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then(json => {
        if (active) {
           setGlyphs(json);
           setLoading(false);
        }
      })
      .catch(err => {
        console.error("Decoder error:", err);
        if (active) {
            setError(err.message);
            setLoading(false);
        }
      });

    return () => { active = false; };
  }, [text]);

  // 2. КАРТА ЗВУКОВ (ЛОГИКА ОЧЕРЕДИ)
  useEffect(() => {
    if (!glyphs.length || !data?.char_split) return;

    const audioMap = data.char_audio_map || {};
    const soundQueues = {};
    const isConsonant = (char) => /[\u1780-\u17A2]/.test(char);

    data.char_split.forEach(token => {
        const cleanToken = token ? token.trim() : "";
        let groupSound = audioMap[token] || audioMap[cleanToken];

        if (!groupSound) groupSound = getSoundFileForChar(cleanToken);
        if (groupSound && groupSound.startsWith("sub_")) {
            groupSound = groupSound.replace("sub_", "letter_");
        }

        for (const char of cleanToken) {
            if (!soundQueues[char]) soundQueues[char] = [];

            const isModifierSound = groupSound && (
                groupSound.includes("sign_") ||
                groupSound.includes("vowel_") ||
                groupSound.includes("diacritic")
            );

            if (isConsonant(char) && isModifierSound) {
                const nativeSound = getSoundFileForChar(char);
                soundQueues[char].push(nativeSound);
            } else {
                soundQueues[char].push(groupSound);
            }
        }
    });

    const newMap = {};
    const queuesCopy = JSON.parse(JSON.stringify(soundQueues));

    glyphs.forEach((glyph, idx) => {
        const char = glyph.char;
        if (queuesCopy[char] && queuesCopy[char].length > 0) {
            newMap[idx] = queuesCopy[char].shift();
        } else {
            newMap[idx] = getSoundFileForChar(char);
        }
    });

    setGlyphSoundMap(newMap);
  }, [glyphs, data]);

  // --- ГЕОМЕТРИЯ И КЛИКИ ---
  const vb = useMemo(() => {
    if (glyphs.length === 0) return { minX: 0, minY: 0, w: 300, h: 300 };
    return makeViewBoxFromGlyphs(glyphs, 70);
  }, [glyphs]);

  const hitOrder = useMemo(() => {
    return glyphs
      .map((g, idx) => ({ g, idx, area: bboxArea(g.bb) }))
      .sort((a, b) => a.area - b.area);
  }, [glyphs]);

  function svgPointFromEvent(evt) {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  }

  function pickGlyphAtPoint(p) {
    if (!p) return null;
    for (const item of hitOrder) {
      const pathEl = hitRefs.current[item.idx];
      // Пропускаем, если ссылка потерялась
      if (!pathEl) continue;

      try {
        // Проверяем попадание в заливку ИЛИ в обводку
        if (pathEl.isPointInFill?.(p) || pathEl.isPointInStroke?.(p)) {
          return { glyph: item.g, index: item.idx };
        }
      } catch {}
    }
    return null;
  }

  const handlePointerDown = (e) => {
    e.preventDefault();
    const p = svgPointFromEvent(e);
    const hit = pickGlyphAtPoint(p);

    if (!hit) return;

    const { glyph, index } = hit;
    setSelectedId(glyph.id);

    const soundFile = glyphSoundMap[index];
    console.log(`Clicked #${index} ("${glyph.char}") -> ${soundFile}`);

    if (onLetterClick) onLetterClick(soundFile);
    if (onComplete) onComplete();
  };

  if (loading) return <div className="text-white animate-pulse text-center p-10">Deciphering...</div>;
  if (error || glyphs.length === 0) return <div className="text-red-400 text-center p-10">Error loading glyphs</div>;

  return (
    <div className="w-full flex justify-center items-center py-8">
      <svg
        ref={svgRef}
        viewBox={`${vb.minX} ${vb.minY} ${vb.w} ${vb.h}`}
        className="max-h-[250px] w-full overflow-visible select-none"
        style={{ touchAction: "manipulation" }}
        onPointerDown={handlePointerDown}
      >
        {glyphs.map((glyph, i) => {
          const isSelected = selectedId === glyph.id;
          return (
            <g key={glyph.id}>
              <title>{glyph.char}</title>

              {/* ХИТ-БОКС (НЕВИДИМЫЙ) */}
              {/* Уменьшили strokeWidth до 55, чтобы не перекрывать соседей */}
              <path
                ref={(el) => (hitRefs.current[i] = el)}
                d={glyph.d}
                fill="transparent"
                stroke="transparent"
                strokeWidth="55"
                pointerEvents="none"
              />

              {/* ВИДИМАЯ БУКВА */}
              <path
                d={glyph.d}
                fill={isSelected ? "#22d3ee" : "white"}
                pointerEvents="none"
                className="transition-all duration-300"
                style={{ filter: isSelected ? "drop-shadow(0 0 15px #22d3ee)" : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}