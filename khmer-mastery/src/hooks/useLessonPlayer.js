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
  const audioRef = useRef(null);

  const fetchLessonData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const lesson = await fetchLessonById(id);
      if (!lesson) {
        setError('Lesson not found.');
        setLessonInfo(null);
        setItems([]);
        return;
      }
      setLessonInfo(lesson);
      const itemsData = await fetchLessonItemsByLessonId(id);
      const normalizedItems = itemsData.map(item => {
        if (item.type !== 'quiz') return item;
        const options = Array.isArray(item.data?.options) ? item.data.options.filter(Boolean) : [];
        const correctAnswer = item.data?.correct_answer;
        const mergedOptions = [...options];
        if (correctAnswer && !mergedOptions.includes(correctAnswer)) {
          mergedOptions.push(correctAnswer);
        }
        const uniqueOptions = [...new Set(mergedOptions)];
        return {
          ...item,
          data: {
            ...item.data,
            options: uniqueOptions
          }
        };
      });
      setItems(normalizedItems);
      setQuizCount(normalizedItems.filter(i => i.type === 'quiz').length || 0);
    } catch (err) {
      console.error(err);
      setError('Unable to load this lesson.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchLessonData(); }, [fetchLessonData]);

  useEffect(() => {
    setCanAdvance(false);
    setSelectedOption(null);
    setIsFlipped(false);
    if (items[step]?.type === 'theory') setCanAdvance(true);
  }, [step, items]);

  useEffect(() => {
    const persistCompletion = async () => {
      if (!isFinished || !lessonPassed) return;
      try {
        const user = await fetchCurrentUser();
        if (user) {
          await markLessonCompleted(user.id, id);
        }
      } catch (err) {
        console.error('Failed to save lesson completion', err);
      }
    };
    persistCompletion();
  }, [id, isFinished, lessonPassed]);

  const handleNext = () => {
    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      const didPass = quizCount === 0 || score === quizCount;
      setLessonPassed(didPass);
      setIsFinished(true);
    }
  };

  const playLocalAudio = (file) => {
    if (!file) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(`/sounds/${file}`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handleVocabCardFlip = (audioFile) => {
    if (!isFlipped) {
      playLocalAudio(audioFile);
    }
    setIsFlipped(!isFlipped);
    setCanAdvance(true);
  };

  const handleQuizAnswer = (option, correctAnswer, correctAudio) => {
    setSelectedOption(option);
    setCanAdvance(true);
    const correct = option === correctAnswer;
    if (correct) setScore(s => s + 1);
    if (correct && correctAudio) {
      playLocalAudio(correctAudio);
      return;
    }
    playLocalAudio(correct ? 'success.mp3' : 'error.mp3');
  };

  const goBack = () => setStep(s => s - 1);

  return {
    id,
    navigate,
    lessonInfo,
    items,
    step,
    score,
    quizCount,
    canAdvance,
    isFlipped,
    loading,
    error,
    selectedOption,
    isFinished,
    lessonPassed,
    handleNext,
    playLocalAudio,
    handleVocabCardFlip,
    handleQuizAnswer,
    goBack,
    setCanAdvance,
    refresh: fetchLessonData
  };
}
