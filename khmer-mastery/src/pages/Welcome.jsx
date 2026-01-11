import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, LogIn } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-900 text-white p-6 text-center overflow-hidden">
      {/* Decorative Background Element */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>

      <div className="mb-8 z-10">
        <span className="text-7xl drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">🇰🇭</span>
      </div>

      <h1 className="text-5xl font-black text-white mb-4 tracking-tighter">
        KHMER <span className="text-emerald-400">MASTERY</span>
      </h1>

      <p className="text-gray-400 mb-12 text-lg max-w-sm leading-relaxed">
        The ultimate survival guide for expats. <br/>
        Master the language, own the streets.
      </p>

      <div className="flex flex-col gap-4 w-full max-w-xs z-10">
        <button
          onClick={() => navigate('/login')}
          className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-black py-4 px-6 rounded-2xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] transform active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <LogIn size={20} /> Login
        </button>

        <button
          onClick={() => navigate('/map')}
          className="bg-gray-800 hover:bg-gray-700 text-emerald-400 font-bold py-4 px-6 rounded-2xl border border-gray-700 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
        >
          <Play size={20} fill="currentColor" /> View Course Map
        </button>
      </div>
    </div>
  );
};

export default Welcome;