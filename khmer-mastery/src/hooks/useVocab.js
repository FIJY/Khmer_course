import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function useVocab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchVocab(); }, []);

  const fetchVocab = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('type', 'vocab_card')
        .order('lesson_id', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (filename) => {
    if (filename) new Audio(`/sounds/${filename}`).play().catch(() => {});
  };

  const filteredItems = useMemo(() => items.filter(item => {
    const term = filter.toLowerCase();
    const front = item.data?.front?.toLowerCase() || '';
    const back = item.data?.back?.toLowerCase() || '';
    return front.includes(term) || back.includes(term);
  }), [items, filter]);

  return {
    items,
    loading,
    filter,
    setFilter,
    filteredItems,
    playAudio
  };
}
