import React from 'react';
import { useNavigate } from 'react-router-dom';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout withNav={false} className="justify-center items-center">
      <div className="text-center p-8 flex flex-col items-center">
        <div className="mb-12">
          <span className="text-8xl drop-shadow-[0_0_20px_rgba(34,211,238,0.3)]">🇰🇭</span>
        </div>

        <h1 className="text-6xl font-black text-white mb-4 tracking-tight uppercase italic">
          Khmer <span className="text-cyan-400">Mastery</span>
        </h1>

        <p className="text-gray-500 mb-14 text-lg max-w-xs mx-auto leading-tight font-bold italic">
          The essential survival guide for expats. Master the language of wonders.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button onClick={() => navigate('/login')}>
            Get Started
          </Button>

          <Button variant="outline" onClick={() => navigate('/map')}>
            View Map
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default Welcome;