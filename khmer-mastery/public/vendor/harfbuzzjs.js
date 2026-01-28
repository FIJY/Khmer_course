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
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

export default async function harfbuzzjs(options = {}) {
  await loadScriptOnce("/vendor/hb.js");
  await loadScriptOnce("/vendor/hbjs.js");

  const hbModuleFactory = window.Module;
  const hbjsFactory = window.hbjs || window.harfbuzzjs;

  if (typeof hbModuleFactory !== "function" || typeof hbjsFactory !== "function") {
    throw new Error("HarfBuzz scripts loaded but factories are missing on window");
  }

  const hbModule = await hbModuleFactory({
    ...options,
    locateFile: (path) => `/vendor/${path}`,
  });

  return hbjsFactory(hbModule);
}
