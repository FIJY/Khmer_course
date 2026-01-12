import { supabase } from '../supabaseClient';

export const updateSRSItem = async (userId, itemId, quality) => {
  // Получаем dictionary_id из самого элемента урока
  const { data: item } = await supabase.from('lesson_items').select('data').eq('id', itemId).single();
  const dictId = item?.data?.dictionary_id;

  const { data: existing } = await supabase
    .from('user_srs_items')
    .select('*')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .maybeSingle();

  const interval = (existing?.interval || 1) * (quality >= 3 ? 2 : 1);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return await supabase.from('user_srs_items').upsert({
    user_id: userId,
    item_id: itemId,
    dictionary_id: dictId, // Связываем прогресс со словарем для статистики B1
    interval: interval,
    next_review: nextReview.toISOString()
  });
};

// Добавь это в srsService.js
export const getDueItems = async (userId) => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_srs_items')
    .select(`
      id,
      item_id,
      interval,
      dictionary:dictionary_id(*)
    `)
    .eq('user_id', userId)
    .lte('next_review', now) // Выбираем всё, что "меньше или равно" текущему времени
    .order('next_review', { ascending: true }) // Самые старые — первыми
    .limit(20); // Чтобы не перегружать за один раз

  return data || [];
};