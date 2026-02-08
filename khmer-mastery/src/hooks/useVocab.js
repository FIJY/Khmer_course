import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchVocabCards } from '../data/vocab';
import useAudioPlayer from './useAudioPlayer';

export default function useVocab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [error, setError] = useState(null);
  const { play: playAudio } = useAudioPlayer();

  const fetchVocab = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchVocabCards();
      setItems(data);
    } catch (e) {
      console.error(e);
      setError('Unable to load vocabulary right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVocab(); }, [fetchVocab]);

  const filteredItems = useMemo(() => items.filter(item => {
    const term = filter.toLowerCase();
    const front = item.data?.front?.toLowerCase() || '';
    const back = item.data?.back?.toLowerCase() || '';
    return front.includes(term) || back.includes(term);
  }), [items, filter]);

  return {
    items,
    loading,
    error,
    filter,
    setFilter,
    filteredItems,
    playAudio,
    refresh: fetchVocab
  };
}
