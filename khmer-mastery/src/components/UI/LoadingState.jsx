import React from 'react';

export default function LoadingState({
  label = 'Loading...',
  fullScreen = true,
  className = ''
}) {
  const heightClass = fullScreen ? 'h-screen' : 'h-auto';
  return (
    <div className={`${heightClass} bg-black flex flex-col items-center justify-center text-cyan-400 font-black italic uppercase tracking-widest ${className}`}>
      {label}
    </div>
  );
}
