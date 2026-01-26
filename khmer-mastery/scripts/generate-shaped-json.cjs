/* scripts/generate-shaped-json.cjs */
const fs = require("fs");
const path = require("path");
const opentype = require("opentype.js");

// ⚠️ путь к шрифту (проверь, что файл реально существует)
const FONT_PATH = path.resolve(__dirname, "../public/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf");

// куда сохранить JSON
const OUT_PATH = path.resolve(__dirname, "../src/data/shaped-words.json");

// список слов
const WORDS_PATH = path.resolve(__dirname, "../src/data/words-to-shape.txt");

// --- HarfBuzz (Node) ---
async function loadHB() {
  // В Node можно грузить harfbuzzjs обычным require.
  // У разных сборок имя фабрики отличается, поэтому делаем “умный” загрузчик.
  const hbPkg = require("harfbuzzjs");

  // Вариант A: пакет сам возвращает async factory (часто так)
  if (typeof hbPkg === "function") return await hbPkg();

  // Вариант B: пакет возвращает объект с hbjs()
  if (hbPkg && typeof hbPkg.hbjs === "function") return await hbPkg.hbjs();

  // Вариант C: пакет возвращает уже готовый модуль
  if (hbPkg && hbPkg._hb_shape) return hbPkg;

  throw new Error("Не удалось инициализировать harfbuzzjs в Node. Покажи содержимое node_modules/harfbuzzjs/package.json и index.js.");
}

// helper: utf-8 bytes
function utf8Bytes(str) {
  return Buffer.from(str, "utf8");
}

async function main() {
  const words = fs
    .readFileSync(WORDS_PATH, "utf8")
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);

  if (!words.length) {
    console.log("words-to-shape.txt пустой");
    process.exit(0);
  }

  if (!fs.existsSync(FONT_PATH)) {
    throw new Error("Font not found: " + FONT_PATH);
  }

  const hb = await loadHB();
  const fontBytes = fs.readFileSync(FONT_PATH);

  // OpenType для контуров
  const otFont = opentype.parse(fontBytes.buffer.slice(fontBytes.byteOffset, fontBytes.byteOffset + fontBytes.byteLength));

  // HarfBuzz face/font
  const blob = hb._hb_blob_create(fontBytes, fontBytes.length, 2, 0, 0);
  const face = hb._hb_face_create(blob, 0);
  const hbFont = hb._hb_font_create(face);
  const upem = hb._hb_face_get_upem(face);

  // масштабируем HarfBuzz в font units (оставляем 1:1 в units, потом сами считаем позиции)
  hb._hb_font_set_scale(hbFont, upem, upem);

  const shaped = {};

  for (const text of words) {
    const buf = hb._hb_buffer_create();

    // добавить текст как utf-8
    const bytes = utf8Bytes(text);
    const ptr = hb._malloc(bytes.length);
    hb.HEAPU8.set(bytes, ptr);
    hb._hb_buffer_add_utf8(buf, ptr, bytes.length, 0, bytes.length);
    hb._free(ptr);

    hb._hb_buffer_guess_segment_properties(buf);

    hb._hb_shape(hbFont, buf, 0, 0);

    const len = hb._hb_buffer_get_length(buf);
    const infosPtr = hb._hb_buffer_get_glyph_infos(buf, 0);
    const posPtr = hb._hb_buffer_get_glyph_positions(buf, 0);

    // структуры HarfBuzz:
    // hb_glyph_info_t: 20 bytes (в этой сборке часто 20)
    // hb_glyph_position_t: 20 bytes (часто 20)
    // чтобы не гадать — читаем как int32 по известным смещениям (gid, cluster) и (x_advance, y_advance, x_offset, y_offset)
    // В harfbuzzjs обычно:
    // info: [codepoint(uint32), mask(uint32), cluster(uint32), var1, var2]
    // pos:  [x_advance(int32), y_advance(int32), x_offset(int32), y_offset(int32), var]
    const infos = [];
    const positions = [];

    for (let i = 0; i < len; i++) {
      const infoBase = infosPtr / 4 + i * 5;
      const gid = hb.HEAPU32[infoBase + 0];
      const cluster = hb.HEAPU32[infoBase + 2];

      const posBase = posPtr / 4 + i * 5;
      const xAdvance = hb.HEAP32[posBase + 0];
      const yAdvance = hb.HEAP32[posBase + 1];
      const xOffset = hb.HEAP32[posBase + 2];
      const yOffset = hb.HEAP32[posBase + 3];

      infos.push({ gid, cluster });
      positions.push({ xAdvance, yAdvance, xOffset, yOffset });
    }

    // теперь строим SVG path’ы через opentype, используя gid + позицию
    let penX = 0;
    let penY = 0;

    const glyphs = [];

    for (let i = 0; i < len; i++) {
      const { gid, cluster } = infos[i];
      const { xAdvance, yAdvance, xOffset, yOffset } = positions[i];

      // HarfBuzz positions в 26.6 формате (обычно). Делим на 64.
      const ox = xOffset / 64;
      const oy = yOffset / 64;

      // glyph from gid
      const g = otFont.glyphs.get(gid);
      if (!g) continue;

      const x = penX + ox;
      const y = penY - oy; // y в opentype вверх, в svg вниз — мы просто консистентно держим систему, дальше viewBox всё съест

      const p = g.getPath(x, 0, 1); // size=1, потому что мы в font units
      const bb = p.getBoundingBox();

      // пропускаем “пустые”
      if (bb.x1 === bb.x2 || bb.y1 === bb.y2) {
        penX += xAdvance / 64;
        penY += yAdvance / 64;
        continue;
      }

      glyphs.push({
        gid,
        cluster,
        d: p.toPathData(3),
        bb: { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 },
      });

      penX += xAdvance / 64;
      penY += yAdvance / 64;
    }

    shaped[text] = glyphs;

    hb._hb_buffer_destroy(buf);
  }

  // cleanup HB
  hb._hb_font_destroy(hbFont);
  hb._hb_face_destroy(face);
  hb._hb_blob_destroy(blob);

  fs.writeFileSync(OUT_PATH, JSON.stringify(shaped, null, 2), "utf8");
  console.log("✅ wrote", OUT_PATH, "words:", Object.keys(shaped).length);
}

main().catch((e) => {
  console.error("❌", e);
  process.exit(1);
});
