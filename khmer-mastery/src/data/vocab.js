import { supabase } from '../supabaseClient';

export const fetchVocabCards = async () => {
  const { data, error } = await supabase
    .from('lesson_items')
    .select('*')
    .eq('type', 'vocab_card')
    .order('lesson_id', { ascending: true });
  if (error) throw error;
  return data || [];
};
