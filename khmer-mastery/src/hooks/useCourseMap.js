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

const getChapterDisplayId = (chapterId) => chapterId;

const isChapterLesson = (lessonId) => lessonId < 100 || lessonId % 100 === 0;

const CYRILLIC_PATTERN = /[\u0400-\u04FF]/;

const normalizeLessonTitle = (lesson, fallbackTitle) => {
  const candidates = [
    lesson?.title_en,
    lesson?.title,
    lesson?.name,
    lesson?.label
  ];
  const cleaned = candidates
    .map((candidate) => (typeof candidate === 'string' ? candidate.trim() : ''))
    .find((candidate) => candidate.length >= 3 && !CYRILLIC_PATTERN.test(candidate));
  return cleaned || fallbackTitle;
};

const prefixLessonNumber = (lessonId, title) => {
  if (!Number.isFinite(lessonId) || lessonId >= 10000) return title;
  if (typeof title !== 'string' || title.length === 0) return title;
  if (/^\d/.test(title)) return title;
  return `${lessonId}: ${title}`;
};

const buildChaptersMap = (allLessons) => {
  if (!allLessons) return {};

  const chaptersMap = {};

  allLessons.forEach((lesson) => {
    const lessonId = Number(lesson.id ?? lesson.lesson_id);
    const rawModuleId = lesson.module_id ?? lesson.chapter_id ?? lesson.moduleId ?? lesson.chapterId;
    const moduleId = Number(rawModuleId);
    if (!Number.isFinite(lessonId)) return;

    const useModuleForChapter = Number.isFinite(moduleId) && lessonId < 10000 && moduleId >= 10000;
    const chapterId = useModuleForChapter ? moduleId : getChapterId(lessonId);
    const displayId = getChapterDisplayId(chapterId);
    const isPrimaryChapterLesson = lessonId === chapterId;

    if (isPrimaryChapterLesson || isChapterLesson(lessonId)) {
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
      id: lessonId,
      title: prefixLessonNumber(
        lessonId,
        normalizeLessonTitle(lesson, `Lesson ${lessonId}`)
      ),
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
