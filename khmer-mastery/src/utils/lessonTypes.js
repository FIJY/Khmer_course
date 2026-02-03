export const AUTO_UNLOCK_TYPES = [
  'theory',
  'learn_char',
  'word_breakdown',
  'title',
  'meet_teams',
  'rule',
  'reading_algorithm',
  'ready',
  'intro',
  'analysis',
  'comparison_audio',
  'meet-teams',
  'reading-algorithm'
];

export const normalizeLessonType = (rawType) => {
  if (!rawType) return '';
  return String(rawType).toLowerCase().trim().replace(/[\s-]+/g, '_');
};

export const normalizeLessonTypeKey = (rawType) => {
  if (!rawType) return '';
  return String(rawType).toLowerCase().trim();
};
