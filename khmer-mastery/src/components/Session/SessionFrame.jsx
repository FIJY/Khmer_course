import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import MobileLayout from '../Layout/MobileLayout';

const SessionFrame = ({
  title,
  progressCurrent,
  progressTotal,
  progressLabel,
  score,
  onClose,
  footer,
  children
}) => {
  const progress = progressTotal > 0 ? (progressCurrent / progressTotal) * 100 : 0;

  return (
    <MobileLayout withNav={true} footer={footer}>
      <header className="p-4 border-b border-white/5 bg-gray-900/30">
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="p-2 text-gray-500" type="button">
            <X size={24} />
          </button>
          <div className="text-center flex-1 px-4">
            <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.35em] text-cyan-400 mb-1 truncate">{title}</h2>
            <div className="w-28 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all" style={{ width: `${progress}%` }} />
            </div>
            {progressLabel && (
              <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.3em] mt-2">{progressLabel}</p>
            )}
          </div>
          {typeof score === 'number' ? (
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-sm w-10">
              <CheckCircle2 size={16}/> {score}
            </div>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-visible">
        {children}
      </main>
    </MobileLayout>
  );
};

export default SessionFrame;
