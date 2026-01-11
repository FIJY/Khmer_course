import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, LogIn } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6 text-center font-sans">
      <div className="mb-12">
        <span className="text-8xl drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">🇰🇭</span>
      </div>

      <h1 className="text-6xl font-bold text-white mb-4 tracking-tight uppercase">
        Khmer <span className="text-cyan-400">Mastery</span>
      </h1>

      <p className="text-gray-500 mb-14 text-lg max-w-xs mx-auto leading-snug">
        The essential survival guide for expats. Master the language of wonders.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          onClick={() => navigate('/login')}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-black py-5 px-6 rounded-2xl transition-all shadow-lg transform active:scale-95 uppercase tracking-widest text-sm"
        >
          Get Started
        </button>

        <button
          onClick={() => navigate('/map')}
          className="bg-transparent hover:bg-white/5 text-gray-400 font-bold py-5 px-6 rounded-2xl border border-white/10 transition-all uppercase tracking-widest text-sm"
        >
          View Map
        </button>
      </div>
    </div>
  );
};

export default Welcome;