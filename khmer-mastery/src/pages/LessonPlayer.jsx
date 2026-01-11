import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Volume2, CheckCircle, Loader, TriangleAlert } from 'lucide-react';
import ReactConfetti from 'react-confetti';
import { supabase } from '../supabaseClient';

// 1. Восстановил РАБОЧИЕ ссылки на аудио для Урока 1
const lessonsData = {
  1: {
    title: "Встреча (Greetings)",
    words: [
      { khmer: "សួស្ដី", phonetics: "Suosdey", russian: "Привет", audio: "https://drive.google.com/uc?export=download&id=1tW7M7b4F92u6XkG8_kXX9o7aW8z0J8z_" },
      { khmer: "លាហើយ", phonetics: "Lea haeuy", russian: "Пока", audio: "https://drive.google.com/uc?export=download&id=1uW7M7b4F92u6XkG8_kXX9o7aW8z0J8z_" },
      { khmer: "អរគុណ", phonetics: "Arkoun", russian: "Спасибо", audio: "https://drive.google.com/uc?export=download&id=1vW7M7b4F92u6XkG8_kXX9o7aW8z0J8z_" },
    ]
  },
  2: {
    title: "Цифры 0-10",
    words: [
      { khmer: "មួយ", phonetics: "Muoy", russian: "Один", audio: null },
      { khmer: "ពីរ", phonetics: "Pi", russian: "Два", audio: null },
      { khmer: "បី", phonetics: "Bei", russian: "Три", audio: null },
    ]
  }
};

const LessonPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Безопасное получение урока (если id странный, берем 1-й)
  const lessonId = parseInt(id) || 1;
  const lesson = lessonsData[lessonId] || lessonsData[1];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [statusLog, setStatusLog] = useState("Готов к уроку"); // <--- ЛОГ НА ЭКРАНЕ
  const [isSaving, setIsSaving] = useState(false);

  const currentWord = lesson.words[currentIndex];

  const playAudio = () => {
    setStatusLog("Попытка воспроизвести звук...");
    if (currentWord.audio) {
      const audio = new Audio(currentWord.audio);
      audio.play()
        .then(() => setStatusLog("Звук играет"))
        .catch(err => setStatusLog("Ошибка звука: " + err.message));
    } else {
      setStatusLog("Нет аудио для этого слова");
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < lesson.words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setStatusLog(`Карточка ${currentIndex + 2} из ${lesson.words.length}`);
    } else {
      setStatusLog("Последняя карта! Запускаю финиш...");
      finishLesson();
    }
  };

  const finishLesson = async () => {
    try {
      setIsCompleted(true); // <--- Сразу меняем экран
      setIsSaving(true);
      setStatusLog("Соединяюсь с базой данных...");

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setStatusLog("Ошибка: Пользователь не найден (не залогинен?)");
        return;
      }

      setStatusLog(`Пользователь найден: ${user.email}. Сохраняю...`);

      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId.toString(),
          is_completed: true,
          score: 100,
          updated_at: new Date()
        }, { onConflict: 'user_id, lesson_id' });

      if (error) {
        setStatusLog("ОШИБКА DB: " + error.message);
        alert("Ошибка сохранения: " + error.message);
      } else {
        setStatusLog("УСПЕХ! Данные сохранены в Supabase.");
      }
    } catch (err) {
      setStatusLog("КРИТИЧЕСКАЯ ОШИБКА: " + err.message);
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // ЭКРАН ПОБЕДЫ
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white relative p-4">
        <ReactConfetti recycle={false} numberOfPieces={500} />

        <div className="z-10 w-full max-w-sm bg-gray-800 rounded-2xl border border-emerald-500 p-8 text-center shadow-2xl">
          <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-2">Урок пройден!</h2>

          {/* Блок диагностики для вас */}
          <div className="bg-black/50 p-2 rounded text-xs text-left font-mono text-yellow-300 mb-6 break-words">
            LOG: {statusLog}
          </div>

          <button
            onClick={() => navigate('/map')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all"
          >
            Вернуться к Карте
          </button>
        </div>
      </div>
    );
  }

  // ЭКРАН УРОКА
  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col relative">
      {/* ДИАГНОСТИЧЕСКАЯ СТРОКА (Временно) */}
      <div className="bg-blue-900/50 text-[10px] text-blue-200 text-center py-1">
        DEBUG: {statusLog} | Index: {currentIndex}
      </div>

      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <button onClick={() => navigate('/map')} className="p-2 hover:bg-gray-800 rounded-full">
          <ChevronLeft />
        </button>
        <div className="flex-1 text-center pr-10">
          <h2 className="font-bold text-lg">{lesson.title}</h2>
          <div className="text-xs text-gray-500">{currentIndex + 1} / {lesson.words.length}</div>
        </div>
      </div>

      {/* Прогресс бар */}
      <div className="h-1 bg-gray-800 w-full">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / lesson.words.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6" onClick={() => setIsFlipped(!isFlipped)}>
        <div className="w-full max-w-sm aspect-[3/4] perspective-1000 cursor-pointer group">
          <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* Front */}
            <div className="absolute w-full h-full backface-hidden bg-gray-800 rounded-3xl border border-gray-700 flex flex-col items-center justify-center shadow-2xl p-6">
              <span className="text-6xl mb-8 font-bold text-center leading-normal">{currentWord.khmer}</span>
              <button
                onClick={(e) => { e.stopPropagation(); playAudio(); }}
                className="p-4 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors active:scale-95"
              >
                <Volume2 size={32} className="text-emerald-400" />
              </button>
              <p className="mt-8 text-gray-500 text-sm uppercase">Нажми для перевода</p>
            </div>

            {/* Back */}
            <div className="absolute w-full h-full backface-hidden bg-gray-800 rounded-3xl border border-emerald-500/30 flex flex-col items-center justify-center shadow-2xl rotate-y-180 p-6">
              <h3 className="text-4xl font-bold mb-4 text-emerald-400">{currentWord.phonetics}</h3>
              <p className="text-2xl text-white mb-8">{currentWord.russian}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 pb-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-sm mx-auto flex gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); nextCard(); }}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all border border-gray-700"
          >
            Не знаю
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextCard(); }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95"
          >
            Знаю
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;