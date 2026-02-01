import React from 'react';

export default function LessonCard({ children, className = '' }) {
  return (
    <div
      className={`w-full max-w-2xl bg-gray-900/90 border border-white/10 rounded-[2.5rem] p-6 shadow-[0_25px_60px_-40px_rgba(0,0,0,0.8)] text-white ${className}`}
    >
      {children}
    </div>
  );
}
