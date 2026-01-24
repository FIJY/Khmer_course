import React, { useEffect, useMemo, useState } from "react";
import opentype from "opentype.js";
import hbjs from "harfbuzzjs";

// Твой путь к WASM файлу
const WASM_URL = 'https://unpkg.com/harfbuzzjs@0.3.3/hb-subset.wasm';
const DEFAULT_FONT = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

async function loadArrayBuffer(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${url}`);
  return await res.arrayBuffer();
}

function toPathData(path) {
  return path.toPathData(3); // 3 знака после запятой для точности
}

export default function MicroGlyphWord({
  text = "កាហ្វេ",
  fontUrl = DEFAULT_FONT,
  fontSize = 150,
  padding = 40, // Отступ, чтобы глифы не обрезались
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
        // 1. Загружаем шрифт и инициализируем движки
        const [fontData, hb] = await Promise.all([
          loadArrayBuffer(fontUrl),
          hbjs(WASM_URL) // <--- ВАЖНО: передаем путь к wasm
        ]);

        if (cancelled) return;

        // 2. OpenType (для контуров)
        const otFont = opentype.parse(fontData);

        // 3. HarfBuzz (для шейпинга - правильного расположения)
        const hbBlob = hb.createBlob(fontData);
        const hbFace = hb.createFace(hbBlob, 0);
        const hbFont = hb.createFont(hbFace);

        // Настройка масштаба
        const upem = hbFace.upem; // Units Per Em (обычно 1000 или 2048)
        hbFont.setScale(upem, upem);

        // Создаем буфер и шейпим текст
        const buf = hb.createBuffer();
        buf.addText(text);
        buf.guessSegmentProperties(); // Авто-определение направления (LTR) и скрипта
        hb.shape(hbFont, buf, []); // Самая главная магия здесь

        const shaped = buf.json().glyphs;
        // shaped содержит: { g: glyphId, cl: cluster, ax, ay, dx, dy }

        // Базовая линия (в SVG Y растет вниз)
        // Смещаем вниз на padding + fontSize, чтобы текст не улетел вверх
        const baseX = padding;
        const baseY = padding + fontSize;
        const scale = fontSize / upem;

        let penX = 0;
        let penY = 0;

        const out = shaped.map((it) => {
          const gid = it.g;

          // Вычисляем позицию глифа
          const x = (penX + it.dx) * scale;
          const y = (penY + it.dy) * scale;

          // Получаем Векторный Контур из OpenType
          const glyph = otFont.glyphs.get(gid);
          // getPath(x, y, fontSize)
          const path = glyph.getPath(baseX + x, baseY - y, fontSize);
          const d = toPathData(path);

          // Сохраняем BBox для расчета viewBox
          const bb = path.getBoundingBox();

          // Двигаем "перо" для следующей буквы
          penX += it.ax;
          penY += it.ay;

          return { d, gid, cluster: it.cl, bb };
        });

        // Чистим память (HarfBuzz это C++, надо убирать за собой)
        buf.destroy();
        hbFont.destroy();
        hbFace.destroy();
        hbBlob.destroy();

        if (!cancelled) setGlyphs(out);

      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e.message);
      }
    })();

    return () => { cancelled = true; };
  }, [text, fontUrl, fontSize, padding]);

  // Вычисляем границы SVG, чтобы камера смотрела ровно на текст
  const viewBox = useMemo(() => {
    if (!glyphs.length) return `0 0 800 300`;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    glyphs.forEach(g => {
        // bb может быть пустым для пробелов
        if (g.bb.x1 !== undefined) {
            minX = Math.min(minX, g.bb.x1);
            minY = Math.min(minY, g.bb.y1);
            maxX = Math.max(maxX, g.bb.x2);
            maxY = Math.max(maxY, g.bb.y2);
        }
    });

    // Если текст пустой или только пробелы
    if (minX === Infinity) return "0 0 800 300";

    const p = 20; // Небольшой запас вокруг
    const w = (maxX - minX) + p * 2;
    const h = (maxY - minY) + p * 2;

    return `${minX - p} ${minY - p} ${w} ${h}`;
  }, [glyphs]);

  if (error) return <div className="text-red-500 text-xs">Error: {error}</div>;

  return (
    <div className="w-full flex justify-center">
      <svg
        width="100%"
        height="300" // Высота контейнера SVG
        viewBox={viewBox}
        style={{ overflow: "visible", maxWidth: "800px" }}
        onPointerDown={() => setSelected(null)} // Сброс при клике в пустоту
      >
        {glyphs.map((g, idx) => {
          const isSelected = selected === idx;
          return (
            <g key={idx} style={{ cursor: "pointer" }}>

              {/* СЛОЙ 1: СВЕЧЕНИЕ (Только если выбран) */}
              {isSelected && (
                <path
                  d={g.d}
                  fill="none"
                  stroke="#06b6d4" // Cyan-500
                  strokeWidth={fontSize * 0.05} // Толщина зависит от размера шрифта
                  style={{
                    filter: "drop-shadow(0 0 15px rgba(6,182,212, 0.8))",
                    transition: "all 0.3s ease"
                  }}
                  pointerEvents="none"
                />
              )}

              {/* СЛОЙ 2: САМ ГЛИФ (Белый текст) */}
              {/* pointer-events="visiblePainted" означает, что клик проходит
                  только по закрашенной части буквы! Идеальный хит-тест. */}
              <path
                d={g.d}
                fill={isSelected ? "#06b6d4" : "white"}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelected(idx);
                  console.log(`Clicked glyph index: ${idx}, ID: ${g.gid}`);
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