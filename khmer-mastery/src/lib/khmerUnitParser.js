// src/lib/khmerUnitParser.js
import {
  getKhmerGlyphCategory,
  isKhmerConsonantChar,
} from './khmerGlyphRenderer';
import { COMPOUND_CHAR_MAP } from './khmerCompoundChars';

const COENG_CHAR = '្';
const NIKAHIT_CHAR = 'ំ';
const COENG_CP = 0x17D2;
const NIKAHIT_CP = 0x17C6;

// Проверка, является ли символ зависимой гласной (по категории)
function isDependentVowel(ch) {
  const cat = getKhmerGlyphCategory(ch);
  return cat === 'vowel_dep';
}

// Проверка, является ли символ подстрочным коенгом (уже есть отдельная категория)
function isCoeng(ch) {
  return getKhmerGlyphCategory(ch) === 'coeng';
}

// Генерирует авто-юниты на основе текста
export function generateAutoUnits(text) {
  const chars = Array.from(text);
  const units = [];
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];

    // 1. Coeng + следующая согласная
    if (isCoeng(ch) && i + 1 < chars.length && isKhmerConsonantChar(chars[i + 1])) {
      units.push({
        id: `auto_${units.length}`,
        kind: 'subscript',
        text: ch + chars[i + 1],
        indices: [i, i + 1],
      });
      i += 2;
      continue;
    }

    // 2. Составная гласная (зависимая + никахит)
    if (isDependentVowel(ch) && i + 1 < chars.length && chars[i + 1] === NIKAHIT_CHAR) {
      units.push({
        id: `auto_${units.length}`,
        kind: 'vowel',
        text: ch + NIKAHIT_CHAR,
        indices: [i, i + 1],
      });
      i += 2;
      continue;
    }

    // 3. Символ из словаря составных (например, "ៅ")
    if (COMPOUND_CHAR_MAP[ch]) {
      units.push({
        id: `auto_${units.length}`,
        kind: 'compound',
        text: ch,
        indices: [i],
      });
      i += 1;
      continue;
    }

    // 4. Обычный символ
    const cat = getKhmerGlyphCategory(ch);
    let kind = cat;
    if (cat === 'vowel_dep') kind = 'vowel';
    if (cat === 'vowel_ind') kind = 'vowel';
    if (cat === 'diacritic') kind = 'mark';
    if (cat === 'coeng') kind = 'coeng'; // но мы уже обработали выше

    units.push({
      id: `auto_${units.length}`,
      kind: kind,
      text: ch,
      indices: [i],
    });
    i += 1;
  }

  return units;
}

// Объединяет ручные и авто-юниты, отдавая приоритет ручным
export function buildUnits(text, manualUnits = []) {
  const chars = Array.from(text);
  const autoUnits = generateAutoUnits(text);

  // Копируем ручные, добавляем поле indices, если его нет
  const processedManual = manualUnits.map(unit => {
    if (unit.indices) return unit; // уже есть
    // ищем вхождение unit.text в text
    const search = Array.from(unit.text);
    for (let i = 0; i <= chars.length - search.length; i++) {
      let match = true;
      for (let j = 0; j < search.length; j++) {
        if (chars[i + j] !== search[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        return {
          ...unit,
          indices: Array.from({ length: search.length }, (_, k) => i + k),
        };
      }
    }
    return { ...unit, indices: [] }; // не найдено
  });

  // Множество занятых индексов
  const usedIndices = new Set();
  processedManual.forEach(unit => {
    if (unit.indices) {
      unit.indices.forEach(idx => usedIndices.add(idx));
    }
  });

  // Добавляем авто-юниты для незанятых индексов
  const finalUnits = [...processedManual];
  for (const auto of autoUnits) {
    if (auto.indices.every(idx => !usedIndices.has(idx))) {
      finalUnits.push(auto);
    }
  }

  return finalUnits;
}