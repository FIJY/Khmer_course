// server.cjs (исправленная версия)
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not initialized yet" });

  try {
    const scale = FONT_SIZE / unitsPerEm;

    console.log("\n=== SHAPING:", text);

    // ✅ ПРАВИЛЬНО: Обрабатываем ВЕСЬ текст сразу
    const run = fkFont.layout(text);

    console.log(`Fontkit layout returned ${run.glyphs.length} glyphs`);

    const glyphsData = [];
    let cursorX = 50;
    let currentCluster = null;
    let clusterGlyphs = [];

    // Группируем глифы по кластерам (исходным символам)
    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const position = run.positions[i];
      const cluster = glyph.id; // или используйте glyph.cluster если доступно

      // Начало нового кластера
      if (i === 0 || cluster !== run.glyphs[i-1].id) {
        // Сохраняем предыдущий кластер
        if (clusterGlyphs.length > 0) {
          processCluster(clusterGlyphs, cursorX);
          cursorX += getClusterAdvance(clusterGlyphs) * scale;
        }
        clusterGlyphs = [];
      }

      clusterGlyphs.push({ glyph, position });
    }

    // Обрабатываем последний кластер
    if (clusterGlyphs.length > 0) {
      processCluster(clusterGlyphs, cursorX);
    }

    function processCluster(glyphs, baseX) {
      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let firstGlyph = true;
      let charCode = null;

      // Получаем исходный символ (если возможно)
      if (glyphs[0].glyph.codePoints && glyphs[0].glyph.codePoints.length > 0) {
        charCode = glyphs[0].glyph.codePoints[0];
      }

      for (const { glyph: fkGlyph, position } of glyphs) {
        const otGlyph = otFont.glyphs.get(fkGlyph.id);

        // Координаты с учетом смещений
        const x = baseX + position.xOffset * scale;
        const y = 200 - position.yOffset * scale;

        const path = otGlyph.getPath(x, y, FONT_SIZE);
        const d = path.toPathData(3);

        if (d && d.length > 5) {
          paths.push(d);

          const bb = path.getBoundingBox();
          minX = Math.min(minX, bb.x1);
          minY = Math.min(minY, bb.y1);
          maxX = Math.max(maxX, bb.x2);
          maxY = Math.max(maxY, bb.y2);
        }
      }

      if (paths.length > 0) {
        glyphsData.push({
          id: glyphsData.length,
          char: charCode ? String.fromCodePoint(charCode) : '�',
          d: paths.join(" "),
          bb: { x1: minX, y1: minY, x2: maxX, y2: maxY },
          glyphCount: glyphs.length
        });

        console.log(`✅ Cluster ${glyphsData.length-1}: "${String.fromCodePoint(charCode || 32)}" -> ${glyphs.length} glyphs`);
      }
    }

    function getClusterAdvance(glyphs) {
      let advance = 0;
      for (const { position } of glyphs) {
        advance += position.xAdvance;
      }
      return advance;
    }

    console.log(`\n✅ Final: ${glyphsData.length} clickable clusters`);

    return res.json(glyphsData);
  } catch (err) {
    console.error("Shape error:", err);
    return res.status(500).json({ error: err.message });
  }
});