import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, LogIn, ShieldCheck } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white p-6 text-center overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="mb-10 z-10 relative">
        <div className="text-8xl drop-shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce-slow">
          🇰🇭
        </div>
      </div>

      <div className="z-10">
        <h1 className="text-6xl font-black text-white mb-2 tracking-tighter uppercase">
          KHMER<br/>
          <span className="text-emerald-400">MASTERY</span>
        </h1>

        <p className="text-gray-500 mb-14 text-lg max-w-xs mx-auto font-medium leading-tight">
          The premium survival guide for expats in the Kingdom.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
          <button
            onClick={() => navigate('/login')}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black py-5 px-8 rounded-2xl transition-all shadow-[0_10px_30px_rgba(16,185,129,0.3)] transform active:scale-95 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm"
          >
            <LogIn size={18} strokeWidth={3} /> Get Started
          </button>

          <button
            onClick={() => navigate('/map')}
            className="bg-transparent hover:bg-white/5 text-gray-400 font-bold py-5 px-8 rounded-2xl border border-white/10 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-sm"
          >
            <Play size={18} fill="currentColor" /> Preview Map
          </button>
        </div>
      </div>

      <div className="absolute bottom-10 text-gray-700 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
        <ShieldCheck size={14} /> Secure Expat Portal
      </div>
    </div>
  );
};

export default Welcome;