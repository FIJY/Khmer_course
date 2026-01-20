function loadScriptOnce(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-hb="${src}"]`)) {
      resolve();
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.hb = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load HarfBuzz UMD"));
    document.head.appendChild(s);
  });
}

export default async function harfbuzzjs(options = {}) {
  await loadScriptOnce("/vendor/harfbuzzjs.umd.js");

  const factory =
    window.hbjs ||
    window.harfbuzzjs ||
    window.Module;

  if (typeof factory !== "function") {
    throw new Error(
      "HarfBuzz loaded but did not expose a factory function on window"
    );
  }

  return factory({
    ...options,
    locateFile: (path) => `/vendor/${path}`,
  });
}
