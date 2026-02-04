const DEFAULT_HIGHLIGHT_CONFIG = Object.freeze({
  highlightMode: "series",
  selectionStyle: "outline",
});

let currentConfig = { ...DEFAULT_HIGHLIGHT_CONFIG };

export const getKhmerGlyphHighlightConfig = () => currentConfig;

export const setKhmerGlyphHighlightConfig = (nextConfig = {}) => {
  currentConfig = { ...currentConfig, ...nextConfig };
};

export const resetKhmerGlyphHighlightConfig = () => {
  currentConfig = { ...DEFAULT_HIGHLIGHT_CONFIG };
};

export const getDefaultKhmerGlyphHighlightConfig = () => ({
  ...DEFAULT_HIGHLIGHT_CONFIG,
});
