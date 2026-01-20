import React from 'react';

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

export function useFontFace(fontUrl) {
  const [family, setFamily] = React.useState('');

  React.useEffect(() => {
    let active = true;

    if (!fontUrl || typeof FontFace === 'undefined' || typeof document === 'undefined') {
      setFamily('');
      return () => {
        active = false;
      };
    }

    const cached = fontFaceCache.get(fontUrl);
    const familyName = cached?.family ?? getFontFamilyName(fontUrl);
    const loadPromise = cached?.promise ?? (() => {
      const fontFace = new FontFace(familyName, `url("${fontUrl}")`);
      const promise = fontFace.load().then((loadedFace) => {
        document.fonts.add(loadedFace);
        return loadedFace;
      });
      fontFaceCache.set(fontUrl, { family: familyName, promise });
      return promise;
    })();

    loadPromise
      .then(() => {
        if (!active) return;
        setFamily(familyName);
      })
      .catch(() => {
        if (!active) return;
        setFamily('');
      });

    return () => {
      active = false;
    };
  }, [fontUrl]);

  return family;
}
