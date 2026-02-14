// src/hooks/useKhmerShaper.js
import { useEffect, useRef, useState, useCallback } from "react";
import opentype from "opentype.js";

const FONT_SIZE = 120;

// hb_feature_t: 16 bytes (tag,value,start,end)
const HB_FEATURE_SIZE = 16;
const HB_FEATURE_END_ALL = 0xffffffff;

function hbTag(tag4) {
  const s = String(tag4 || "");
  if (s.length !== 4) throw new Error(`hbTag expects 4-char tag, got "${s}"`);
  return (
    ((s.charCodeAt(0) & 0xff) << 24) |
    ((s.charCodeAt(1) & 0xff) << 16) |
    ((s.charCodeAt(2) & 0xff) << 8) |
    (s.charCodeAt(3) & 0xff)
  ) >>> 0;
}

function writeHbFeature(hb, basePtr, idx, { tag, value, start = 0, end = HB_FEATURE_END_ALL }) {
  const p = basePtr + idx * HB_FEATURE_SIZE;
  hb.HEAPU32[(p + 0) >> 2] = hbTag(tag);
  hb.HEAPU32[(p + 4) >> 2] = (value >>> 0);
  hb.HEAPU32[(p + 8) >> 2] = (start >>> 0);
  hb.HEAPU32[(p + 12) >> 2] = (end >>> 0);
}

