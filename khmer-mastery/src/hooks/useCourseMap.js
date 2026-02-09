import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser } from '../data/auth';
import { fetchAllLessons } from '../data/lessons';
import { fetchCompletedLessonIds, fetchLastOpenedProgress } from '../data/progress';

// Хелпер: вычисляем ID родителя
const calculateParentId = (lessonId) => {
  const id = Number(lessonId);

  // Исключаем системные/тестовые ID
  if (id === 999 || id === 99999) return null;

  // Логика для Чтения (R1...): 10101 -> 10100
  if (id >= 10000) {
    return Math.floor(id / 100) * 100;
  }

  // Логика для Основного курса: 101 -> 1
  if (id >= 100) {
    return Math.floor(id / 100);
  }

  return null;
};

// Хелпер: это глава?
const isChapterCheck = (id) => {
  const numId = Number(id);
  // Глава, если ID < 100 или это круглое число >= 10000
  return numId < 100 || (numId >= 10000 && numId % 100 === 0);
};

const buildChaptersMap = (allLessons) => {
  if (!allLessons || !Array.isArray(allLessons)) return {};

  const chaptersMap = {};

  // --- ШАГ 1: Создаем каркас существующих ГЛАВ ---
  allLessons.forEach((lesson) => {
    const id = Number(lesson.id);
    if (id === 999 || id === 99999) return;

    if (isChapterCheck(id)) {
      chaptersMap[id] = {
        ...lesson,
        id: id,
        displayId: id >= 10000 ? Math.floor(id / 100) : id,
        subLessons: []
      };
    }
  });

  // --- ШАГ 2: Раскладываем ДЕТЕЙ по главам ---
  allLessons.forEach((lesson) => {
    const id = Number(lesson.id);

    // Если урок уже обработан как глава - пропускаем
    if (chaptersMap[id]) return;
    if (id === 999 || id === 99999) return;

    const parentId = calculateParentId(id);

    if (parentId) {
      // АВТО-СОЗДАНИЕ РОДИТЕЛЯ (если его нет в базе)
      if (!chaptersMap[parentId]) {
        console.warn(`Creating virtual parent for lesson ${id} -> ${parentId}`);
        chaptersMap[parentId] = {
          id: parentId,
          title: `Unit ${parentId >= 10000 ? parentId / 100 : parentId}`, // Заглушка названия
          description: "Auto-generated chapter",
          order_index: parentId, // Сортировка по ID
          displayId: parentId >= 10000 ? Math.floor(parentId / 100) : parentId,
          subLessons: []
        };
      }

      // Добавляем урок в (существующую или созданную) главу
      chaptersMap[parentId].subLessons.push({
        ...lesson,
        id: id,
        title: lesson.title,
        order_index: lesson.order_index ?? 0
      });
    }
  });

  // --- ШАГ 3: Сортируем уроки внутри глав ---
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
      setCompletedLessons(Array.isArray(doneIds) ? doneIds : []);

      const allLessons = await fetchAllLessons();
      if (!allLessons || !allLessons.length) {
        setChapters({});
        return;
      }

      const builtMap = buildChaptersMap(allLessons);
      setChapters(builtMap);

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