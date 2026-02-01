import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchLessonById, fetchLessonItemsByLessonId } from '../data/lessons';
import { fetchCurrentUser } from '../data/auth';
import { markLessonCompleted } from '../data/progress';
// ПРАВИЛЬНЫЙ ИМПОРТ: используем тот же путь, что в твоих файлах lessons.js и auth.js
import { supabase } from '../supabaseClient';

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

  // Добавляем состояние для словаря алфавита
  const [alphabetDb, setAlphabetDb] = useState(new Map());

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

      // Загружаем всё параллельно, добавляя запрос к таблице alphabet
      const [lesson, rawItemsResponse, alphabetResponse] = await Promise.all([
        resolvedIdentifier !== null ? fetchLessonById(resolvedIdentifier) : (id === 'sandbox' ? fallbackLesson.current : null),
        fetchLessonItemsByLessonId(resolvedIdentifier || id),
        supabase.from('alphabet').select('*')
      ]);

      // Создаем карту (словарь) для мгновенного поиска типа символа
      const alphaMap = new Map();
      if (alphabetResponse.data) {
        alphabetResponse.data.forEach(charEntry => {
          alphaMap.set(charEntry.id, charEntry);
        });
      }
      setAlphabetDb(alphaMap);

      let lessonData = lesson;
      if (!lessonData && id === 'sandbox') {
        lessonData = fallbackLesson.current;
      }

      if (!lessonData) {
        setError('Lesson not found.');
        return;
      }

      setLessonInfo(lessonData);
      const resolvedLessonId = lessonData?.lesson_id ?? lessonData?.id ?? resolvedIdentifier ?? id;
      setLessonId(resolvedLessonId);

      let rawItems = rawItemsResponse;

      if ((!rawItems || rawItems.length === 0) && lessonData.content && Array.isArray(lessonData.content)) {
          rawItems = lessonData.content.map((item, index) => ({
            ...item,
            id: index,
            data: item.data || item
          }));
      }

      const normalizedItems = (Array.isArray(rawItems) ? rawItems : []).map(item => {
        const itemContent = item.data ? normalizeItemData(item.data) : item;
        const rawType = item.type || itemContent.type;
        const type = rawType ? String(rawType).toLowerCase() : rawType;

        if (type !== 'quiz') {
            return { type, data: itemContent };
        }

        const normalizeQuizOption = (option) => {
          if (option && typeof option === 'object') {
            const value = option.value ?? option.text ?? option.answer ?? option.label ?? '';
            return {
              value: String(value).trim(),
              text: option.text ?? option.label ?? option.value ?? option.answer ?? '',
              audio: option.audio ?? null,
              pronunciation: option.pronunciation ?? ''
            };
          }
          const value = option ?? '';
          return { value: String(value).trim(), text: String(value), audio: null, pronunciation: '' };
        };

        const options = Array.isArray(itemContent.options) ? itemContent.options.filter(Boolean) : [];
        const correctAnswer = itemContent.correct_answer;
        const normalizedOptions = options.map(normalizeQuizOption);
        const normalizedCorrect = correctAnswer ? normalizeQuizOption(correctAnswer) : null;
        const mergedOptions = normalizedCorrect
          ? [...normalizedOptions, normalizedCorrect]
          : normalizedOptions;
        const uniqueOptionsMap = new Map();
        mergedOptions.forEach((option) => {
          if (!uniqueOptionsMap.has(option.value)) {
            uniqueOptionsMap.set(option.value, option);
          }
        });
        const shuffledOptions = shuffleArray(Array.from(uniqueOptionsMap.values()));

        return {
          type,
          data: {
            ...itemContent,
            options: shuffledOptions,
            correct_answer: normalizedCorrect?.value ?? normalizedCorrect?.text ?? ''
          }
        };
      });

      const finalItems = id === 'sandbox' && normalizedItems.length === 0
        ? [{
            type: 'theory',
            data: {
              title: 'Sandbox Lesson',
              text: "This lesson doesn't have content yet. Check back soon."
            }
          }]
        : normalizedItems;

      setItems(finalItems);
      setQuizCount(finalItems.filter(i => String(i.type).toLowerCase() === 'quiz').length || 0);
    } catch (err) {
      console.error(err);
      setError('Unable to load this lesson.');
    } finally {
      setLoading(false);
    }
  }, [id, normalizeItemData, resolveLessonIdentifier]);

  useEffect(() => { fetchLessonData(); }, [fetchLessonData]);

  useEffect(() => {
      setCanAdvance(false);
      setSelectedOption(null);
      setIsFlipped(false);
      if (audioTimeoutRef.current) clearTimeout(audioTimeoutRef.current);

      const currentItem = items[step];
      const currentType = currentItem?.type ? String(currentItem?.type).toLowerCase() : '';

      const autoUnlockTypes = [
        'theory', 'learn_char', 'word_breakdown', 'title',
        'meet-teams', 'rule', 'reading-algorithm', 'ready', 'analysis'
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

  const playLocalAudio = (audioFile) => {
    if (!audioFile) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    let fileName = String(audioFile).trim().replace(/(\.mp3)+$/i, '');
    const audioPath = `/sounds/${fileName}.mp3`;
    const audio = new Audio(audioPath);
    audioRef.current = audio;
    audio.play().catch((e) => console.error(`Audio failed: ${audioPath}`, e));
  };

  const handleVocabCardFlip = (audioFile) => {
    if (!isFlipped) playLocalAudio(audioFile);
    setIsFlipped(!isFlipped);
    setCanAdvance(true);
  };

  const handleQuizAnswer = (option, correctAnswer, selectedAudio) => {
    if (selectedOption) return;
    const optionValue = option && typeof option === 'object' ? option.value ?? option.text ?? option.answer ?? '' : option;
    const correctValue = correctAnswer && typeof correctAnswer === 'object'
      ? correctAnswer.value ?? correctAnswer.text ?? correctAnswer.answer ?? ''
      : correctAnswer;
    setSelectedOption(optionValue);
    setCanAdvance(true);
    const correct = String(optionValue).trim() === String(correctValue).trim();
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
    alphabetDb,
    current: items[step],
    currentIndex: step,
    total: items.length,
    refresh: fetchLessonData
  };
}
