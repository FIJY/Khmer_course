import React from 'react';
import { Volume2, Sun, Moon, BookOpen, Lightbulb, Zap, ListOrdered } from 'lucide-react';

export default function UniversalTheorySlide({ type, data, onPlayAudio }) {
  // 1. Нормализация типа: пропс > данные > пусто
  const effectiveType = type || data?.type || '';
  const mode = effectiveType.toLowerCase();

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
            <p className="text-xl md:text-2xl text-amber-400 mb-8 font-mono bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-500/20">
              {data.subtitle}
            </p>
          )}
          <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
            {data.description}
          </p>
        </div>
      );

    case 'meet-teams':
      return (
        <div className="w-full flex flex-col items-center text-center animate-in zoom-in duration-500">
           <h2 className="text-3xl font-black text-white mb-8 uppercase italic">{data.title || 'Meet the Teams'}</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Команда Солнца */}
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-900/20 border border-amber-500/30 p-6 rounded-3xl">
                 <Sun size={48} className="text-amber-400 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-amber-200 mb-2">Solar Team (A-Series)</h3>
                 <p className="text-sm text-amber-100/80">Open mouth, natural voice. Like saying "Ahhh"</p>
              </div>
              {/* Команда Луны */}
              <div className="bg-gradient-to-br from-indigo-500/20 to-blue-900/20 border border-indigo-500/30 p-6 rounded-3xl">
                 <Moon size={48} className="text-indigo-400 mx-auto mb-4" />
                 <h3 className="text-xl font-bold text-indigo-200 mb-2">Lunar Team (O-Series)</h3>
                 <p className="text-sm text-indigo-100/80">Round mouth, deeper voice. Like saying "Ohhh"</p>
              </div>
           </div>
        </div>
      );

    // --- ВАЖНО: Обработка Theory и Rule в одном блоке ---
    case 'theory':
    case 'rule':
      return (
        <div className="w-full bg-gray-900 border border-white/10 p-8 rounded-[3.5rem] text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex justify-center mb-6">
                <div className="p-2 bg-cyan-500/10 rounded-full">
                    {mode === 'rule' ? <Lightbulb className="text-amber-400" size={10} /> : <BookOpen className="text-cyan-400" size={10} />}
                </div>
            </div>

            <h2 className="text-2xl font-black italic uppercase text-white mb-6 tracking-wide">
                {data.title || 'Theory Block'}
            </h2>

            <div className="text-lg text-gray-300 leading-relaxed space-y-4 font-medium text-left md:text-center">
                {Array.isArray(data.description)
                    ? data.description.map((line, i) => <p key={i}>{line}</p>)
                    : <p>{data.description}</p>
                }

                {data.examples && (
                  <div className="mt-8 space-y-4">
                    {data.examples.map((ex, i) => {
                      const obj = typeof ex === "string" ? { text: ex, kind: "plain" } : ex;
                      const isKhmer = obj.kind === "khmer";
                      const isLabel = obj.kind === "label";
                      const isLatin = obj.kind === "latin";

                      const base =
                        "w-full rounded-2xl border border-white/5 px-5 py-4 text-center";

                      const labelCls =
                        "bg-transparent border-0 px-0 py-0 text-sm text-gray-400 tracking-wide";
                      const latinCls =
                        "bg-black/35 font-mono text-cyan-200 text-base md:text-lg break-words";
                      const khmerCls =
                        "bg-black/45 font-khmer text-cyan-100 text-2xl md:text-3xl leading-relaxed";

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

                      // если есть аудио — делаем кликабельным
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
                  <div className="mt-8 pt-6 border-t border-white/10 text-gray-200 text-base md:text-lg text-center whitespace-pre-line">
                    {data.footer}
                  </div>
                )}

            </div>

            {data.audio && (
                <button
                    onClick={() => play(data.audio)}
                    className="mt-8 flex items-center gap-3 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-full text-cyan-400 font-bold transition-all mx-auto border border-white/5"
                >
                    <Volume2 size={20} />
                    <span>Listen</span>
                </button>
            )}
        </div>
      );

    case 'reading-algorithm':
      return (
        <div className="w-full animate-in fade-in duration-500">
            <div className="flex justify-center mb-6">
                <ListOrdered size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-6 text-center uppercase">{data.title || 'How to read'}</h2>
            <div className="space-y-3">
                {(data.steps || []).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4 bg-gray-800/50 p-4 rounded-2xl border border-white/5">
                        <div className="h-6 w-6 rounded-full bg-emerald-900 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                            {idx + 1}
                        </div>
                        <p className="text-gray-200 font-medium text-sm text-left">{step}</p>
                    </div>
                ))}
            </div>
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