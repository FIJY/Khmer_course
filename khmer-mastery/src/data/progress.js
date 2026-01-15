import { supabase } from '../supabaseClient';

export const fetchCompletedLessonIds = async (userId) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('is_completed', true);
  if (error) throw error;
  return data ? data.map(item => Number(item.lesson_id)) : [];
};

export const fetchCompletedLessonCount = async (userId) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('is_completed', true);
  if (error) throw error;
  return data?.length || 0;
};

export const markLessonCompleted = async (userId, lessonId) => {
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      is_completed: true
    }, { onConflict: 'user_id,lesson_id' });
  if (error) throw error;
};
