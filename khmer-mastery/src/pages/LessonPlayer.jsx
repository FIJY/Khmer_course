import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [log, setLog] = useState("Ожидание действий...");

  // Простой список слов без аудио (чтобы исключить ошибки звука)
  const words = [
    { k: "Suosdey", r: "Привет" },
    { k: "Lea haeuy", r: "Пока" },
    { k: "Arkoun", r: "Спасибо" }
  ];

  const currentWord = words[step];

  const saveResult = async () => {
    setLog("Начинаю сохранение...");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLog("Ошибка: Вы не вошли в систему!");
        return;
      }

      setLog(`Юзер: ${user.email}. Отправляю в базу...`);

      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: id || '1',
          is_completed: true,
          score: 100,
          updated_at: new Date()
        }, { onConflict: 'user_id, lesson_id' });

      if (error) throw error;
      setLog("✅ УСПЕХ! Всё сохранено. Можете выходить.");

    } catch (err) {
      setLog(`❌ ОШИБКА: ${err.message}`);
    }
  };

  // Если слова кончились — показываем финиш
  if (step >= words.length) {
    return (
      <div className="h-screen bg-black text-white p-10 flex flex-col items-center justify-center gap-6">
        <h1 className="text-3xl text-green-500">Урок окончен</h1>

        {/* Окно лога ошибок */}
        <div className="bg-gray-800 p-4 rounded w-full border border-gray-600 font-mono text-sm text-yellow-400">
          LOG: {log}
        </div>

        <button
          onClick={saveResult}
          className="bg-green-600 text-white p-4 rounded-xl text-xl w-full"
        >
          Сохранить прогресс
        </button>

        <button
          onClick={() => navigate('/map')}
          className="bg-gray-700 text-white p-4 rounded-xl w-full"
        >
          На карту
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white p-6 flex flex-col justify-between">
      <div className="text-center mt-10">
        <h2 className="text-4xl font-bold mb-4">{currentWord.k}</h2>
        <p className="text-2xl text-gray-400">{currentWord.r}</p>
      </div>

      <div className="flex gap-4 mb-10">
        <button
          onClick={() => setStep(s => s + 1)}
          className="flex-1 bg-blue-600 p-4 rounded-xl font-bold"
        >
          Дальше ({step + 1}/{words.length})
        </button>
      </div>

      <div className="text-xs text-gray-600 text-center">
        Безопасный режим v1.0
      </div>
    </div>
  );
}