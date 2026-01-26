async function initHarfBuzz() {
  console.log("🚀 ГЕНЕРАЦИЯ: Инициализация HarfBuzz (harfbuzzjs: hb.js + hbjs.js)...");

  const hbModuleFactory = require("harfbuzzjs/hb.js");   // emscripten module factory
  const wrapHb = require("harfbuzzjs/hbjs.js");          // API wrapper
  const wasmPath = require.resolve("harfbuzzjs/hb.wasm");

  const wasmBuffer = fs.readFileSync(wasmPath);
  console.log(`   WASM: ${wasmPath}`);

  // 1) Инициализируем emscripten Module
  const Module = await hbModuleFactory({
    wasmBinary: wasmBuffer,
    locateFile: (p) => p, // на всякий случай
  });

  // 2) Оборачиваем Module в удобный hb API
  const hb = wrapHb(Module);

  if (!hb || typeof hb.createBlob !== "function") {
    throw new Error("HarfBuzz init failed: нет hb.createBlob()");
  }

  console.log("✅ HarfBuzz готов!");
  return hb;
}
