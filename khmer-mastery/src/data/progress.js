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

export const fetchLastOpenedProgress = async (userId) => {
  const { data, error } = await supabase
    .from('user_progress')
    .select('last_opened_block_id,last_opened_lesson_id,last_opened_at')
    .eq('user_id', userId)
    .not('last_opened_at', 'is', null)
    .order('last_opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data || null;
};

export const updateLastOpenedProgress = async (userId, blockId, lessonId) => {
  const { error } = await supabase
    .from('user_progress')
    .upsert({
      user_id: userId,
      lesson_id: lessonId,
      last_opened_block_id: blockId,
      last_opened_lesson_id: lessonId,
      last_opened_at: new Date().toISOString()
    }, { onConflict: 'user_id,lesson_id' });
  if (error) throw error;
};
