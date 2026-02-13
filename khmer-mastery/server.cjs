// server.cjs - С ВАШЕЙ КЛАССИФИКАЦИЕЙ + КЛАСТЕРНЫЙ ПОДХОД
app.get("/api/shape", (req, res) => {
  const text = req.query.text;
  if (!text) return res.status(400).json({ error: "No text provided" });
  if (!fkFont || !otFont) return res.status(503).json({ error: "Fonts not initialized yet" });

  try {
    const scale = FONT_SIZE / unitsPerEm;
    const textChars = Array.from(text);

    console.log("\n=== SHAPING:", text);
    console.log("Text characters:", textChars.length);

    // 1. Шейпим ВЕСЬ текст сразу (это критично!)
    const run = fkFont.layout(text);
    console.log(`Fontkit layout returned ${run.glyphs.length} glyphs`);

    // 2. Группируем глифы в кластеры (ваша логика определения типов)
    const clusters = [];
    let currentCluster = [];
    let clusterChars = [];
    let charIndex = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const glyph = run.glyphs[i];
      const position = run.positions[i];

      // Начинаем новый кластер при значительном xAdvance
      if (position.xAdvance > 5 && currentCluster.length > 0) {
        clusters.push({
          glyphs: currentCluster,
          chars: clusterChars,
          char: clusterChars.join('')
        });
        currentCluster = [];
        clusterChars = [];
        charIndex++;
      }

      currentCluster.push({ glyph, position });

      // Сохраняем исходный символ (если есть)
      if (glyph.codePoints && glyph.codePoints.length > 0) {
        const codePoint = glyph.codePoints[0];
        const char = String.fromCodePoint(codePoint);
        if (!clusterChars.includes(char)) {
          clusterChars.push(char);
        }
      }
    }

    // Последний кластер
    if (currentCluster.length > 0) {
      clusters.push({
        glyphs: currentCluster,
        chars: clusterChars,
        char: clusterChars.join('')
      });
    }

    console.log(`\n📦 Сгруппировано в ${clusters.length} кластеров:`);

    // 3. Отрисовываем кластеры с ВАШЕЙ классификацией
    const glyphsData = [];
    let cursorX = 50;

    clusters.forEach((cluster, idx) => {
      // ВАША ЛОГИКА определения типа
      let isConsonant = false;
      let isVowel = false;
      let isSubscript = false;
      let isDiacritic = false;

      // Определяем типы символов в кластере
      cluster.chars.forEach(char => {
        const code = char.codePointAt(0);
        // Кхмерские согласные: 0x1780-0x17A2
        if (code >= 0x1780 && code <= 0x17A2) isConsonant = true;
        // Гласные: 0x17B6-0x17C5
        else if (code >= 0x17B6 && code <= 0x17C5) isVowel = true;
        // Подписные: 0x17D2 + согласная
        else if (code === 0x17D2) isSubscript = true;
        // Диакритики: 0x17C6-0x17D1
        else if (code >= 0x17C6 && code <= 0x17D1) isDiacritic = true;
      });

      // Собираем пути
      const paths = [];
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      let totalAdvance = 0;

      cluster.glyphs.forEach(({ glyph, position }) => {
        const otGlyph = otFont.glyphs.get(glyph.id);

        // Координаты с учетом смещений
        const x = cursorX + (position.xOffset || 0) * scale;
        const y = 200 - (position.yOffset || 0) * scale;

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

        totalAdvance = Math.max(totalAdvance, (position.xAdvance || 0) * scale);
      });

      // ВАША структура данных
      glyphsData.push({
        id: idx,
        char: cluster.char || text[idx] || '?',
        d: paths.join(" "),
        bb: {
          x1: minX === Infinity ? cursorX : minX,
          y1: minY === Infinity ? 0 : minY,
          x2: maxX === -Infinity ? cursorX + 50 : maxX,
          y2: maxY === -Infinity ? 200 : maxY
        },
        // ВАША классификация
        isConsonant,
        isVowel,
        isSubscript,
        isDiacritic,
        glyphCount: cluster.glyphs.length
      });

      console.log(`  Кластер ${idx}: "${cluster.char}" → ${cluster.glyphs.length} глифов | Согл:${isConsonant}, Глас:${isVowel}, Подп:${isSubscript}, Диак:${isDiacritic}`);

      cursorX += totalAdvance || 50;
    });

    console.log(`\n✅ Итого: ${glyphsData.length} кликабельных кластеров`);
    return res.json(glyphsData);

  } catch (err) {
    console.error("Shape error:", err);
    return res.status(500).json({ error: err.message });
  }
});