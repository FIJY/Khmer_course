import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative overflow-hidden bg-black">
      <div className="absolute inset-0 bg-brand/5 animate-pulse"></div>
      <div className="z-10 text-center">
        <div className="w-24 h-24 bg-brand rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(0,224,255,0.5)]">
           <BookOpen size={48} className="text-black" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-4 tracking-tighter">
          Khmer<span className="text-brand">Mastery</span>
        </h1>
        <p className="text-gray-400 mb-12 text-lg max-w-xs mx-auto">
          Learn the language of wonders. One card at a time.
        </p>
        <button
          onClick={() => navigate('/map')}
          className="bg-brand text-black font-bold py-4 px-12 rounded-full text-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(0,224,255,0.4)] flex items-center gap-3 mx-auto"
        >
          <Play size={24} fill="black" /> Start Journey
        </button>
      </div>
    </div>
  );
};

export default Home;