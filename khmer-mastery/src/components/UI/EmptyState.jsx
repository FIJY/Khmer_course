import React from 'react';

export default function EmptyState({
  title,
  description,
  icon,
  actions,
  className = ''
}) {
  return (
    <div className={`text-center opacity-70 py-20 flex flex-col items-center gap-4 ${className}`}>
      {icon && <div className="text-gray-600">{icon}</div>}
      {title && (
        <p className="text-gray-400 text-xs uppercase font-black tracking-widest">{title}</p>
      )}
      {description && (
        <p className="text-gray-600 text-[10px]">{description}</p>
      )}
      {actions && (
        <div className="flex gap-3 justify-center">
          {actions}
        </div>
      )}
    </div>
  );
}
