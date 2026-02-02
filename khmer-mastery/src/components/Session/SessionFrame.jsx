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
      <header className="p-4 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors" type="button">
            <X size={24} />
          </button>
          <div className="text-center flex-1 px-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-1 truncate">{title}</h2>
            <div className="w-28 h-1.5 bg-slate-800/80 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)] transition-all" style={{ width: `${progress}%` }} />
            </div>
            {progressLabel && (
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-2">{progressLabel}</p>
            )}
          </div>
          {typeof score === 'number' ? (
            <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs w-10">
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
