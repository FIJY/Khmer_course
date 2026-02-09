// src/hooks/useCourseMap.js
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCurrentUser } from '../data/auth';
import { fetchAllLessons } from '../data/lessons';
import { fetchCompletedLessonIds, fetchLastOpenedProgress } from '../data/progress';

// Helper: Parent ID Logic
const calculateParentId = (lessonId) => {
  const id = Number(lessonId);
  if (id === 999 || id === 99999) return null;
  if (id >= 10000) return Math.floor(id / 100) * 100; // 10101 -> 10100
  if (id >= 100) return Math.floor(id / 100);       // 101 -> 1
  return null;
};

// Helper: Is Chapter?
const isChapterCheck = (id) => {
  const numId = Number(id);
  return numId < 100 || (numId >= 10000 && numId % 100 === 0);
};

const buildChaptersMap = (allLessons) => {
  if (!allLessons || !Array.isArray(allLessons)) return {};
  const chaptersMap = {};

  // Pass 1: Create Chapters
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

  // Pass 2: Assign Children
  allLessons.forEach((lesson) => {
    const id = Number(lesson.id);
    if (chaptersMap[id]) return; // Skip chapters
    if (id === 999 || id === 99999) return;

    const parentId = calculateParentId(id);

    if (parentId && chaptersMap[parentId]) {
      chaptersMap[parentId].subLessons.push({
        ...lesson,
        id: id,
        title: lesson.title,
        order_index: lesson.order_index ?? 0
      });
    } else if (parentId) {
       // DEBUG: Log orphans
       console.warn(`Orphan lesson found: ${id}. Expected parent ${parentId} not found in fetched data.`);
    }
  });

  // Sort
  Object.values(chaptersMap).forEach((chapter) => {
    chapter.subLessons.sort((a, b) => {
      if (a.order_index !== b.order_index) return a.order_index - b.order_index;
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
      if (!user) { navigate('/login'); return; }
      setUserId(user.id);

      const doneIds = await fetchCompletedLessonIds(user.id);
      setCompletedLessons(Array.isArray(doneIds) ? doneIds : []);

      // FETCH
      const allLessons = await fetchAllLessons();

      // DEBUG LOGS
      console.log("--- DEBUG COURSE MAP ---");
      console.log("Total lessons fetched:", allLessons.length);
      console.log("Sample lesson IDs:", allLessons.slice(0, 5).map(l => l.id));
      const readingLessons = allLessons.filter(l => l.id >= 10000);
      console.log("Reading lessons (ID >= 10000) count:", readingLessons.length);
      if (readingLessons.length === 0) {
        console.error("CRITICAL: No reading lessons fetched! Check fetchAllLessons query.");
      }

      if (!allLessons.length) { setChapters({}); return; }

      const builtMap = buildChaptersMap(allLessons);
      setChapters(builtMap);

      const lastOpened = await fetchLastOpenedProgress(user.id);
      setLastOpenedBlockId(lastOpened?.last_opened_block_id ?? null);
      setLastOpenedLessonId(lastOpened?.last_opened_lesson_id ?? null);

    } catch (e) {
      console.error('CRITICAL MAP ERROR:', e);
      setError('Unable to load course map.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  return {
    userId, loading, completedLessons, lastOpenedBlockId, lastOpenedLessonId, chapters, error, navigate, refresh: fetchAllData
  };
}