import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser } from '../data/auth';
import { fetchAllLessons } from '../data/lessons';
import { fetchCompletedLessonIds } from '../data/progress';

const getChapterId = (lessonId) => {
  if (lessonId < 100) return lessonId;
  if (lessonId % 100 === 0) return lessonId;
  if (lessonId >= 10000) return Math.floor(lessonId / 100) * 100;
  return Math.floor(lessonId / 100);
};

const getChapterDisplayId = (chapterId) => (chapterId >= 10000 ? Math.floor(chapterId / 100) : chapterId);

const isChapterLesson = (lessonId) => lessonId < 100 || lessonId % 100 === 0;

const buildChaptersMap = (allLessons) => {
  if (!allLessons) return {};

  const chaptersMap = {};

  allLessons.forEach((lesson) => {
    const chapterId = getChapterId(lesson.id);
    const displayId = getChapterDisplayId(chapterId);

    if (isChapterLesson(lesson.id)) {
      chaptersMap[chapterId] = {
        ...lesson,
        id: chapterId,
        displayId,
        subLessons: []
      };
      return;
    }

    if (!chaptersMap[chapterId]) {
      chaptersMap[chapterId] = {
        id: chapterId,
        displayId,
        title: `Chapter ${displayId}`,
        description: 'Coming soon...',
        subLessons: []
      };
    }

    chaptersMap[chapterId].subLessons.push({
      id: lesson.id,
      title: lesson.title,
      order_index: lesson.order_index ?? 0
    });
  });

  Object.values(chaptersMap).forEach((chapter) => {
    chapter.subLessons.sort((a, b) => {
      if (a.order_index !== b.order_index) {
        return a.order_index - b.order_index;
      }
      return a.id - b.id;
    });
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
