import { supabase } from '../supabaseClient';

export const fetchLessonById = async (id) => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;

  try {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('lessons')
      .select('*')
      .eq('lesson_id', id)
      .maybeSingle();
    if (fallbackError) throw fallbackError;
    return fallbackData;
  } catch (fallbackErr) {
    console.warn('Lesson lookup by lesson_id failed', fallbackErr);
    return null;
  }
};

export const fetchLessonItemsByLessonId = async (lessonId) => {
  const { data, error } = await supabase
    .from('lesson_items')
    .select('*')
    .eq('lesson_id', lessonId)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const fetchAllLessons = async () => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .order('id', { ascending: true });
  if (error) throw error;
  return data || [];
};
