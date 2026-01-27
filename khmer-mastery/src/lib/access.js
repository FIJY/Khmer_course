const ACCESS_STORAGE_KEY = 'khmer-mastery-access';
const ACCESS_EVENT = 'khmer-access-updated';

export const FREE_LESSON_COUNT = 5;
export const TOTAL_LESSON_COUNT = 60;
export const PAID_LESSON_RANGES = [
  [FREE_LESSON_COUNT + 1, TOTAL_LESSON_COUNT],
  [10000, 10699]
];

const safeWindow = () => (typeof window !== 'undefined' ? window : null);

export const getAccessState = () => {
  const win = safeWindow();
  if (!win) return { hasAccess: false, source: null, redeemedAt: null, code: null };
  const raw = win.localStorage.getItem(ACCESS_STORAGE_KEY);
  if (!raw) return { hasAccess: false, source: null, redeemedAt: null, code: null };
  try {
    const parsed = JSON.parse(raw);
    return {
      hasAccess: Boolean(parsed?.hasAccess),
      source: parsed?.source ?? null,
      redeemedAt: parsed?.redeemedAt ?? null,
      code: parsed?.code ?? null
    };
  } catch (error) {
    console.warn('Failed to parse access state', error);
    return { hasAccess: false, source: null, redeemedAt: null, code: null };
  }
};

export const hasPaidAccess = () => getAccessState().hasAccess;

const saveAccessState = (nextState) => {
  const win = safeWindow();
  if (!win) return;
  win.localStorage.setItem(ACCESS_STORAGE_KEY, JSON.stringify(nextState));
  win.dispatchEvent(new Event(ACCESS_EVENT));
};

export const setPaidAccess = ({ source = 'aba', code = null } = {}) => {
  saveAccessState({
    hasAccess: true,
    source,
    redeemedAt: new Date().toISOString(),
    code
  });
};

export const clearPaidAccess = () => {
  saveAccessState({
    hasAccess: false,
    source: null,
    redeemedAt: null,
    code: null
  });
};

export const redeemGiftCode = (code) => {
  const normalized = String(code || '').trim().toUpperCase();
  if (normalized.length < 6) return { ok: false, message: 'Gift code is too short.' };
  setPaidAccess({ source: 'gift', code: normalized });
  return { ok: true, code: normalized };
};

export const isLessonLocked = (lessonId) => {
  const numericId = Number(lessonId);
  if (!Number.isFinite(numericId)) return false;
  if (hasPaidAccess()) return false;
  return PAID_LESSON_RANGES.some(([start, end]) => numericId >= start && numericId <= end);
};

export const subscribeAccessUpdates = (handler) => {
  const win = safeWindow();
  if (!win) return () => {};
  win.addEventListener(ACCESS_EVENT, handler);
  return () => win.removeEventListener(ACCESS_EVENT, handler);
};
