import React from 'react';

const VARIANT_STYLES = {
  card: 'bg-gray-900/90 border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_-40px_rgba(0,0,0,0.8)]',
  full: 'bg-gray-900/90 border border-white/10 rounded-[3rem] shadow-[0_25px_60px_-40px_rgba(0,0,0,0.8)]',
};

export default function LessonFrame({
  children,
  className = '',
  variant = 'card',
}) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.card;

  return (
    <div className={`w-full min-h-[60vh] flex flex-col overflow-hidden ${variantClass} ${className}`}>
      {children}
    </div>
  );
}
