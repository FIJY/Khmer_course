// src/lib/khmerCompoundChars.js
import { findOverride } from "./khmerOverrides";

// Для обратной совместимости оставляем статическую карту
export const COMPOUND_CHAR_MAP = {
  // пример: "ញ្ច": [0x1789, 0x17D2, 0x1785] и т.д.
};

// База правил (может загружаться динамически)
let wordOverrides = [];
let patternOverrides = [];

/**
 * Инициализация базы overrides (вызвать при старте приложения или загрузке урока)
 */
export function initOverrides(wordRules, patternRules) {
  wordOverrides = wordRules || [];
  patternOverrides = patternRules || [];
}

/**
 * Получить правило для данного токена и шрифта
 */
export function getOverrideForToken(token, font = null) {
  return findOverride(token, font, { wordOverrides, patternOverrides });
}

/**
 * Применить split-правило к токену (если есть) или вернуть null
 */
export function applySplitOverride(token, font = null) {
  const rule = getOverrideForToken(token, font);
  return rule?.split || null;
}

/**
 * Применить merge-правило к токену (если есть)
 */
export function applyMergeOverride(token, font = null) {
  const rule = getOverrideForToken(token, font);
  return rule?.merge || null;
}

/**
 * Получить primary-символ для токена (если задан)
 */
export function getPrimaryOverride(token, font = null) {
  const rule = getOverrideForToken(token, font);
  return rule?.primary || null;
}

/**
 * Получить зоны хита для shared глифа (если заданы)
 */
export function getHitZonesOverride(token, font = null) {
  const rule = getOverrideForToken(token, font);
  return rule?.hitZones || null;
}