export function useKhmerShaper(fontUrl = "/fonts/KhmerOS_siemreap.ttf") {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  const hbRef = useRef(null);
  const blobRef = useRef(null);
  const faceRef = useRef(null);
  const fontRef = useRef(null);
  const fontDataPtrRef = useRef(null);

  const otFontRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      try {
        console.log("[init] Starting initialization...");

        const createHarfBuzz = await new Promise((resolve) => {
          const check = () => {
            if (window.createHarfBuzz) resolve(window.createHarfBuzz);
            else setTimeout(check, 50);
          };
          check();
        });

        const hb = await createHarfBuzz();
        if (!isMounted) return;
        hbRef.current = hb;

        console.log("[init] Fetching font:", fontUrl);
        const resp = await fetch(fontUrl);
        if (!resp.ok) throw new Error(`Font load error: ${resp.status}`);
        const arrayBuffer = await resp.arrayBuffer();

        if (!hb.HEAPU8) throw new Error("HEAPU8 not available");

        const dataPtr = hb._malloc(arrayBuffer.byteLength);
        if (!dataPtr) throw new Error("malloc failed");
        fontDataPtrRef.current = dataPtr;

        hb.HEAPU8.set(new Uint8Array(arrayBuffer), dataPtr);

        const blob = hb._hb_blob_create(dataPtr, arrayBuffer.byteLength, 1, 0, 0);
        if (!blob) throw new Error("Failed to create blob");
        blobRef.current = blob;

        const face = hb._hb_face_create(blob, 0);
        if (!face) throw new Error("Failed to create face");
        faceRef.current = face;

        const font = hb._hb_font_create(face);
        if (!font) throw new Error("Failed to create font");
        fontRef.current = font;

        hb._hb_font_set_scale(font, FONT_SIZE * 64, FONT_SIZE * 64);

        console.log("[init] Initializing OpenType.js...");
        const otFont = await new Promise((resolve, reject) => {
          opentype.load(fontUrl, (err, f) => (err ? reject(err) : resolve(f)));
        });

        if (!isMounted) return;
        otFontRef.current = otFont;

        setReady(true);
        console.log("[init] ✅ Ready!");
      } catch (err) {
        console.error("[init] Error:", err);
        setError(err?.message || String(err));
      }
    }

    init();

    return () => {
      isMounted = false;
      const hb = hbRef.current;
      if (!hb) return;

      try {
        if (fontRef.current) hb._hb_font_destroy(fontRef.current);
        if (faceRef.current) hb._hb_face_destroy(faceRef.current);
        if (blobRef.current) hb._hb_blob_destroy(blobRef.current);
        if (fontDataPtrRef.current) hb._free(fontDataPtrRef.current);
      } catch {
        // ignore
      }
    };
  }, [fontUrl]);

  const shape = useCallback(
    (text, options = {}) => {
      if (!ready || !hbRef.current || !fontRef.current || !otFontRef.current) {
        throw new Error("Shaper not ready");
      }

      const hb = hbRef.current;
      const hbFont = fontRef.current;
      const otFont = otFontRef.current;

      const buffer = hb._hb_buffer_create();
      if (!buffer) throw new Error("Failed to create buffer");

      const clusterLevel = options.clusterLevel ?? 0;
      hb._hb_buffer_set_cluster_level(buffer, clusterLevel);

      const encoder = new TextEncoder();
      const utf8 = encoder.encode(text);
      const textPtr = hb._malloc(utf8.length);
      hb.HEAPU8.set(utf8, textPtr);
      hb._hb_buffer_add_utf8(buffer, textPtr, utf8.length, 0, -1);
      hb._free(textPtr);

      hb._hb_buffer_guess_segment_properties(buffer);

      // --- FEATURES ---
      let featuresPtr = 0;
      let featuresCount = 0;

      const wantDisableLigatures = !!(options.disableLigatures);
      const wantDisableKhmerRequired = !!(options.disableKhmerRequired);
      const wantCustom = Array.isArray(options.features) && options.features.length > 0;

      const features = wantCustom
        ? options.features
        : (() => {
            const list = [];
            if (wantDisableLigatures) {
              list.push(
                { tag: "liga", value: 0 },
                { tag: "clig", value: 0 },
                { tag: "rlig", value: 0 }
              );
            }
            if (wantDisableKhmerRequired) {
              list.push(
                { tag: "ccmp", value: 0 },
                { tag: "pref", value: 0 },
                { tag: "blwf", value: 0 },
                { tag: "pstf", value: 0 },
                { tag: "abvf", value: 0 },
                { tag: "abvs", value: 0 },
                { tag: "pres", value: 0 },
                { tag: "psts", value: 0 }
              );
            }
            return list.length ? list : null;
          })();

      try {
        if (features && features.length > 0) {
          featuresCount = features.length;
          featuresPtr = hb._malloc(featuresCount * HB_FEATURE_SIZE);
          if (!featuresPtr) throw new Error("malloc failed for features");

          for (let i = 0; i < featuresCount; i++) {
            writeHbFeature(hb, featuresPtr, i, features[i]);
          }
        }

        hb._hb_shape(hbFont, buffer, featuresPtr, featuresCount);
      } finally {
        if (featuresPtr) hb._free(featuresPtr);
      }

      const length = hb._hb_buffer_get_length(buffer);
      if (length === 0) {
        hb._hb_buffer_destroy(buffer);
        return [];
      }

      const infosPtr = hb._hb_buffer_get_glyph_infos(buffer, 0);
      const positionsPtr = hb._hb_buffer_get_glyph_positions(buffer, 0);

      if (!infosPtr || !positionsPtr) {
        hb._hb_buffer_destroy(buffer);
        throw new Error("Failed to get glyph infos/positions");
      }

      const textChars = Array.from(text);

      const out = [];
      // IMPORTANT:
      // We build absolute geometry here and return ready-to-render SVG paths.
      // Visual components must NOT re-run OpenType positioning, or you'll get drift.
      // Keep origin at (0,0); caller can translate/center via viewBox.
      let cursorX = 0;
      let cursorY = 0;

      for (let i = 0; i < length; i++) {
        const infoOffset = infosPtr + i * 20;
        const glyphIndex = hb.HEAPU32[(infoOffset + 0) >> 2];
        const clusterRaw = hb.HEAPU32[(infoOffset + 8) >> 2];

        const posOffset = positionsPtr + i * 20;
        const x_advance = hb.HEAP32[(posOffset + 0) >> 2];
        const y_advance = hb.HEAP32[(posOffset + 4) >> 2];
        const x_offset = hb.HEAP32[(posOffset + 8) >> 2];
        const y_offset = hb.HEAP32[(posOffset + 12) >> 2];

        const advance = x_advance / 64;
        const xOff = x_offset / 64;
        const yOff = y_offset / 64;

        // absolute placement in the same coordinate space as returned SVG path
        const x = cursorX + xOff;
        const y = cursorY - yOff;

        const otGlyph = otFont.glyphs.get(glyphIndex);

        const path = otGlyph.getPath(x, y, FONT_SIZE);
        const d = path.toPathData(3);
        const bb = path.getBoundingBox();

        // normalize cluster (char index vs utf8 byte offset)
        let normalizedCluster = clusterRaw;
        let ch = "";

        if (clusterRaw < textChars.length) {
          normalizedCluster = clusterRaw;
          ch = textChars[normalizedCluster] || "";
        } else {
          const enc = new TextEncoder();
          let bytePos = 0;
          let found = false;

          for (let charIdx = 0; charIdx < textChars.length; charIdx++) {
            if (bytePos === clusterRaw) {
              normalizedCluster = charIdx;
              ch = textChars[charIdx] || "";
              found = true;
              break;
            }
            bytePos += enc.encode(textChars[charIdx]).length;
          }

          if (!found) {
            normalizedCluster = Math.max(0, textChars.length - 1);
            ch = textChars[normalizedCluster] || "";
          }
        }

        out.push({
          id: i,
          glyphIdx: glyphIndex,
          cluster: normalizedCluster,
          clusterRaw,
          char: ch,
          d,
          bb: { x1: bb.x1, y1: bb.y1, x2: bb.x2, y2: bb.y2 },
          // absolute placement (same coordinate space as `d`)
          x,
          y,
          // hb positioning (float units at current FONT_SIZE)
          xAdvance: x_advance / 64,
          yAdvance: y_advance / 64,
          xOffset: xOff,
          yOffset: yOff,
          codePoints: ch ? [ch.codePointAt(0)] : [],
        });

        cursorX += advance;
        cursorY += y_advance / 64;
      }

      hb._hb_buffer_destroy(buffer);
      return out;
    },
    [ready]
  );

  return { ready, error, shape };
}
