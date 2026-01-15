import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';
import { getDueItems, updateSRSItem } from '../services/srsService';

const DEFAULT_SETTINGS = {
  mode: 'mix',
  showPhonetics: true,
  autoPlay: true,
  sessionLimit: 20
};

export default function useReviewSession() {
  const [sessionData, setSessionData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const audioRef = useRef(null);

  useEffect(() => { initSession(); }, []);

  useEffect(() => {
    if (!loading && !isFinished && sessionData.length > 0 && settings.autoPlay) {
      const item = sessionData[currentIndex];
      if (settings.mode === 'listen' || settings.autoPlay) {
        const timer = setTimeout(() => {
          if (item?.target?.audio) playAudio(item.target.audio);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, loading, isFinished, sessionData, settings.autoPlay, settings.mode]);

  const initSession = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const dueItems = await getDueItems(user.id);

      if (dueItems.length === 0) {
        setLoading(false);
        return;
      }

      const { data: allVocab } = await supabase
        .from('dictionary')
        .select('*')
        .neq('english', 'Quiz Answer')
        .neq('english', '')
        .limit(100);

      if (!allVocab || allVocab.length < 4) {
        setLoading(false);
        return;
      }

      const session = dueItems.slice(0, settings.sessionLimit).map(item => {
        const target = item.data || item.lesson_items?.data;
        if (!target || !target.front) return null;

        const distractors = allVocab
          .filter(v => v.english !== target.front && v.english !== target.english)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);

        return {
          srs_id: item.srs_id || item.id,
          target,
          options: shuffle([target, ...distractors])
        };
      }).filter(Boolean);

      setSessionData(session);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());

  const playAudio = (file) => {
    if (!file) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(`/sounds/${file}`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handleAnswer = async (option) => {
    const current = sessionData[currentIndex];
    setSelectedOption(option);

    const targetEng = current.target.front || current.target.english;
    const optionEng = option.front || option.english;
    const isCorrect = optionEng === targetEng;

    playAudio(isCorrect ? 'success.mp3' : 'error.mp3');
    await updateSRSItem((await supabase.auth.getUser()).data.user.id, current.srs_id, isCorrect ? 4 : 1);
  };

  const nextCard = () => {
    if (currentIndex < sessionData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  const getCardMode = () => {
    if (settings.mode === 'mix') {
      const modes = ['read', 'recall', 'listen'];
      return modes[Math.floor(Math.random() * modes.length)];
    }
    return settings.mode;
  };

  return {
    loading,
    sessionData,
    currentIndex,
    selectedOption,
    isFinished,
    showSettings,
    settings,
    setSettings,
    setShowSettings,
    playAudio,
    handleAnswer,
    nextCard,
    getCardMode
  };
}
