import { supabase } from '../supabaseClient';

export async function fetchAlphabetMeta(chars) {
  if (!chars?.length) return [];

  const { data, error } = await supabase
    .from('alphabet')
    .select('id,name_en,type,series,shape_group,subscript_form')
    .in('id', chars);

  if (error) {
    throw error;
  }

  return data ?? [];
}
