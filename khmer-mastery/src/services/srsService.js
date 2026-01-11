/**
 * Рассчитывает следующий интервал повторения (алгоритм SM-2)
 * @param {number} quality - Оценка пользователя (0-5)
 * @param {number} repetitions - Сколько раз уже повторяли
 * @param {number} previousInterval - Предыдущий интервал в днях
 * @param {number} previousEaseFactor - Предыдущий коэффициент сложности
 */
export const calculateNextReview = (quality, repetitions, previousInterval, previousEaseFactor) => {
  let interval;
  let easeFactor = previousEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  if (easeFactor < 1.3) easeFactor = 1.3;

  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(previousInterval * easeFactor);
    }
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return {
    nextReview,
    interval,
    easeFactor,
    repetitions
  };
};