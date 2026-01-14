import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Play } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';

const Home = () => {
  const navigate = useNavigate();
  return (
    <MobileLayout withNav={true}>
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-cyan-500/5 animate-pulse"></div>
        <div className="z-10 text-center">
          <div className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(0,224,255,0.5)]">
             <BookOpen size={48} className="text-black" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tighter">
            Khmer<span className="text-cyan-400">Mastery</span>
          </h1>
          <p className="text-gray-400 mb-12 text-lg max-w-xs mx-auto italic">
            Learn the language of wonders. One card at a time.
          </p>
          <Button
            onClick={() => navigate('/map')}
            className="max-w-xs mx-auto"
          >
            <Play size={24} fill="black" /> Start Journey
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Home;