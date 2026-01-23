import React, { useState, useEffect, useMemo } from 'react';
import useCourseMap from '../../hooks/useCourseMap';
import VisualDecoder from '../VisualDecoder'; // Используем ТВОЙ готовый компонент!
import { X } from 'lucide-react';

const BootcampSession = ({ onClose }) => {
  const { loadUnitData } = useCourseMap(); // Твой хук для загрузки данных
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // 1. ЗАГРУЖАЕМ ДАННЫЕ ИЗ R1 (ID: 10000)
  useEffect(() => {
    const initBootcamp = async () => {
      const data = await loadUnitData('10000'); // Грузим Unit R1
      if (data && data.content) {
        // 2. ГЕНЕРИРУЕМ АРКАДУ
        // Берем все слайды типа 'visual_decoder' (Sun/Moon)
        const allDrills = data.content.flatMap(lesson =>
          lesson.slides.filter(s => s.type === 'visual_decoder')
        );

        // 3. ПЕРЕМЕШИВАЕМ (Fisher-Yates Shuffle)
        const shuffled = [...allDrills, ...allDrills] // Удваиваем для длины
          .sort(() => Math.random() - 0.5);

        setQuestions(shuffled);
      }
      setLoading(false);
    };
    initBootcamp();
  }, []);

  const handleComplete = (isCorrect) => {
    if (isCorrect) setScore(s => s + 10);
    // Мгновенный переход к следующему без кнопки Continue (для скорости)
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 500);
  };

  if (loading) return <div className="p-10 text-white text-center">Loading Mission...</div>;

  // Если вопросы кончились (или игрок устал)
  if (currentIndex >= questions.length) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">MISSION COMPLETE</h1>
        <p className="text-2xl mb-8">Score: {score}</p>
        <button onClick={onClose} className="px-8 py-3 bg-blue-600 rounded-xl">Back to Base</button>
      </div>
    );
  }

  const currentSlide = questions[currentIndex];

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col">
      {/* HEADER: Score & Exit */}
      <div className="flex justify-between items-center p-4 bg-slate-800">
        <div className="text-yellow-400 font-mono text-xl">SCORE: {score}</div>
        <button onClick={onClose}><X className="text-white w-8 h-8" /></button>
      </div>

      {/* THE ARENA */}
      <div className="flex-1 flex items-center justify-center p-4">
        {/* ВОТ ОНО: Мы переиспользуем твой VisualDecoder!
            Но добавляем key={currentIndex}, чтобы он пересоздавался мгновенно
            и не запоминал состояние прошлого вопроса.
        */}
        <VisualDecoder
            key={currentIndex}
            data={currentSlide}
            onComplete={() => handleComplete(true)}
            // Можно добавить проп в VisualDecoder: autoAdvance={true} если хочешь скрыть кнопку
        />
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-slate-800 w-full">
        <div
          className="h-full bg-yellow-400 transition-all duration-300"
          style={{ width: `${(currentIndex / questions.length) * 100}%` }}
        />
      </div>
    </div>
  );
};

export default BootcampSession;