import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser } from '../data/auth';
import { fetchAllLessons } from '../data/lessons';
import { fetchCompletedLessonIds, fetchLastOpenedProgress } from '../data/progress';

const getChapterId = (lessonId) => {
  if (lessonId < 100) return lessonId;
  if (lessonId % 100 === 0) return lessonId;
  if (lessonId >= 10000) return Math.floor(lessonId / 100) * 100;
  return Math.floor(lessonId / 100);
};

const getChapterDisplayId = (chapterId) => (chapterId >= 10000 ? Math.floor(chapterId / 100) : chapterId);

const isChapterLesson = (lessonId) => lessonId < 100 || lessonId % 100 === 0;

const normalizeLessonTitle = (lesson, fallbackTitle) => {
  const candidates = [
    lesson?.title,
    lesson?.title_ru,
    lesson?.title_en,
    lesson?.name,
    lesson?.label
  ];
  const cleaned = candidates
    .map((candidate) => (typeof candidate === 'string' ? candidate.trim() : ''))
    .find((candidate) => candidate.length >= 3);
  return cleaned || fallbackTitle;
};

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
        title: normalizeLessonTitle(lesson, `Chapter ${displayId}`),
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
      title: normalizeLessonTitle(lesson, `Lesson ${lesson.id}`),
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
  const [userId, setUserId] = useState(null);
  const [lastOpenedBlockId, setLastOpenedBlockId] = useState(null);
  const [lastOpenedLessonId, setLastOpenedLessonId] = useState(null);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const user = await fetchCurrentUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUserId(user.id);

      const doneIds = await fetchCompletedLessonIds(user.id);
      setCompletedLessons(doneIds);

      const allLessons = await fetchAllLessons();
      if (!allLessons.length) {
        setChapters({});
        return;
      }

      setChapters(buildChaptersMap(allLessons));

      const lastOpened = await fetchLastOpenedProgress(user.id);
      setLastOpenedBlockId(lastOpened?.last_opened_block_id ?? null);
      setLastOpenedLessonId(lastOpened?.last_opened_lesson_id ?? null);
    } catch (e) {
      console.error('CRITICAL MAP ERROR:', e);
      setError('Unable to load the course map. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  return {
    userId,
    loading,
    completedLessons,
    lastOpenedBlockId,
    lastOpenedLessonId,
    chapters,
    error,
    navigate,
    refresh: fetchAllData
  };
}
