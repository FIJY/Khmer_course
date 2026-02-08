import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { fetchCurrentUser } from '../data/auth';
import { fetchDictionaryEntries } from '../data/review';
import { getDueItems, updateSRSItem } from '../services/srsService';
import useAudioPlayer from './useAudioPlayer';

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
  const [error, setError] = useState(null);
  const [emptyReason, setEmptyReason] = useState(null);
  const { play: playAudio } = useAudioPlayer();

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
  }, [currentIndex, loading, isFinished, sessionData, settings.autoPlay, settings.mode, playAudio]);

  const initSession = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setEmptyReason(null);
      const user = await fetchCurrentUser();
      if (!user) {
        setError('Please sign in to start a review session.');
        return;
      }
      const dueItems = await getDueItems(user.id);

      if (dueItems.length === 0) {
        setEmptyReason('no_due');
        setLoading(false);
        return;
      }

      const allVocab = await fetchDictionaryEntries();
      if (allVocab.length < 4) {
        setEmptyReason('insufficient_vocab');
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
      setError('Unable to start a review session right now.');
    } finally {
      setLoading(false);
    }
  }, [settings.sessionLimit]);

  useEffect(() => { initSession(); }, [initSession]);

  const shuffle = (array) => [...array].sort(() => 0.5 - Math.random());

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
    error,
    emptyReason,
    playAudio,
    handleAnswer,
    nextCard,
    getCardMode,
    refresh: initSession
  };
}
