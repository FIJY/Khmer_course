import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser } from '../data/auth';
import { fetchAllLessons } from '../data/lessons';
import { fetchCompletedLessonIds } from '../data/progress';

const buildChaptersMap = (allLessons) => {
  if (!allLessons) return {};

  const chaptersMap = {};

  allLessons.filter(l => l.id < 100).forEach(l => {
    chaptersMap[l.id] = { ...l, subLessons: [] };
  });

  allLessons.filter(l => l.id >= 100).forEach(l => {
    if (l.id >= 10000) {
      const chapterId = Math.floor(l.id / 10000) * 10000;
      if (!chaptersMap[chapterId]) {
        chaptersMap[chapterId] = {
          id: chapterId,
          title: 'Alphabet',
          description: 'Alphabet focus lessons.',
          subLessons: []
        };
      }
      chaptersMap[chapterId].subLessons.push({
        id: l.id,
        title: l.title || `Alphabet ${l.id}`
      });
      return;
    }

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

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await fetchCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const doneIds = await fetchCompletedLessonIds(user.id);
      setCompletedLessons(doneIds);

      const allLessons = await fetchAllLessons();
      if (!allLessons.length) {
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
  }, [navigate]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  return {
    loading,
    completedLessons,
    chapters,
    error,
    navigate,
    refresh: fetchAllData
  };
}
