import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { supabase } from '../supabaseClient';
import { Volume2, ArrowRight, CheckCircle, Home } from 'lucide-react';

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [saving, setSaving] = useState(false);

  // Данные урока (в будущем будем тянуть из базы)
  const lessonData = {
    1: [
      { khmer: "Suosdey", russian: "Привет", audio: "/audio/suosdey.mp3" },
      { khmer: "Lea haeuy", russian: "До свидания", audio: "/audio/leahaeuy.mp3" },
      { khmer: "Arkoun", russian: "Спасибо", audio: "/audio/arkoun.mp3" }
    ],
    // Заглушка для остальных уроков
    default: [
      { khmer: "Test Word", russian: "Тестовое слово", audio: null }
    ]
  };

  const words = lessonData[id] || lessonData.default;
  const currentWord = words[step];
  const isLastStep = step >= words.length;

  // Функция сохранения победы
  const finishLesson = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_progress').upsert({
          user_id: user.id,
          lesson_id: id,
          is_completed: true,
          score: 100,
          updated_at: new Date()
        }, { onConflict: 'user_id, lesson_id' });
      }
    } catch (error) {
      console.error("Ошибка сохранения:", error);
    } finally {
      setSaving(false);
    }
  };

  // Эффект победы
  useEffect(() => {
    if (isLastStep) {
      setShowConfetti(true);
      finishLesson();
      // Выключаем салют через 6 секунд, чтобы не перегреть телефон
      const timer = setTimeout(() => setShowConfetti(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [isLastStep]);

  // Воспроизведение звука (пока заглушка через браузер)
  const playAudio = () => {
    // Если есть реальный файл - можно раскомментировать:
    // new Audio(currentWord.audio).play();

    // Пока используем синтез речи браузера (чтобы точно работало)
    const utterance = new SpeechSynthesisUtterance(currentWord.khmer);
    utterance.lang = 'km-KH'; // Пытаемся говорить на кхмерском (или английском)
    window.speechSynthesis.speak(utterance);
  };

  // ЭКРАН ПОБЕДЫ
  if (isLastStep) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
        {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}

        <div className="bg-emerald-600 p-6 rounded-full mb-6 shadow-lg animate-bounce">
          <CheckCircle size={64} color="white" />
        </div>

        <h1 className="text-4xl font-bold text-emerald-400 mb-2">Урок пройден!</h1>
        <p className="text-gray-400 mb-8">Отличная работа, так держать.</p>

        <button
          onClick={() => navigate('/map')}
          className="w-full max-w-xs bg-gray-700 hover:bg-gray-600 text-white py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <Home size={20} />
          Вернуться на карту
        </button>
      </div>
    );
  }

  // ЭКРАН УРОКА
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Прогресс бар */}
      <div className="w-full bg-gray-800 h-2">
        <div
          className="bg-emerald-500 h-2 transition-all duration-500"
          style={{ width: `${((step) / words.length) * 100}%` }}
        ></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        <div className="text-center">
          <h2 className="text-5xl font-bold mb-4 tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
            {currentWord.khmer}
          </h2>
          <p className="text-2xl text-gray-400 font-light">{currentWord.russian}</p>
        </div>

        {/* Кнопка звука */}
        <button
          onClick={playAudio}
          className="p-6 bg-gray-800 rounded-full shadow-lg border border-gray-700 active:scale-95 transition-transform hover:border-emerald-500"
        >
          <Volume2 size={40} className="text-emerald-400" />
        </button>
      </div>

      {/* Кнопка Далее */}
      <div className="p-6 pb-10">
        <button
          onClick={() => setStep(s => s + 1)}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl text-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          Дальше <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}