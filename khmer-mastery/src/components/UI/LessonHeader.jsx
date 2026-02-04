import React from 'react';

export default function LessonHeader({
  title,
  subtitle,
  hint,
  align = 'center',
}) {
  const alignClass =
    align === 'left' ? 'text-left items-start' : 'text-center items-center';

  return (
    <div className={`flex flex-col gap-2 ${alignClass}`}>
      {title && (
        <h2 className="text-sm md:text-base font-black uppercase tracking-[0.25em] text-cyan-300/80">
          {title}
        </h2>
      )}

      {subtitle && (
        <p className="text-[0.72rem] md:text-xs text-slate-400 uppercase tracking-[0.25em]">
          {subtitle}
        </p>
      )}

      {hint && (
        <p className="text-sm text-slate-200/90 leading-relaxed">
          {hint}
        </p>
      )}
    </div>
  );
}
