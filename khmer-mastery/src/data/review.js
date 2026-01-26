import { supabase } from '../supabaseClient';

export const fetchDictionaryEntries = async (limit = 100) => {
  const { data, error } = await supabase
    .from('dictionary')
    .select('*')
    .neq('english', 'Quiz Answer')
    .neq('english', '')
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const fetchSrsStatusCounts = async (userId) => {
  const { data, error } = await supabase
    .from('user_srs')
    .select('status')
    .eq('user_id', userId);
  if (error) throw error;
  const total = data?.length || 0;
  const mastered = data?.filter(item => item.status === 'graduated').length || 0;
  return { total, mastered };
};
