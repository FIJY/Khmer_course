import React from 'react';
import { Volume2, BookOpen, Zap } from 'lucide-react';
import LessonFrame from '../UI/LessonFrame';

export default function UniversalTheorySlide({ type, data, onPlayAudio }) {
  // 1. Нормализация типа: пропс > данные > пусто
  const effectiveType = type || data?.type || '';
  const mode = effectiveType.toLowerCase().trim().replace(/[\s-]+/g, '_');

  // Хелпер для звука
  const play = (file) => {
    if (onPlayAudio && file) onPlayAudio(file);
  };

  switch (mode) {
    case 'title':
      return (
        <div className="w-full flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[50vh]">
          <div className="text-8xl mb-6 animate-pulse">
             {/* Если icon строка (эмодзи) - выводим как текст, иначе как компонент */}
             {typeof data.icon === 'string' ? data.icon : <Zap size={80} className="text-amber-400" />}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter leading-tight">
            {data.title}
          </h1>
          {data.subtitle && (
            <p className="text-lg md:text-xl tracking-[0.25em] text-cyan-300/80 mb-8 font-mono bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-500/20">
              {data.subtitle}
            </p>
          )}
          <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
            {data.description}
          </p>
        </div>
      );

    case 'theory':
      return (
        <div className="w-full flex-1 flex">
          <LessonFrame className="w-full flex-1 p-6 md:p-8 pb-14 md:pb-16 text-center animate-in fade-in slide-in-from-bottom-8 duration-700" variant="full">
            <div className="hidden sm:flex justify-center mb-4">
                <div className="p-1.5 bg-cyan-500/10 rounded-full">
                    <BookOpen className="text-cyan-400" size={12} />
                </div>
            </div>

            <h2 className="text-xs md:text-sm font-black uppercase text-cyan-300/80 mb-4 tracking-[0.25em]">
                {data.title || 'Theory Block'}
            </h2>

            <div className="text-base md:text-lg text-gray-300 leading-relaxed font-medium text-left md:text-center">
              {Array.isArray(data.description) ? (
                <div className="space-y-3">
                  {data.description.slice(0, -1).map((line, i) => (
                    <p key={`line-${i}`} className="text-[clamp(1rem,3.5vw,1.35rem)] font-semibold text-white/90">
                      {line}
                    </p>
                  ))}
                  {data.description.length > 0 && (
                    <p className="text-[clamp(1.25rem,4vw,1.7rem)] font-black text-white tracking-tight">
                      {data.description[data.description.length - 1]}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[clamp(1rem,3.5vw,1.35rem)] font-semibold text-white/90">{data.description}</p>
              )}

              {data.examples && (
                <div className="mt-10 space-y-6 max-w-md mx-auto">
                  {data.examples.map((ex, i) => {
                    const obj = typeof ex === "string" ? { text: ex, kind: "plain" } : ex;
                    const isKhmer = obj.kind === "khmer";
                    const isLabel = obj.kind === "label";
                    const isLatin = obj.kind === "latin";

                    const base =
                      "w-full overflow-hidden rounded-2xl border border-white/5 px-4 py-3 text-center";

                    const labelCls =
                      "bg-transparent border-0 px-0 py-0 text-sm text-gray-400 tracking-wide";
                    const latinCls = "bg-black/35 font-mono text-cyan-200 text-[clamp(0.95rem,3.2vw,1.15rem)] tracking-tight uppercase leading-tight break-all whitespace-normal";
                    const khmerCls =
                      "bg-black/45 font-khmer text-cyan-50 text-2xl md:text-3xl leading-snug py-5 px-5";

                    const extra = obj.className ? ` ${obj.className}` : "";
                    const cls = (isLabel ? labelCls : `${base} ${isKhmer ? khmerCls : isLatin ? latinCls : "bg-black/40 text-cyan-200"}`) + extra;

                    const content = (
                      <div className={cls}>
                        {obj.text}
                        {obj.audio && (
                          <div className="mt-2 text-xs text-cyan-400/80">
                            Tap to listen
                          </div>
                        )}
                      </div>
                    );

                    if (obj.audio) {
                      return (
                        <button
                          key={i}
                          onClick={() => play(obj.audio)}
                          className="w-full text-left"
                        >
                          {content}
                        </button>
                      );
                    }

                    return <div key={i}>{content}</div>;
                  })}
                </div>
              )}

              {data.footer && (
                <div className="mt-6 pt-6 border-t border-white/10 text-slate-300 italic opacity-80 text-sm md:text-base text-center whitespace-pre-line">
                  {data.footer}
                </div>
              )}
            </div>

            {data.audio && (
                <button
                    onClick={() => play(data.audio)}
                    className="mt-6 flex items-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-full text-cyan-400 font-bold transition-all mx-auto border border-white/5"
                >
                    <Volume2 size={20} />
                    <span>Listen</span>
                </button>
            )}
          </LessonFrame>
        </div>
      );

    case 'ready':
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-pulse-slow min-h-[50vh]">
                <div className="text-8xl mb-6">🏆</div>
                <h2 className="text-4xl font-black text-white mb-4 uppercase italic tracking-tighter">{data.title}</h2>
                <p className="text-lg text-gray-400 max-w-xs mx-auto">{data.description}</p>
            </div>
        );

    case 'intro':
         return (
            <div className="w-full flex flex-col items-center justify-center text-center animate-in fade-in duration-700">
                <h2 className="text-3xl font-black text-white mb-6">{data.title}</h2>
                <p className="text-xl text-gray-300">{data.text || data.description}</p>
            </div>
         );

    default:
      return (
        <div className="w-full flex flex-col items-center justify-center p-10 text-center text-white">
           <p className="text-red-400 font-bold mb-4">Unknown Slide Type: "{mode}"</p>
           <div className="bg-gray-900 p-4 rounded text-left overflow-auto max-w-sm max-h-40">
             <pre className="text-xs text-green-400">{JSON.stringify(data, null, 2)}</pre>
           </div>
        </div>
      );
  }
}
