import React from 'react';
import { t } from '../../i18n';

export default function LoadingState({
  label = t('loading.worldMap'),
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
