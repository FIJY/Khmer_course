import React from 'react';
import LessonFrame from './LessonFrame';

export default function LessonCard({ children, className = '' }) {
  return (
    <LessonFrame className={`max-w-2xl p-6 text-white ${className}`}>
      {children}
    </LessonFrame>
  );
}
