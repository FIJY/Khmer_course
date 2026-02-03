import React from 'react';

export default function LessonHeader({
  title,
  subtitle,
  hint,
  align = 'center',
}) {
  const alignClass = align === 'left' ? 'text-left items-start' : 'text-center items-center';

  return (
    <div className={`flex flex-col gap-2 ${alignClass}`}>
      {title && (
        <h2 className="text-lg font-black uppercase tracking-[0.3em] text-cyan-400">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">{subtitle}</p>
      )}
      {hint && (
        <p className="text-sm text-gray-300">{hint}</p>
      )}
    </div>
  );
}
