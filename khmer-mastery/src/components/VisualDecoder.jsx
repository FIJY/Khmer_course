import React, { useState, useEffect } from 'react';
import { Volume2, ArrowRight, CheckCircle2, Search, XCircle } from 'lucide-react';

export default function VisualDecoder({ data, onComplete }) {
  const { word, target_char, hint, english_translation, audio, family_icon } = data;

  const [status, setStatus] = useState('searching'); // searching | success | error
  const [selectedCharIndex, setSelectedCharIndex] = useState(null);

  // Разбиваем слово на массив символов для кликабельности
  // Внимание: Кхмерские символы могут быть сложными, но для начала просто split('') подойдет
  // Если будут баги с подписными, используем Intl.Segmenter, но пока так:
  const chars = word.split('');

  const handleCharClick = (char, index) => {
    if (status === 'success') return;

    setSelectedCharIndex(index);

    if (char === target_char) {
      // ПОБЕДА
      setStatus('success');
      playAudio('success.mp3');
      if (audio) playAudio(audio); // Произносим слово целиком
    } else {
      // ОШИБКА
      setStatus('error');
      playAudio('error.mp3');
      // Через секунду сбрасываем ошибку, чтобы можно было искать дальше
      setTimeout(() => {
        setStatus('searching');
        setSelectedCharIndex(null);
      }, 1000);
    }
  };

  const playAudio = (file) => {
    new Audio(`/sounds/${file}`).play().catch(() => {});
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">

      {/* 1. ЗАГОЛОВОК СЕМЬИ (Домик, Змейка и т.д.) */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-3xl mb-3 border border-white/10 shadow-lg animate-bounce">
          {family_icon || '🔍'}
        </div>
        <h3 className="text-cyan-400 font-black uppercase tracking-widest text-xs mb-1">Visual Decoder</h3>
        <p className="text-white font-bold text-lg">{hint}</p>
      </div>

      {/* 2. СЛОВО-ГОЛОВОЛОМКА */}
      <div className="flex flex-wrap justify-center gap-1 mb-12">
        {chars.map((char, index) => {
          // Определяем стиль для каждой буквы
          let charStyle = "bg-gray-900 border-white/10 text-white";

          if (status === 'success') {
            if (char === target_char) charStyle = "bg-emerald-500 border-emerald-400 text-black scale-110 shadow-[0_0_30px_rgba(16,185,129,0.5)] z-10";
            else charStyle = "bg-black border-transparent text-gray-700 opacity-30 blur-[1px]"; // Остальные затемняем
          } else if (status === 'error' && selectedCharIndex === index) {
            charStyle = "bg-red-500 border-red-500 text-white animate-shake";
          } else {
             // Обычное состояние - ховер
             charStyle = "bg-gray-800 border-white/20 hover:bg-gray-700 cursor-pointer hover:border-cyan-500 hover:text-cyan-400";
          }

          return (
            <button
              key={index}
              onClick={() => handleCharClick(char, index)}
              className={`w-14 h-20 sm:w-16 sm:h-24 rounded-2xl border-2 flex items-center justify-center text-3xl sm:text-4xl font-serif transition-all duration-300 ${charStyle}`}
            >
              {char}
            </button>
          );
        })}
      </div>

      {/* 3. ПЕРЕВОД (Появляется при успехе) */}
      <div className={`text-center transition-all duration-500 ${status === 'success' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <h2 className="text-2xl font-black text-white mb-2">{word}</h2>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-8">{english_translation}</p>

        <button
          onClick={() => onComplete()}
          className="px-8 py-4 bg-emerald-500 text-black rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-emerald-400 transition-all"
        >
          Continue <ArrowRight size={20} />
        </button>
      </div>

      {/* CSS для тряски при ошибке */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
      `}</style>
    </div>
  );
}