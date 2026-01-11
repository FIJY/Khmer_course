import { supabase } from '../supabaseClient';

/**
 * Алгоритм SM-2 для интервальных повторений
 * quality: 0-5 (0 = совсем не знаю, 5 = идеально помню)
 */
export const updateSRSItem = async (userId, itemId, quality) => {
  // 1. Получаем текущие данные по этому слову из базы
  let { data: srsItem, error } = await supabase
    .from('user_srs_items')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Ошибка SRS:', error);
    return;
  }

  // Дефолтные значения для новой карточки
  let repetitions = srsItem?.repetitions || 0;
  let easeFactor = srsItem?.ease_factor || 2.5;
  let interval = srsItem?.interval || 0;

  // 2. Расчет по алгоритму SM-2
  if (quality >= 3) {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  } else {
    repetitions = 0;
    interval = 1;
  }

  // Обновляем фактор сложности (минимум 1.3)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  // 3. Сохраняем результат
  const { error: upsertError } = await supabase
    .from('user_srs_items')
    .upsert({
      user_id: userId,
      item_id: itemId,
      next_review: nextReview.toISOString(),
      interval: interval,
      ease_factor: easeFactor,
      repetitions: repetitions,
      last_reviewed: new Date().toISOString()
    }, { onConflict: 'user_id, item_id' });

  if (upsertError) console.error('Ошибка сохранения SRS:', upsertError);
};