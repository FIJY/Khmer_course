import React, { useMemo, useRef, useState, useEffect } from "react";
import { getSoundFileForChar } from "../data/audioMap";

const COENG_CHAR = "្";

// --- ХЕЛПЕРЫ (Оставляем твои, они хорошие) ---
function codepointsForChar(ch) {
  return Array.from(ch || "").map(
    (c) => `U+${c.codePointAt(0).toString(16).toUpperCase()}`
  );
}

function isKhmerConsonant(ch) {
  if (!ch) return false;
  const cp = ch.codePointAt(0);
  return cp >= 0x1780 && cp <= 0x17A2;
}

function findNextConsonantAfterCoeng(textChars, startIndex) {
  let coengIndex = -1;
  for (let i = startIndex; i < textChars.length; i++) {
    if (textChars[i] === COENG_CHAR) {
      coengIndex = i;
      break;
    }
  }

  const searchStart = coengIndex >= 0 ? coengIndex + 1 : startIndex;
  for (let i = searchStart; i < textChars.length; i++) {
    if (isKhmerConsonant(textChars[i])) {
      return { char: textChars[i], index: i };
    }
  }

  return { char: "", index: -1 };
}

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

  return {
    minX,
    minY,
    w: Math.max(10, maxX - minX),
    h: Math.max(10, maxY - minY),
  };
}

