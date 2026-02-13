// server.cjs - ИСПРАВЛЕННАЯ ВЕРСИЯ
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not initialized yet" });

  try {
    const scale = FONT_SIZE / unitsPerEm;

    // 1. Шейпим ВСЁ сразу
    const run = fkFont.layout(text);

    // 2. Группируем в кластеры (по смещениям xAdvance)
    const clusters = [];
    let currentCluster = [];
    let lastAdvance = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i];

      // Новый кластер если:
      // - Есть значительный xAdvance (>0) И это не первый глиф
      // - Или глиф не должен прикрепляться к предыдущему
      if (pos.xAdvance > 5 && currentCluster.length > 0) {
        clusters.push(currentCluster);
        currentCluster = [];
      }

      currentCluster.push({ glyph, pos });
    }
    if (currentCluster.length > 0) {
      clusters.push(currentCluster);
    }

    console.log(`Text: "${text}" → ${run.glyphs.length} глифов → ${clusters.length} кластеров`);

    // 3. Отрисовываем кластеры
    const glyphsData = [];
    let cursorX = 50;

    clusters.forEach((cluster, idx) => {
      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let maxAdvance = 0;

      cluster.forEach(({ glyph, pos }) => {
        const otGlyph = otFont.glyphs.get(glyph.id);

        // Важно: yOffset может быть отрицательным (диакритика над буквой)
        const x = cursorX + (pos.xOffset || 0) * scale;
        const y = 200 - (pos.yOffset || 0) * scale;

        const path = otGlyph.getPath(x, y, FONT_SIZE);
        paths.push(path.toPathData(3));

        const bb = path.getBoundingBox();
        minX = Math.min(minX, bb.x1);
        minY = Math.min(minY, bb.y1);
        maxX = Math.max(maxX, bb.x2);
        maxY = Math.max(maxY, bb.y2);

        maxAdvance = Math.max(maxAdvance, pos.xAdvance * scale);
      });

      glyphsData.push({
        id: idx,
        char: text[idx] || '?', // приблизительно
        d: paths.join(' '),
        bb: {
          x1: minX === Infinity ? 0 : minX,
          y1: minY === Infinity ? 0 : minY,
          x2: maxX === -Infinity ? 0 : maxX,
          y2: maxY === -Infinity ? 0 : maxY
        }
      });

      cursorX += maxAdvance || 50; // если нет advance - используем дефолт
    });

    res.json(glyphsData);

  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});