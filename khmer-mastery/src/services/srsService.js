import { supabase } from '../supabaseClient';

/**
 * Главная функция обновления SRS
 * @param {string} userId - ID пользователя
 * @param {number} itemId - ID карточки слова
 * @param {number} grade - Оценка (1 = Забыл, 3 = Норм, 5 = Отлично)
 */
export const updateSRSItem = async (userId, itemId, grade) => {
  try {
    // 1. Пытаемся найти существующую запись
    let { data: existing, error } = await supabase
      .from('user_srs')
      .select('*')
      .eq('user_id', userId)
      .eq('item_id', itemId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Игнорируем ошибку "не найдено"

    // Параметры по умолчанию (если слово новое)
    let interval = 0;
    let easeFactor = 2.5;
    let reviewDate = new Date();

    if (existing) {
      interval = existing.interval;
      easeFactor = existing.ease_factor;
    }

    // 2. АЛГОРИТМ SM-2 (Упрощенный Anki)
    if (grade < 3) {
      // Если ответил плохо (1 или 2) — сбрасываем прогресс
      interval = 1;
      reviewDate.setDate(reviewDate.getDate() + 1); // Повторить завтра
    } else {
      // Если ответил хорошо (3, 4, 5)
      if (interval === 0) {
        interval = 1; // Первый раз — через 1 день
      } else if (interval === 1) {
        interval = 6; // Второй раз — через 6 дней
      } else {
        // Дальше умножаем на коэффициент легкости
        interval = Math.round(interval * easeFactor);
      }

      // Корректируем "легкость" слова
      // Если было легко (5) -> easeFactor растет. Если сложно (3) -> падает.
      easeFactor = easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
      if (easeFactor < 1.3) easeFactor = 1.3; // Минимум 1.3

      reviewDate.setDate(reviewDate.getDate() + interval);
    }

    // 3. Сохраняем в базу
    const { error: upsertError } = await supabase
      .from('user_srs')
      .upsert({
        user_id: userId,
        item_id: itemId,
        interval: interval,
        ease_factor: easeFactor,
        next_review: reviewDate.toISOString(),
        status: interval > 20 ? 'graduated' : 'learning'
      }, { onConflict: 'user_id, item_id' });

    if (upsertError) throw upsertError;
    console.log(`SRS Updated: Item ${itemId} next review in ${interval} days.`);

  } catch (err) {
    console.error("SRS Error:", err);
  }
};

/**
 * Получить слова, которые пора повторять сегодня
 */
export const getDueItems = async (userId) => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_srs')
    .select(`
      *,
      lesson_items (
        id, type, data
      )
    `)
    .eq('user_id', userId)
    .lte('next_review', now) // Дата следующего повтора <= Сейчас
    .order('next_review', { ascending: true })
    .limit(20); // Не больше 20 за раз, чтобы не пугать

  if (error) throw error;

  // Возвращаем чистый список карточек
  return data.map(row => ({
    ...row.lesson_items,
    srs_id: row.id // сохраняем ID записи SRS для отладки
  }));
};