export default function VisualDecoder({
  data,
  text: propText,
  onLetterClick,
  onComplete,
  hideDefaultButton,
}) {
  const text = propText || data?.word || data?.khmerText || "កាហ្វេ";

  const [glyphs, setGlyphs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Добавляем карту звуков для поддержки кастомных файлов из БД
  const [glyphSoundMap, setGlyphSoundMap] = useState({});

  const svgRef = useRef(null);
  const hitRefs = useRef([]);
  // УБРАЛИ hitRefs.current = [] отсюда, чтобы не ломать клики при перерисовке!

  // --- 1. СБРОС ССЫЛОК (Безопасный) ---
  useEffect(() => {
    hitRefs.current = [];
  }, [text]);

  // --- 2. ЗАГРУЗКА SVG ---
  useEffect(() => {
    let active = true;
    if (!text) return;

    setLoading(true);
    setError(null);

    fetch(`http://localhost:3001/api/shape?text=${encodeURIComponent(text)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Server error");
        return res.json();
      })
      .then((json) => {
        if (active) {
          setGlyphs(Array.isArray(json) ? json : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Decoder error:", err);
        if (active) {
          setError(err.message || "Error");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [text]);

  // --- 3. ГЕНЕРАЦИЯ КАРТЫ ЗВУКОВ (Queue Method) ---
  // Это позволяет использовать 'sub_co.mp3' из базы данных,
  // вместо того чтобы гадать по тексту.
  useEffect(() => {
    if (!glyphs.length || !data?.char_split) return;

    const audioMap = data.char_audio_map || {};
    const soundQueues = {};
    const isConsonant = (char) => /[\u1780-\u17A2]/.test(char);

    // Заполняем очереди звуков на основе char_split из БД
    data.char_split.forEach(token => {
        const cleanToken = token ? token.trim() : "";
        let groupSound = audioMap[token] || audioMap[cleanToken];

        // Фолбэк на стандартный звук, если в карте нет
        if (!groupSound) groupSound = getSoundFileForChar(cleanToken);

        // Авто-замена имен (sub_ -> letter_)
        if (groupSound && groupSound.startsWith("sub_")) {
            groupSound = groupSound.replace("sub_", "letter_");
        }

        for (const char of cleanToken) {
            if (!soundQueues[char]) soundQueues[char] = [];

            // Защита согласных: если звук для знака/гласной, а символ - согласная,
            // даем согласной её родной звук.
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

    // Раздаем звуки глифам
    glyphs.forEach((glyph, idx) => {
        const char = glyph.char;
        if (queuesCopy[char] && queuesCopy[char].length > 0) {
            newMap[idx] = queuesCopy[char].shift();
        }
        // Если в очереди пусто, мы используем фолбэк в handlePointerDown
    });

    setGlyphSoundMap(newMap);
  }, [glyphs, data]);


  // --- ВЫЧИСЛЕНИЯ ---
  const vb = useMemo(() => {
    if (!glyphs || glyphs.length === 0) return { minX: 0, minY: 0, w: 300, h: 300 };
    return makeViewBoxFromGlyphs(glyphs, 70);
  }, [glyphs]);

  const hitOrder = useMemo(() => {
    if (!glyphs) return [];
    return glyphs
      .map((g, idx) => ({ g, idx, area: bboxArea(g.bb) }))
      .sort((a, b) => a.area - b.area);
  }, [glyphs]);

  // Запасная логика резолвинга (из твоего кода) - пригодится, если нет данных в БД
  const resolvedGlyphChars = useMemo(() => {
    const textChars = Array.from(text || "");
    let textIndex = 0;

    return (glyphs || []).map((glyph) => {
      let resolvedChar = glyph.char || "";

      if (resolvedChar === COENG_CHAR) {
        const { char, index } = findNextConsonantAfterCoeng(textChars, textIndex);
        if (char) {
          resolvedChar = char;
          textIndex = index + 1;
        }
      } else if (resolvedChar) {
        const nextIndex = textChars.indexOf(resolvedChar, textIndex);
        if (nextIndex !== -1) {
          textIndex = nextIndex + 1;
        }
      }
      return resolvedChar || glyph.char || "";
    });
  }, [glyphs, text]);

  // --- ОБРАБОТЧИКИ ---
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

    const hits = [];
    for (const item of hitOrder) {
      const pathEl = hitRefs.current[item.idx];
      if (!pathEl) continue;
      try {
        if (pathEl.isPointInFill?.(p) || pathEl.isPointInStroke?.(p)) {
          hits.push(item);
        }
      } catch {}
    }

    if (hits.length === 0) return null;

    const consonantHits = hits.filter((item) => {
      const resolved = resolvedGlyphChars[item.idx] || item.g.char;
      return isKhmerConsonant(resolved);
    });
    if (consonantHits.length > 0) return consonantHits[0];

    const nonCoengHits = hits.filter((item) => item.g.char !== COENG_CHAR);
    if (nonCoengHits.length > 0) return nonCoengHits[0];

    return hits[0];
  }

  const handlePointerDown = (e) => {
    e.preventDefault();
    const p = svgPointFromEvent(e);
    const hit = pickGlyphAtPoint(p);
    if (!hit) return;

    setSelectedId(hit.g.id);

    // 1. Сначала пробуем взять звук из Карты Очереди (из базы)
    let soundFile = glyphSoundMap[hit.idx];

    // 2. Если карты нет (или в базе ошибка), используем твой метод резолвинга
    if (!soundFile) {
        const resolvedChar = resolvedGlyphChars[hit.idx] || hit.g.char;
        soundFile = getSoundFileForChar(resolvedChar);
        console.log("Fallback audio logic used");
    }

    console.log(`VisualDecoder Click: Glyph "${hit.g.char}" -> Sound: ${soundFile}`);

    if (onLetterClick) {
      onLetterClick(soundFile);
    }

    if (onComplete) onComplete();
  };

  if (loading)
    return <div className="text-white animate-pulse text-center p-10">Deciphering...</div>;

  if (error || !glyphs || glyphs.length === 0)
    return <div className="text-red-400 text-center p-10">Error loading glyphs</div>;

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

              {/* ХИТ-БОКС (Уменьшили strokeWidth до 55, чтобы не перекрывать соседей) */}
              <path
                ref={(el) => (hitRefs.current[i] = el)}
                d={glyph.d}
                fill="transparent"
                stroke="transparent"
                strokeWidth="55"
                pointerEvents="none"
              />

              {/* Видимый слой */}
              <path
                d={glyph.d}
                fill={isSelected ? "#22d3ee" : "white"}
                pointerEvents="none"
                className="transition-all duration-300"
                style={{
                  filter: isSelected
                    ? "drop-shadow(0 0 15px #22d3ee)"
                    : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))",
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}