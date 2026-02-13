// server.cjs - ИСПРАВЛЕННАЯ ГРУППИРОВКА
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not initialized yet" });

  try {
    const scale = FONT_SIZE / unitsPerEm;

    console.log("\n=== SHAPING:", text);

    // 1. Шейпим ВЕСЬ текст сразу
    const run = fkFont.layout(text);
    console.log(`Fontkit layout: ${run.glyphs.length} глифов`);

    // 2. Группируем глифы в кластеры по ПОЗИЦИЯМ!
    const clusters = [];
    let currentCluster = [];
    let lastX = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const pos = run.positions[i];

      // КЛЮЧЕВОЕ: Новый кластер только если xAdvance > 0 И это не диакритика
      // Для кхмерского: гласные и подписные имеют xAdvance = 0
      if (pos.xAdvance > 1 && currentCluster.length > 0) {
        clusters.push([...currentCluster]);
        currentCluster = [];
      }

      currentCluster.push({ glyph, pos });
    }

    // Добавляем последний кластер
    if (currentCluster.length > 0) {
      clusters.push([...currentCluster]);
    }

    console.log(`📦 Сгруппировано в ${clusters.length} кластеров:`);

    // 3. Собираем исходные символы для каждого кластера
    const glyphsData = [];
    let cursorX = 50;

    clusters.forEach((cluster, idx) => {
      // Собираем ВСЕ символы из кластера
      let clusterChars = '';
      let isConsonant = false;
      let isVowel = false;
      let isSubscript = false;
      let isDiacritic = false;

      // Проходим по глифам и собираем символы
      cluster.forEach(({ glyph }) => {
        if (glyph.codePoints && glyph.codePoints.length > 0) {
          const codePoint = glyph.codePoints[0];
          const char = String.fromCodePoint(codePoint);
          clusterChars += char;

          // Определяем типы
          if (codePoint >= 0x1780 && codePoint <= 0x17A2) isConsonant = true;
          else if (codePoint >= 0x17B6 && codePoint <= 0x17C5) isVowel = true;
          else if (codePoint === 0x17D2) isSubscript = true;
          else if (codePoint >= 0x17C6 && codePoint <= 0x17D1) isDiacritic = true;
        }
      });

      // Если не удалось собрать символы, берем из исходного текста
      if (!clusterChars) {
        clusterChars = text[idx] || '?';
      }

      // Отрисовываем ВСЕ глифы кластера ВМЕСТЕ
      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let maxAdvance = 0;

      cluster.forEach(({ glyph, pos }) => {
        const otGlyph = otFont.glyphs.get(glyph.id);

        // Важно: используем cursorX ДЛЯ ВСЕХ глифов кластера!
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
        char: clusterChars, // ВЕСЬ кластер как строка!
        d: paths.join(" "),
        bb: {
          x1: minX === Infinity ? cursorX : minX,
          y1: minY === Infinity ? 0 : minY,
          x2: maxX === -Infinity ? cursorX + 50 : maxX,
          y2: maxY === -Infinity ? 200 : maxY
        },
        isConsonant,
        isVowel,
        isSubscript,
        isDiacritic,
        glyphCount: cluster.length
      });

      console.log(`  Кластер ${idx}: "${clusterChars}" → ${cluster.length} глифов`);

      // Сдвигаем курсор ТОЛЬКО на xAdvance последнего глифа
      cursorX += maxAdvance;
    });

    console.log(`\n✅ Всего кластеров: ${glyphsData.length}`);
    res.json(glyphsData);

  } catch (err) {
    console.error("Shape error:", err);
    res.status(500).json({ error: err.message });
  }
});