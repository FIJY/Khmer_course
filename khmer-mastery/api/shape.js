import fs from 'fs';
import path from 'path';
import fontkit from 'fontkit';
import opentype from 'opentype.js';

const FONT_SIZE = 120;
const COENG = 0x17d2;
const KHMER_CONSONANT_START = 0x1780;
const KHMER_CONSONANT_END = 0x17a2;
const FONT_PATH = path.join(process.cwd(), 'public', 'fonts', 'KhmerOS_siemreap.ttf');

let fkFont = null;
let otFont = null;
let unitsPerEm = 1000;

function shouldForceSplit(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  const splitList = [0x17b6, 0x17c1, 0x17c2, 0x17c3, 0x17c4, 0x17c5];
  return splitList.includes(code);
}

function isKhmerConsonantCodePoint(cp) {
  return cp >= KHMER_CONSONANT_START && cp <= KHMER_CONSONANT_END;
}

function resolveCharFromCodePoints(codePoints = []) {
  if (!Array.isArray(codePoints) || codePoints.length === 0) return '';

  const consonant = codePoints.find((cp) => isKhmerConsonantCodePoint(cp));
  if (consonant) return String.fromCodePoint(consonant);

  const nonCoeng = codePoints.find((cp) => cp !== COENG);
  if (nonCoeng) return String.fromCodePoint(nonCoeng);

  return String.fromCodePoint(codePoints[0]);
}

function findNextConsonantAfterCoeng(textChars, startIndex) {
  let coengIndex = -1;
  for (let i = startIndex; i < textChars.length; i++) {
    if (textChars[i].codePointAt(0) === COENG) {
      coengIndex = i;
      break;
    }
  }

  const searchStart = coengIndex >= 0 ? coengIndex + 1 : startIndex;
  for (let i = searchStart; i < textChars.length; i++) {
    if (isKhmerConsonantCodePoint(textChars[i].codePointAt(0))) {
      return { char: textChars[i], index: i };
    }
  }

  return { char: '', index: -1 };
}

function ensureFonts() {
  if (fkFont && otFont) return;
  if (!fs.existsSync(FONT_PATH)) {
    throw new Error(`Font not found: ${FONT_PATH}`);
  }

  fkFont = fontkit.openSync(FONT_PATH);
  unitsPerEm = fkFont.unitsPerEm;

  const fontBuffer = fs.readFileSync(FONT_PATH);
  otFont = opentype.parse(fontBuffer.buffer);
}

export default function handler(req, res) {
  const text = req?.query?.text;
  if (!text) {
    res.status(400).json({ error: 'No text provided' });
    return;
  }

  try {
    ensureFonts();

    const run = fkFont.layout(text);
    const scale = FONT_SIZE / unitsPerEm;
    let cursorX = 50;
    const glyphsData = [];

    const textChars = Array.from(text);
    let textIndex = 0;

    for (let i = 0; i < run.glyphs.length; i++) {
      const fkGlyph = run.glyphs[i];
      const position = run.positions[i];
      const codePoints = fkGlyph.codePoints;
      const otGlyph = otFont.glyphs.get(fkGlyph.id);

      const x = cursorX + (position.xOffset * scale);
      const y = 200 - (position.yOffset * scale);
      const pathData = otGlyph.getPath(x, y, FONT_SIZE);

      let char = resolveCharFromCodePoints(codePoints);
      if (char === String.fromCodePoint(COENG)) {
        const { char: fallbackChar, index } = findNextConsonantAfterCoeng(textChars, textIndex);
        if (fallbackChar) {
          char = fallbackChar;
          textIndex = index + 1;
        }
      } else if (char) {
        const nextIndex = textChars.indexOf(char, textIndex);
        if (nextIndex !== -1) {
          textIndex = nextIndex + 1;
        }
      }

      if (codePoints.length > 1 && shouldForceSplit(String.fromCharCode(codePoints[1]))) {
        const baseChar = String.fromCharCode(codePoints[0]);
        const vowelChar = String.fromCharCode(codePoints[1]);

        const baseOtGlyph = otFont.charToGlyph(baseChar);
        const basePath = baseOtGlyph.getPath(cursorX, 200, FONT_SIZE);
        const baseAdv = baseOtGlyph.advanceWidth * scale;

        glyphsData.push({
          id: glyphsData.length,
          char: baseChar,
          d: basePath.toPathData(3),
          bb: basePath.getBoundingBox(),
        });

        const vowelOtGlyph = otFont.charToGlyph(vowelChar);
        const vowelPath = vowelOtGlyph.getPath(cursorX + baseAdv, 200, FONT_SIZE);
        const vowelAdv = vowelOtGlyph.advanceWidth * scale;

        glyphsData.push({
          id: glyphsData.length,
          char: vowelChar,
          d: vowelPath.toPathData(3),
          bb: vowelPath.getBoundingBox(),
        });

        cursorX += baseAdv + vowelAdv;
        continue;
      }

      const d = pathData.toPathData(3);
      if (d && d.length > 5) {
        glyphsData.push({
          id: glyphsData.length,
          char,
          d,
          bb: pathData.getBoundingBox(),
        });
      }

      cursorX += position.xAdvance * scale;
    }

    res.status(200).json(glyphsData);
  } catch (error) {
    console.error('Glyph shaping failed:', error);
    res.status(500).json({ error: 'Failed to shape glyphs' });
  }
}
