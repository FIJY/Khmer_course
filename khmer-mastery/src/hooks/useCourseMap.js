import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const buildChaptersMap = (allLessons) => {
  if (!allLessons) return {};

  const chaptersMap = {};

  allLessons.filter(l => l.id < 100).forEach(l => {
    chaptersMap[l.id] = { ...l, subLessons: [] };
  });

  allLessons.filter(l => l.id >= 100).forEach(l => {
    const chapterId = Math.floor(l.id / 100);
    if (!chaptersMap[chapterId]) {
      chaptersMap[chapterId] = {
        id: chapterId,
        title: `Chapter ${chapterId}`,
        description: 'Coming soon...',
        subLessons: []
      };
    }
    chaptersMap[chapterId].subLessons.push({ id: l.id, title: l.title });
  });

  return chaptersMap;
};

export default function useCourseMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [chapters, setChapters] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: progressData } = await supabase
        .from('user_progress')
        .select('lesson_id')
        .eq('user_id', user.id)
        .eq('is_completed', true);

      const doneIds = progressData ? progressData.map(item => Number(item.lesson_id)) : [];
      setCompletedLessons(doneIds);

      const { data: allLessons } = await supabase
        .from('lessons')
        .select('*')
        .order('id', { ascending: true });

      if (!allLessons || allLessons.length === 0) {
        setChapters({});
        return;
      }

      setChapters(buildChaptersMap(allLessons));
    } catch (e) {
      console.error('CRITICAL MAP ERROR:', e);
      setError('Unable to load the course map. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    completedLessons,
    chapters,
    error,
    navigate,
    refresh: fetchAllData
  };
}
