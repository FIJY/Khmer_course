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

  const lessonData = {
    // ID 1: Greetings & Politeness
    1: [
      { khmer: "Suosdey", russian: "Привет" },
      { khmer: "Jumreap Sua", russian: "Здравствуйте (вежливо)" },
      { khmer: "Arkoun", russian: "Спасибо" },
      { khmer: "Min ey te", russian: "Не за что" }
    ],
    // ID 2: I Want... (Essential Needs)
    2: [
      { khmer: "Knhom jong ban...", russian: "Я хочу... (получить)" },
      { khmer: "Knhom jong tow...", russian: "Я хочу поехать в..." },
      { khmer: "Ban te?", russian: "Можно? (вопрос)" },
      { khmer: "Chhnganh", russian: "Вкусно" }
    ],
    // ID 3: Money & Numbers
    3: [
      { khmer: "Mouy, Pii, Bei", russian: "1, 2, 3" },
      { khmer: "Boun, Pram", russian: "4, 5" },
      { khmer: "Tlay punman?", russian: "Сколько стоит?" },
      { khmer: "Tlay nah!", russian: "Очень дорого!" }
    ],
    // ID 4: Survival Requests
    4: [
      { khmer: "Chhob", russian: "Остановитесь" },
      { khmer: "Som tow nih", russian: "Пожалуйста, сюда" },
      { khmer: "Chuoy phong!", russian: "Помогите!" },
      { khmer: "Bot chhveing", russian: "Поверните налево" }
    ]
  };

  const words = lessonData[id] || lessonData[1];
  const currentWord = words[step];
  const isLastStep = step >= words.length;

  useEffect(() => {
    if (isLastStep) {
      setShowConfetti(true);
      const saveProgress = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_progress').upsert({
            user_id: user.id,
            lesson_id: id,
            is_completed: true,
            updated_at: new Date()
          }, { onConflict: 'user_id, lesson_id' });
        }
      };
      saveProgress();
      setTimeout(() => setShowConfetti(false), 6000);
    }
  }, [isLastStep, id]);

  const playAudio = () => {
    const utterance = new SpeechSynthesisUtterance(currentWord.khmer);
    utterance.lang = 'km-KH';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  if (isLastStep) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
        {showConfetti && <Confetti numberOfPieces={200} recycle={false} />}
        <div className="bg-emerald-600 p-6 rounded-full mb-6 shadow-xl animate-bounce">
          <CheckCircle size={64} color="white" />
        </div>
        <h1 className="text-4xl font-bold text-emerald-400 mb-2">Excellent!</h1>
        <p className="text-gray-400 mb-8 text-lg">You've unlocked the next survival skill.</p>
        <button
          onClick={() => navigate('/map')}
          className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
        >
          <Home size={20} /> Back to Map
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <div className="w-full bg-gray-800 h-3">
        <div
          className="bg-emerald-500 h-full transition-all duration-700 ease-out"
          style={{ width: `${(step / words.length) * 100}%` }}
        ></div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <span className="text-emerald-500 font-mono mb-4 tracking-widest text-sm uppercase">Vocabulary Training</span>
        <h2 className="text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
          {currentWord.khmer}
        </h2>
        <p className="text-2xl text-emerald-400/80 mb-12 font-light italic">{currentWord.russian}</p>

        <button
          onClick={playAudio}
          className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center border-2 border-emerald-500/30 hover:border-emerald-500 transition-all shadow-2xl active:scale-90"
        >
          <Volume2 size={40} className="text-emerald-400" />
        </button>
      </div>

      <div className="p-8">
        <button
          onClick={() => setStep(s => s + 1)}
          className="w-full bg-emerald-600 py-5 rounded-2xl text-xl font-bold shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          Continue <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}