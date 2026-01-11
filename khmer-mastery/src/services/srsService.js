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