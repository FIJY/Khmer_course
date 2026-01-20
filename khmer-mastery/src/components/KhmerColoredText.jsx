import React from 'react';
import { renderColoredKhmerToSvg, khmerGlyphDefaults } from '../lib/khmerGlyphRenderer';
import { useFontFace } from '../hooks/useFontFace';

const KHMER_PATTERN = /[\u1780-\u17ff]/;

const DEFAULT_COLORS = {
  CONSONANT_A: '#ffb020',
  CONSONANT_O: '#6b5cff',
  SUBSCRIPT: '#6a7b9c',
  VOWEL_DEP: '#ff4081',
  VOWEL_IND: '#ffd54a',
  DIACRITIC_BANTOC: '#ffffff',
  DIACRITIC_SERIES_SWITCH: '#ffffff',
  DIACRITIC_OTHER: '#ffffff',
  NUMERAL: '#38d6d6',
  PUNCT: '#6a7b9c',
  REPEAT: '#6a7b9c',
  OTHER: '#ffffff',
};

const fontFaceCache = new Map();

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function getFontFamilyName(url) {
  return `KhmerGlyphFallback-${hashString(url)}`;
}

export default function KhmerColoredText({
  text,
  fontUrl = '',
  fontSize = 96,
  colors,
  className,
  seriesOverrides = khmerGlyphDefaults.DEFAULT_SERIES_OVERRIDES,
  diacriticOverrides = khmerGlyphDefaults.DEFAULT_DIACRITIC_GROUPS,
  moduleUrls = khmerGlyphDefaults.DEFAULT_MODULE_URLS,
  onStatus,
}) {
  const [svgMarkup, setSvgMarkup] = React.useState('');
  const fallbackFontFamily = useFontFace(fontUrl);
  const cacheRef = React.useRef(new Map());

  React.useEffect(() => {
    let active = true;

    if (!fontUrl || typeof FontFace === 'undefined' || typeof document === 'undefined') {
      setFallbackFontFamily('');
      return () => {
        active = false;
      };
    }

    const family = getFontFamilyName(fontUrl);
    const cached = fontFaceCache.get(fontUrl);
    const loadPromise = cached?.promise ?? (() => {
      const fontFace = new FontFace(family, `url("${fontUrl}")`);
      const promise = fontFace.load().then((loadedFace) => {
        document.fonts.add(loadedFace);
        return loadedFace;
      });
      fontFaceCache.set(fontUrl, { family, promise });
      return promise;
    })();

    loadPromise
      .then(() => {
        if (!active) return;
        setFallbackFontFamily(family);
      })
      .catch(() => {
        if (!active) return;
        setFallbackFontFamily('');
      });

    return () => {
      active = false;
    };
  }, [fontUrl]);

  React.useEffect(() => {
    let cancelled = false;

    if (!text || !fontUrl || !KHMER_PATTERN.test(text)) {
      setSvgMarkup('');
      if (onStatus) onStatus({ state: 'fallback', reason: 'missing-input' });
      return () => {
        cancelled = true;
      };
    }

    const mergedColors = { ...DEFAULT_COLORS, ...(colors ?? {}) };
    const cacheKey = `${fontUrl}|${fontSize}|${text}|${JSON.stringify(mergedColors)}|${JSON.stringify(seriesOverrides)}|${JSON.stringify(diacriticOverrides)}|${JSON.stringify(moduleUrls)}`;

    if (cacheRef.current.has(cacheKey)) {
      setSvgMarkup(cacheRef.current.get(cacheKey));
      if (onStatus) onStatus({ state: 'rendered', reason: 'cache' });
      return () => {
        cancelled = true;
      };
    }

    if (onStatus) onStatus({ state: 'loading' });

    renderColoredKhmerToSvg({
      text,
      fontUrl,
      fontSize,
      colors: mergedColors,
      seriesOverrides,
      diacriticOverrides,
      moduleUrls,
    })
      .then((svg) => {
        if (cancelled) return;
        if (!svg) {
          setSvgMarkup('');
          if (onStatus) onStatus({ state: 'fallback', reason: 'empty-svg' });
          return;
        }
        cacheRef.current.set(cacheKey, svg);
        setSvgMarkup(svg);
        if (onStatus) onStatus({ state: 'rendered' });
      })
      .catch((error) => {
        console.error('Khmer colored rendering failed:', error);
        if (!cancelled) {
          setSvgMarkup('');
          if (onStatus) onStatus({ state: 'error', reason: error?.message ?? 'render-failed' });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [text, fontUrl, fontSize, colors, seriesOverrides, diacriticOverrides, moduleUrls]);

  if (!svgMarkup) {
    return (
      <span
        className={className}
        style={{
          fontSize,
          lineHeight: 1.1,
          fontFamily: fallbackFontFamily ? `"${fallbackFontFamily}", sans-serif` : undefined,
        }}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={className}
      role="img"
      aria-label={text}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
    />
  );
}
