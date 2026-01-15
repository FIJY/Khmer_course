import React from 'react';
import { t } from '../../i18n';

export default function ErrorState({
  title = t('errors.map'),
  message = 'Something went wrong.',
  onRetry,
  retryLabel = t('actions.retry'),
  secondaryAction,
  fullScreen = true,
  className = ''
}) {
  const heightClass = fullScreen ? 'h-screen' : 'h-auto';
  return (
    <div className={`${heightClass} bg-black flex flex-col items-center justify-center text-center text-white px-6 gap-4 ${className}`}>
      <p className="text-sm font-bold uppercase tracking-widest text-red-400">{title}</p>
      <p className="text-gray-400 text-xs">{message}</p>
      <div className="flex gap-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-full border border-white/10 text-xs font-black uppercase tracking-widest text-cyan-400 hover:text-cyan-300"
          >
            {retryLabel}
          </button>
        )}
        {secondaryAction}
      </div>
    </div>
  );
}
