import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Volume2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import ReactConfetti from 'react-confetti';
import { supabase } from '../supabaseClient'; // <--- Подключаем базу данных

// Временная база данных уроков (пока не перенесли в Supabase)
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

  const lesson = lessonsData[id] || lessonsData[1];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // <--- Индикатор сохранения

  const currentWord = lesson.words[currentIndex];

  const playAudio = () => {
    if (currentWord.audio) {
      new Audio(currentWord.audio).play();
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    if (currentIndex < lesson.words.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      finishLesson();
    }
  };

  // Функция сохранения в базу данных
  const finishLesson = async () => {
    setIsCompleted(true);
    setIsSaving(true);

    try {
      // 1. Узнаем, кто сейчас играет (кто залогинен)
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 2. Отправляем запись в таблицу user_progress
        const { error } = await supabase
          .from('user_progress')
          .upsert({
            user_id: user.id,
            lesson_id: id,
            is_completed: true,
            score: 100, // Пока ставим максимум, позже сделаем логику
            updated_at: new Date()
          }, { onConflict: 'user_id, lesson_id' }); // Если запись уже есть — обновим её

        if (error) console.error('Ошибка сохранения:', error);
        else console.log('Прогресс сохранен успешно!');
      }
    } catch (err) {
      console.error('Сбой сохранения:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white relative overflow-hidden">
        <ReactConfetti recycle={false} numberOfPieces={500} />

        <div className="z-10 text-center p-8 bg-gray-800 rounded-2xl border border-emerald-500/50 shadow-2xl max-w-sm mx-4">
          <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-2">Урок пройден!</h2>
          <p className="text-gray-400 mb-6">Вы выучили {lesson.words.length} новых слов.</p>

          {isSaving ? (
            <div className="flex justify-center items-center gap-2 text-sm text-emerald-400 mb-6">
              <Loader className="animate-spin" size={16} /> Сохраняем результат...
            </div>
          ) : (
            <div className="text-sm text-emerald-400 mb-6 font-semibold">
              ✓ Результат сохранен в облако
            </div>
          )}

          <button
            onClick={() => navigate('/map')}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
          >
            Вернуться к Карте
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-gray-800">
        <button onClick={() => navigate('/map')} className="p-2 hover:bg-gray-800 rounded-full">
          <ChevronLeft />
        </button>
        <div className="flex-1 text-center pr-10">
          <h2 className="font-bold text-lg">{lesson.title}</h2>
          <div className="text-xs text-gray-500">{currentIndex + 1} из {lesson.words.length}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-800 w-full">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / lesson.words.length) * 100}%` }}
        />
      </div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6" onClick={() => setIsFlipped(!isFlipped)}>
        <div className="w-full max-w-sm aspect-[3/4] perspective-1000 cursor-pointer group">
          <div className={`relative w-full h-full duration-500 preserve-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* Front Side (Khmer) */}
            <div className="absolute w-full h-full backface-hidden bg-gray-800 rounded-3xl border border-gray-700 flex flex-col items-center justify-center shadow-2xl p-6">
              <span className="text-6xl mb-8 font-bold text-center leading-normal">{currentWord.khmer}</span>
              <button
                onClick={(e) => { e.stopPropagation(); playAudio(); }}
                className="p-4 bg-gray-700 rounded-full hover:bg-gray-600 transition-colors"
              >
                <Volume2 size={32} className="text-emerald-400" />
              </button>
              <p className="mt-8 text-gray-500 text-sm uppercase tracking-widest">Нажмите, чтобы перевернуть</p>
            </div>

            {/* Back Side (Russian) */}
            <div className="absolute w-full h-full backface-hidden bg-gray-800 rounded-3xl border border-emerald-500/30 flex flex-col items-center justify-center shadow-2xl rotate-y-180 p-6">
              <h3 className="text-4xl font-bold mb-4 text-emerald-400">{currentWord.phonetics}</h3>
              <p className="text-2xl text-white mb-8">{currentWord.russian}</p>
              <p className="text-gray-500 text-sm">Транскрипция и перевод</p>
            </div>

          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-6 pb-10 bg-gray-900 border-t border-gray-800">
        <div className="max-w-sm mx-auto flex gap-4">
          <button
            onClick={(e) => { e.stopPropagation(); nextCard(); }}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-4 rounded-xl transition-all border border-gray-700"
          >
            Не знаю
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextCard(); }}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
          >
            Знаю
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;