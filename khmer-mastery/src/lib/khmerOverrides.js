// src/lib/khmerOverrides.js

/**
 * Правила переопределения:
 * - word: точное слово (NFC)
 * - pattern: RegExp или строка
 * - font: имя шрифта (опционально)
 * - split: как разбивать токен на eduUnit (массив описаний)
 * - merge: какие глифы объединять (массив id)
 * - hitZones: зоны для shared глифов (верх/низ/центр)
 * - primary: какой символ считать главным
 */
export function findOverride(token, font, { wordOverrides, patternOverrides }) {
  const candidates = [];

  // word+font
  if (wordOverrides) {
    wordOverrides.forEach(rule => {
      if (rule.word === token && (!rule.font || rule.font === font)) {
        candidates.push({ rule, priority: 4 }); // word+font
      }
    });
  }

  // word only
  if (wordOverrides) {
    wordOverrides.forEach(rule => {
      if (rule.word === token && !rule.font) {
        candidates.push({ rule, priority: 3 });
      }
    });
  }

  // pattern+font
  if (patternOverrides) {
    patternOverrides.forEach(rule => {
      const matches = rule.pattern instanceof RegExp
        ? rule.pattern.test(token)
        : rule.pattern === token;
      if (matches && rule.font === font) {
        candidates.push({ rule, priority: 2 });
      }
    });
  }

  // pattern only
  if (patternOverrides) {
    patternOverrides.forEach(rule => {
      const matches = rule.pattern instanceof RegExp
        ? rule.pattern.test(token)
        : rule.pattern === token;
      if (matches && !rule.font) {
        candidates.push({ rule, priority: 1 });
      }
    });
  }

  if (candidates.length === 0) return null;

  // сортируем по убыванию приоритета
  candidates.sort((a, b) => b.priority - a.priority);
  return candidates[0].rule;
}