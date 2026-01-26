import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchLessonById, fetchLessonItemsByLessonId } from '../data/lessons';
import { fetchCurrentUser } from '../data/auth';
import { markLessonCompleted } from '../data/progress';

export default function useLessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lessonInfo, setLessonInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [quizCount, setQuizCount] = useState(0);
  const [canAdvance, setCanAdvance] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [lessonPassed, setLessonPassed] = useState(false);
  const [error, setError] = useState(null);
  const [lessonId, setLessonId] = useState(id);
  const audioRef = useRef(null);
  const audioTimeoutRef = useRef(null);

  const fallbackLesson = useRef({
    id: 10000,
    lesson_id: 10000,
    title: 'Bootcamp: Unit R1'
  });

  const resolveLessonIdentifier = useCallback((rawId) => {
    if (rawId === 'sandbox') return fallbackLesson.current.lesson_id;
    const numericId = Number(rawId);
    return Number.isFinite(numericId) ? numericId : null;
  }, []);

  const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const normalizeItemData = useCallback((data) => {
    if (!data) return {};
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.warn('Failed to parse lesson item data', parseError);
        return {};
      }
    }
    if (typeof data === 'object') return data;
    return {};
  }, []);

  const fetchLessonData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const resolvedIdentifier = resolveLessonIdentifier(id);

      // 1. Загружаем сам урок
      let lesson = null;
      if (resolvedIdentifier !== null) {
        lesson = await fetchLessonById(resolvedIdentifier);
      }

      if (!lesson && id === 'sandbox') {
        lesson = fallbackLesson.current;
      }

      if (!lesson) {
        setError('Lesson not found.');
        return;
      }

      setLessonInfo(lesson);
      const resolvedLessonId = lesson?.lesson_id ?? lesson?.id ?? resolvedIdentifier ?? id;
      setLessonId(resolvedLessonId);

      // 2. Пробуем загрузить элементы из таблицы lesson_items
      let rawItems = await fetchLessonItemsByLessonId(resolvedLessonId);

      // 3. ФОЛБЭК: Если таблица lesson_items пуста, ищем контент внутри самого урока (JSON)
      if ((!rawItems || rawItems.length === 0) && lesson.content && Array.isArray(lesson.content)) {
          console.log("Using fallback content from lesson table");
          rawItems = lesson.content.map((item, index) => ({
            ...item,
            id: index,
            data: item.data || item
          }));
      }

      // 4. Нормализуем данные
      const normalizedItems = (Array.isArray(rawItems) ? rawItems : []).map(item => {
        const itemContent = item.data ? normalizeItemData(item.data) : item;
        const type = item.type || itemContent.type;

        if (type !== 'quiz') {
            return { type, data: itemContent };
        }

        const options = Array.isArray(itemContent.options) ? itemContent.options.filter(Boolean) : [];
        const correctAnswer = itemContent.correct_answer;
        const mergedOptions = [...options];

        if (correctAnswer && !mergedOptions.includes(correctAnswer)) {
          mergedOptions.push(correctAnswer);
        }

        const uniqueOptions = [...new Set(mergedOptions)];
        const shuffledOptions = shuffleArray(uniqueOptions);

        return {
          type,
          data: {
            ...itemContent,
            options: shuffledOptions
          }
        };
      });

      const fallbackItems = id === 'sandbox' && normalizedItems.length === 0
        ? [{
            type: 'theory',
            data: {
              title: 'Sandbox Lesson',
              text: "This lesson doesn't have content yet. Check back soon."
            }
          }]
        : normalizedItems;

      setItems(fallbackItems);
      setQuizCount(fallbackItems.filter(i => i.type === 'quiz').length || 0);
    } catch (err) {
      console.error(err);
      setError('Unable to load this lesson.');
    } finally {
      setLoading(false);
    }
  }, [id, normalizeItemData, resolveLessonIdentifier]);

  useEffect(() => { fetchLessonData(); }, [fetchLessonData]);

  // Логика разблокировки кнопки "Далее"
  useEffect(() => {
      setCanAdvance(false);
      setSelectedOption(null);
      setIsFlipped(false);
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);

      const currentType = items[step]?.type;

      const autoUnlockTypes = [
        'theory',
        'learn_char',
        'word_breakdown',
        'title',
        'meet-teams',
        'rule',
        'reading-algorithm',
        'ready'
      ];

      if (autoUnlockTypes.includes(currentType)) {
          setCanAdvance(true);
      }

      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
      }
  }, [step, items]);

  useEffect(() => {
    const persistCompletion = async () => {
      if (!isFinished || !lessonPassed) return;
      try {
        const user = await fetchCurrentUser();
        if (user) await markLessonCompleted(user.id, lessonId);
      } catch (err) {
        console.error('Failed to save lesson completion', err);
      }
    };
    persistCompletion();
  }, [id, isFinished, lessonId, lessonPassed]);

  const handleNext = () => {
    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      const didPass = quizCount === 0 || score === quizCount;
      setLessonPassed(didPass);
      setIsFinished(true);
    }
  };

  // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ ЗВУКА ---
  const playLocalAudio = (audioFile) => {
    if (!audioFile) {
        console.warn("Audio file name is missing");
        return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // 1. Приводим к строке и чистим пробелы
    let fileName = String(audioFile).trim();

    // 2. ЯДЕРНОЕ РЕШЕНИЕ: Убираем ВСЕ .mp3 с конца строки (один или много раз)
    // (\.mp3)+ означает "группа .mp3 повторяется 1 или более раз"
    // Флаг 'i' делает поиск нечувствительным к регистру (.MP3 тоже уйдет)
    fileName = fileName.replace(/(\.mp3)+$/i, '');

    // 3. Теперь fileName гарантированно чистый (например "vowel_aa").
    // Добавляем .mp3 ровно ОДИН раз.
    const audioPath = `/sounds/${fileName}.mp3`;

    console.log('Playing clean path:', audioPath);

    const audio = new Audio(audioPath);
    audioRef.current = audio;

    audio.play().catch((e) => {
      console.error(`Audio play failed for ${audioPath}:`, e);
    });
  };
  // ------------------------------------------------

  const handleVocabCardFlip = (audioFile) => {
    if (!isFlipped) playLocalAudio(audioFile);
    setIsFlipped(!isFlipped);
    setCanAdvance(true);
  };

  const handleQuizAnswer = (option, correctAnswer, selectedAudio) => {
    if (selectedOption) return;

    setSelectedOption(option);
    setCanAdvance(true);

    const cleanOption = String(option).trim();
    const cleanCorrect = String(correctAnswer).trim();
    const correct = cleanOption === cleanCorrect;

    if (correct) setScore(s => s + 1);
    playLocalAudio(correct ? 'success.mp3' : 'error.mp3');

    if (selectedAudio) {
        if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);
        audioTimeoutRef.current = setTimeout(() => {
            playLocalAudio(selectedAudio);
        }, 800);
    }
  };

  const goBack = () => setStep(s => s - 1);

  return {
    id, navigate, lessonInfo, items, step, score, quizCount, canAdvance, isFlipped,
    loading, error, selectedOption, isFinished, lessonPassed, handleNext,
    playLocalAudio, handleVocabCardFlip, handleQuizAnswer, goBack, setCanAdvance,
    refresh: fetchLessonData
  };
}