import { supabase } from '../supabaseClient';

export const fetchCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data?.user ?? null;
};
