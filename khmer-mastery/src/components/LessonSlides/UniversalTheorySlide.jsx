import React from 'react';
import { Volume2, Sun, Moon } from 'lucide-react';

export default function UniversalTheorySlide({ data, onPlayAudio }) {
  // Хелпер для безопасного воспроизведения
  const play = (file) => {
    if (onPlayAudio && file) onPlayAudio(file);
  };

  switch (data.type) {
    case 'title':
      return (
        <div className="w-full flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[50vh]">
          <div className="text-8xl mb-6 animate-pulse">{data.icon}</div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase tracking-tighter leading-tight">
            {data.title}
          </h1>
          <p className="text-xl md:text-2xl text-amber-400 mb-8 font-mono bg-amber-900/20 px-4 py-2 rounded-lg border border-amber-500/20">
            {data.subtitle}
          </p>
          <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
            {data.description}
          </p>
        </div>
      );

    case 'meet-teams':
      return (
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-8">
          <h2 className="text-3xl font-black text-white mb-8 text-center italic uppercase tracking-tighter">
            {data.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* SUN TEAM */}
            <div className="bg-gradient-to-b from-amber-500/10 to-transparent border border-amber-500/20 rounded-[2.5rem] p-6 text-center relative overflow-hidden">
                <div className="text-5xl mb-4">☀️</div>
                <h3 className="text-amber-400 font-black uppercase text-sm tracking-[0.2em] mb-4">Sun Team</h3>
                <div className="flex flex-col gap-3">
                    {data.pairs.map((pair, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => play(data.consonantAudioMap?.[pair.sun])}
                            className="bg-gray-900 border border-white/5 hover:border-amber-500/50 p-4 rounded-2xl flex items-center justify-between group transition-all active:scale-95 cursor-pointer w-full"
                        >
                            <span className="text-3xl font-khmer text-white">{pair.sun}</span>
                            <span className="text-xs text-gray-500 font-bold group-hover:text-amber-400">{pair.sunRead}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* MOON TEAM */}
            <div className="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/20 rounded-[2.5rem] p-6 text-center relative overflow-hidden">
                <div className="text-5xl mb-4">🌑</div>
                <h3 className="text-indigo-400 font-black uppercase text-sm tracking-[0.2em] mb-4">Moon Team</h3>
                <div className="flex flex-col gap-3">
                    {data.pairs.map((pair, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => play(data.consonantAudioMap?.[pair.moon])}
                            className="bg-gray-900 border border-white/5 hover:border-indigo-500/50 p-4 rounded-2xl flex items-center justify-between group transition-all active:scale-95 cursor-pointer w-full"
                        >
                            <span className="text-3xl font-khmer text-white">{pair.moon}</span>
                            <span className="text-xs text-gray-500 font-bold group-hover:text-indigo-400">{pair.moonRead}</span>
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>
      );

    case 'rule':
      return (
        <div className="w-full max-w-xl text-center animate-in fade-in zoom-in">
            <h2 className="text-4xl font-black text-white mb-6 uppercase italic">{data.title}</h2>
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-8 rounded-[3rem] mb-8 shadow-2xl border border-white/10">
                <p className="text-2xl font-bold text-white leading-snug">{data.rule80}</p>
            </div>
             <div className="flex flex-wrap justify-center gap-3 mb-8">
                {data.examples?.map((ex, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3 rounded-full bg-gray-900 border border-white/10">
                        <span className="text-2xl font-khmer text-white">{ex.letter}</span>
                        <span className={`text-xs font-black uppercase tracking-wider ${ex.team === 'Sun' ? 'text-amber-400' : 'text-indigo-400'}`}>
                            {ex.team}
                        </span>
                    </div>
                ))}
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
                <p className="text-amber-200 text-sm font-medium">💡 Tip: {data.tip}</p>
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

    default:
      return (
        <div className="p-10 text-center text-red-500 bg-gray-900 rounded-2xl">
           UniversalSlide: Unknown type "{data.type}"
        </div>
      );
  }
}