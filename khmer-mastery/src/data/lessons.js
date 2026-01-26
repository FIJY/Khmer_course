import { supabase } from '../supabaseClient';

export const fetchLessonById = async (id) => {
  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
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
