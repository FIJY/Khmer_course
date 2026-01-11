import React from 'react';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center">
      <div className="mb-8">
        <span className="text-6xl">🇰🇭</span>
      </div>
      <h1 className="text-4xl font-bold text-emerald-400 mb-4">Khmer Mastery</h1>
      <p className="text-gray-400 mb-8 text-lg">
        Учите кхмерский язык легко и эффективно.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => navigate('/login')}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg transform active:scale-95"
        >
          Войти (Login)
        </button>

        <button
          onClick={() => navigate('/map')}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold py-3 px-6 rounded-lg border border-gray-700 transition-all"
        >
          Посмотреть карту уроков
        </button>
      </div>
    </div>
  );
};

export default Welcome;