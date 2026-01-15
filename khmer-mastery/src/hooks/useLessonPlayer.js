import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  const audioRef = useRef(null);

  useEffect(() => { fetchLessonData(); }, [id]);

  useEffect(() => {
    setCanAdvance(false);
    setSelectedOption(null);
    setIsFlipped(false);
    if (items[step]?.type === 'theory') setCanAdvance(true);
  }, [step, items]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      const { data: lesson } = await supabase.from('lessons').select('*').eq('id', id).single();
      setLessonInfo(lesson);
      const { data: itemsData } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('lesson_id', id)
        .order('order_index', { ascending: true });
      setItems(itemsData || []);
      setQuizCount(itemsData?.filter(i => i.type === 'quiz').length || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < items.length - 1) {
      setStep(step + 1);
    } else {
      setLessonPassed(quizCount === 0 || (score / quizCount) >= 0.7);
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

  const handleQuizAnswer = (option, correctAnswer) => {
    setSelectedOption(option);
    setCanAdvance(true);
    const correct = option === correctAnswer;
    if (correct) setScore(s => s + 1);
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
    selectedOption,
    isFinished,
    lessonPassed,
    handleNext,
    playLocalAudio,
    handleVocabCardFlip,
    handleQuizAnswer,
    goBack,
    setCanAdvance
  };
}
