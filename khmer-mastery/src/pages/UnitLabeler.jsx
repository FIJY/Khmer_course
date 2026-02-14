// src/pages/UnitLabeler.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useKhmerShaper } from "../hooks/useKhmerShaper";
import { buildUnits } from "../lib/khmerUnitParser";
import { getKhmerGlyphColor } from "../lib/khmerGlyphRenderer";

const DEFAULT_TEXT = "កម្ពុជា";

function unionBBox(glyphs) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const g of glyphs || []) {
    if (!g.bb) continue;
    minX = Math.min(minX, g.bb.x1);
    minY = Math.min(minY, g.bb.y1);
    maxX = Math.max(maxX, g.bb.x2);
    maxY = Math.max(maxY, g.bb.y2);
  }
  if (!Number.isFinite(minX)) return null;
  return { x1: minX, y1: minY, x2: maxX, y2: maxY };
}

function bbArea(bb) {
  return bb ? Math.max(0, bb.x2 - bb.x1) * Math.max(0, bb.y2 - bb.y1) : 0;
}

// функция проверки точки в полигоне (ray casting)
function pointInPolygon(point, polygon) {
  const { x, y } = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function UnitLabeler() {
  const { ready, error, shape } = useKhmerShaper();
  const [text, setText] = useState(DEFAULT_TEXT);
  const [glyphs, setGlyphs] = useState([]);
  const [splitGlyphs, setSplitGlyphs] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedGlyphIds, setSelectedGlyphIds] = useState(new Set());
  const [currentUnitId, setCurrentUnitId] = useState(null);
  const [newUnitKind, setNewUnitKind] = useState("consonant");
  const [newUnitSound, setNewUnitSound] = useState("");
  const [mode, setMode] = useState("select"); // 'select' или 'draw'
  const [drawingPoints, setDrawingPoints] = useState([]);
  const svgRef = useRef(null);
  const audioRef = useRef(null);

  // Загрузка шейпинга
  useEffect(() => {
    if (!ready) return;
    const load = async () => {
      try {
        const normal = await shape(text);
        const split = await shape(text, { mode: 'split' });
        setGlyphs(normal);
        setSplitGlyphs(split);
      } catch (err) {
        console.error("Shape error:", err);
      }
    };
    load();
  }, [ready, shape, text]);

  // Группировка split-глифов по кластеру
  const splitGlyphsByCluster = useMemo(() => {
    const map = new Map();
    splitGlyphs.forEach(g => {
      const key = g.cluster;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(g);
    });
    return map;
  }, [splitGlyphs]);

  // Преобразование точки клика
  const svgPointFromEvent = (e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    return pt.matrixTransform(ctm.inverse());
  };

  // Обработка клика на SVG
  const handleSvgClick = (e) => {
    const p = svgPointFromEvent(e);
    if (!p) return;

    if (mode === 'draw' && currentUnitId) {
      // В режиме рисования добавляем точку к текущему полигону
      setDrawingPoints(prev => [...prev, [p.x, p.y]]);
      return;
    }

    // В режиме выбора ищем split-глиф
    let hitGlyph = null;
    for (const g of splitGlyphs) {
      const pathEl = document.getElementById(`split-${g.id}`);
      if (pathEl && pathEl.isPointInFill(p)) {
        hitGlyph = g;
        break;
      }
    }
    if (!hitGlyph) return;

    if (e.shiftKey) {
      setSelectedGlyphIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(hitGlyph.id)) {
          newSet.delete(hitGlyph.id);
        } else {
          newSet.add(hitGlyph.id);
        }
        return newSet;
      });
    } else {
      setSelectedGlyphIds(new Set([hitGlyph.id]));
    }
  };

  // Завершение полигона
  const finishPolygon = () => {
    if (drawingPoints.length < 3 || !currentUnitId) {
      alert('Нужно хотя бы 3 точки');
      return;
    }
    setUnits(prev => prev.map(u => {
      if (u.id === currentUnitId) {
        const polygons = u.polygons || [];
        return { ...u, polygons: [...polygons, drawingPoints] };
      }
      return u;
    }));
    setDrawingPoints([]);
  };

  // Отмена рисования
  const cancelDrawing = () => {
    setDrawingPoints([]);
    setMode('select');
  };

  // Создание юнита
  const createUnit = () => {
    if (selectedGlyphIds.size === 0) return;

    const selected = splitGlyphs.filter(g => selectedGlyphIds.has(g.id));
    const sorted = [...selected].sort((a, b) => a.cluster - b.cluster);
    const text = sorted.map(g => g.chars?.[0] || g.char).join('');
    const minCluster = Math.min(...selected.map(g => g.cluster));
    const maxCluster = Math.max(...selected.map(g => g.cluster));
    const indices = [];
    for (let i = minCluster; i <= maxCluster; i++) {
      if (splitGlyphsByCluster.has(i)) indices.push(i);
    }

    const newUnit = {
      id: `manual_${Date.now()}`,
      kind: newUnitKind,
      text: text,
      sound: newUnitSound || text[0] || '',
      indices: indices,
      glyphIds: Array.from(selectedGlyphIds),
      polygons: [], // массив полигонов
    };
    setUnits([...units, newUnit]);
    setSelectedGlyphIds(new Set());
    setNewUnitSound('');
    setCurrentUnitId(newUnit.id); // сразу начинаем редактирование
    setMode('draw');
  };

  const deleteUnit = (unitId) => {
    setUnits(units.filter(u => u.id !== unitId));
    if (currentUnitId === unitId) {
      setCurrentUnitId(null);
      setMode('select');
      setDrawingPoints([]);
    }
  };

  const deletePolygon = (unitId, polyIndex) => {
    setUnits(prev => prev.map(u => {
      if (u.id === unitId) {
        const polygons = u.polygons || [];
        return { ...u, polygons: polygons.filter((_, i) => i !== polyIndex) };
      }
      return u;
    }));
  };

  const clearSelection = () => setSelectedGlyphIds(new Set());

  const exportUnits = () => {
    const dataStr = JSON.stringify(units, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `units_${text}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importUnits = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        setUnits(json);
      } catch (err) {
        alert('Invalid JSON');
      }
    };
    reader.readAsText(file);
  };

  // Авто-юниты (для справки)
  const autoUnits = useMemo(() => {
    return buildUnits(text, []);
  }, [text]);

  // Bounding box и viewBox
  const bbox = useMemo(() => unionBBox(glyphs), [glyphs]);
  const viewBox = useMemo(() => {
    if (!bbox) return "0 0 300 300";
    const pad = 90;
    return `${bbox.x1 - pad} ${bbox.y1 - pad} ${(bbox.x2 - bbox.x1) + pad * 2} ${(bbox.y2 - bbox.y1) + pad * 2}`;
  }, [bbox]);

  if (error) {
    return <div className="p-8 text-red-400">Error: {error}</div>;
  }
  if (!ready) {
    return <div className="p-8 text-white/60">Loading...</div>;
  }

  return (
    <div className="p-8 space-y-5 text-white">
      <h1 className="text-2xl font-bold">Unit Labeler (Polygon mode)</h1>
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="bg-gray-800 border border-white/10 rounded px-3 py-2 w-[240px]"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="px-3 py-2 bg-gray-700 rounded" onClick={clearSelection}>
          Clear Selection
        </button>
        <button className="px-3 py-2 bg-blue-600 rounded" onClick={createUnit}>
          Create Unit
        </button>
        <button className="px-3 py-2 bg-green-600 rounded" onClick={exportUnits}>
          Export JSON
        </button>
        <label className="px-3 py-2 bg-purple-600 rounded cursor-pointer">
          Import JSON
          <input type="file" accept=".json" onChange={importUnits} className="hidden" />
        </label>
        <div className="text-sm">
          Selected: {selectedGlyphIds.size} glyphs
        </div>
        <div className="text-sm">
          Mode: {mode} {currentUnitId && `(editing: ${currentUnitId})`}
        </div>
        {mode === 'draw' && (
          <>
            <button className="px-3 py-2 bg-yellow-600 rounded" onClick={finishPolygon}>
              Finish Polygon
            </button>
            <button className="px-3 py-2 bg-gray-600 rounded" onClick={cancelDrawing}>
              Cancel
            </button>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <label className="flex items-center gap-2">
          Kind:
          <select
            className="bg-gray-800 border rounded px-2 py-1"
            value={newUnitKind}
            onChange={(e) => setNewUnitKind(e.target.value)}
          >
            <option value="consonant">Consonant</option>
            <option value="vowel">Vowel</option>
            <option value="subscript">Subscript</option>
            <option value="mark">Mark</option>
            <option value="coeng">Coeng</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          Sound:
          <input
            className="bg-gray-800 border rounded px-2 py-1 w-24"
            value={newUnitSound}
            onChange={(e) => setNewUnitSound(e.target.value)}
            placeholder="e.g. ក"
          />
        </label>
      </div>

      <div className="bg-gray-800 p-5 rounded-lg">
        <svg
          ref={svgRef}
          viewBox={viewBox}
          className="w-full max-h-[400px]"
          style={{ background: "#111" }}
          onClick={handleSvgClick}
          onDoubleClick={() => mode === 'draw' && finishPolygon()} // двойной клик завершает полигон
        >
          {/* Фон normal-глифы */}
          {glyphs.map((g) => (
            <path
              key={`bg-${g.id}`}
              d={g.d}
              fill="rgba(148,163,184,0.08)"
              stroke="none"
              pointerEvents="none"
            />
          ))}

          {/* Split-глифы (полупрозрачные) */}
          {splitGlyphs.map((g) => {
            const isSelected = selectedGlyphIds.has(g.id);
            return (
              <path
                key={`split-${g.id}`}
                id={`split-${g.id}`}
                d={g.d}
                fill={isSelected ? "rgba(255,255,0,0.3)" : "transparent"}
                stroke={isSelected ? "yellow" : "none"}
                strokeWidth="2"
                pointerEvents="all"
                style={{ cursor: "pointer" }}
              />
            );
          })}

          {/* Отрисовка полигонов для всех юнитов */}
          {units.map((unit) => {
            if (!unit.polygons) return null;
            return unit.polygons.map((poly, idx) => (
              <polygon
                key={`poly-${unit.id}-${idx}`}
                points={poly.map(pt => pt.join(',')).join(' ')}
                fill="none"
                stroke={unit.id === currentUnitId ? "#ffaa00" : "#00ffaa"}
                strokeWidth="2"
                strokeDasharray={unit.id === currentUnitId ? "none" : "4"}
                pointerEvents="none"
              />
            ));
          })}

          {/* Точки текущего полигона */}
          {mode === 'draw' && drawingPoints.map((pt, idx) => (
            <circle
              key={`pt-${idx}`}
              cx={pt[0]}
              cy={pt[1]}
              r="3"
              fill="yellow"
              pointerEvents="none"
            />
          ))}

          {/* Контуры normal-глифов */}
          {glyphs.map((g) => (
            <path
              key={`outline-${g.id}`}
              d={g.d}
              fill="transparent"
              stroke="rgba(148,163,184,0.3)"
              strokeWidth="1.5"
              pointerEvents="none"
            />
          ))}
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-bold mb-2">Auto Units</h2>
          {autoUnits.map((unit) => (
            <div key={unit.id} className="border-l-4 border-blue-500 pl-2 mb-2 text-sm">
              <div><strong>{unit.id}</strong> ({unit.kind}) "{unit.text}"</div>
              <div className="text-gray-400">indices: [{unit.indices?.join(', ')}]</div>
            </div>
          ))}
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-bold mb-2">Manual Units</h2>
          {units.map((unit) => (
            <div key={unit.id} className="border-l-4 border-green-500 pl-2 mb-2 text-sm">
              <div className="flex justify-between items-start">
                <div>
                  <strong>{unit.id}</strong> ({unit.kind}) "{unit.text}"
                  {unit.sound && <span> sound: "{unit.sound}"</span>}
                </div>
                <button
                  className="text-red-400 hover:text-red-300 text-xs"
                  onClick={() => deleteUnit(unit.id)}
                >
                  delete
                </button>
              </div>
              <div className="text-gray-400">indices: [{unit.indices?.join(', ')}]</div>
              <div className="text-gray-500 text-xs">glyphs: {unit.glyphIds?.join(', ')}</div>
              <div className="mt-1">
                {unit.polygons?.map((poly, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span>Polygon {idx+1} ({poly.length} pts)</span>
                    <button
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deletePolygon(unit.id, idx)}
                    >
                      delete
                    </button>
                  </div>
                ))}
              </div>
              {unit.id === currentUnitId && mode === 'draw' && (
                <div className="text-yellow-400 text-xs mt-1">Editing polygons...</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-400">
        <p><strong>Инструкция:</strong></p>
        <p>1. Выберите глифы (Shift+клик для множественного).</p>
        <p>2. Нажмите "Create Unit" – создастся юнит, и вы перейдёте в режим рисования полигонов для него.</p>
        <p>3. Кликайте по SVG, чтобы добавлять точки полигона. Двойной клик или кнопка "Finish Polygon" завершают полигон.</p>
        <p>4. Можно создавать несколько полигонов для одного юнита (например, для разрозненных частей).</p>
        <p>5. Экспорт сохраняет JSON с полигонами. В VisualDecoder они будут использоваться для хит-теста.</p>
      </div>
    </div>
  );
}