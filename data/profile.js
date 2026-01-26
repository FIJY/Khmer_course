import { supabase } from '../supabaseClient';

export const fetchUserSrsCount = async (userId) => {
  const { data, error } = await supabase
    .from('user_srs')
    .select('id')
    .eq('user_id', userId);
  if (error) throw error;
  return data?.length || 0;
};
