import React from 'react';

const VARIANT_STYLES = {
  card: [
    // Shape + surface
    'relative',
    'bg-gradient-to-b from-slate-900/90 to-slate-950',
    'border border-white/10',
    'rounded-[2.5rem]',
    // Depth (inner highlight + outer lift)
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_70px_-40px_rgba(0,0,0,0.85)]',
    // Subtle accent ring (very soft)
    'ring-1 ring-cyan-500/5',
  ].join(' '),

  full: [
    'relative',
    'bg-gradient-to-b from-slate-900/90 to-slate-950',
    'border border-white/10',
    'rounded-[3rem]',
    'shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_70px_-40px_rgba(0,0,0,0.85)]',
    'ring-1 ring-cyan-500/5',
  ].join(' '),
};

export default function LessonFrame({
  children,
  className = '',
  variant = 'card',
}) {
  const variantClass = VARIANT_STYLES[variant] || VARIANT_STYLES.card;

  return (
    <div className={`w-full min-h-[50vh] max-h-[70vh] flex flex-col overflow-hidden ${variantClass} ${className}`}>
      {children}
    </div>
  );
}
