import React from 'react';

export default function LessonCard({ children, className = '' }) {
  return (
    <div
      className={`w-full max-w-2xl bg-gradient-to-b from-slate-900/90 via-slate-950/90 to-black/90 border border-white/10 ring-1 ring-white/5 rounded-[2.75rem] p-6 shadow-[0_30px_70px_-45px_rgba(8,145,178,0.55)] backdrop-blur-xl text-white ${className}`}
    >
      {children}
    </div>
  );
}
