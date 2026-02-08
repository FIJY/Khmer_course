// src/components/LessonSlides/ComparisonAudio.jsx
import React, { useEffect, useState, useRef } from "react";
import { Volume2, Check, Sparkles } from "lucide-react";
import { getSoundFileForChar } from "../../data/audioMap";
import LessonFrame from "../UI/LessonFrame";
import VisualDecoder from "../VisualDecoder";
import useAudioPlayer from "../../hooks/useAudioPlayer";

export default function ComparisonAudio({
  data = {},
  onComplete,
  hideDefaultButton = false,
}) {
  const { title, pairs = [], note } = data;
  const currentPair = pairs[0];

  const [playingSide, setPlayingSide] = useState(null); // "left" | "right"
  const [playedState, setPlayedState] = useState({ left: false, right: false });
  const footerRef = useRef(null); // Реф для автоскролла

  const SOUNDS_URL = import.meta.env.VITE_SOUNDS_URL || "/sounds";
  const { play, playSequence, resolveAudioSource, stop } = useAudioPlayer(SOUNDS_URL);

  // Автоскролл к низу после завершения
  useEffect(() => {
    const bothPlayed = playedState.left && playedState.right;
    if (bothPlayed && footerRef.current) {
      setTimeout(() => {
        footerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 400);
    }
  }, [playedState]);

  const getAudioSource = (item) => {
    if (!item) return null;
    if (item.audio) return resolveAudioSource(item.audio);
    if (item.text) {
        const file = getSoundFileForChar(item.text);
        return file ? resolveAudioSource(file) : null;
    }
    return null;
  };

  const getFeedbackSound = (item) =>
    item?.feedbackSound || item?.feedback_sound || data?.feedbackSound || data?.feedback_sound;

  const playSound = (side) => {
    const item = side === "left" ? currentPair?.left : currentPair?.right;
    const src = getAudioSource(item);
    const feedbackSound = getFeedbackSound(item);

    if (!src) return;
    stop();
    setPlayingSide(side);

    if (feedbackSound) {
      playSequence([feedbackSound, src], {
        gapMs: 200,
        onComplete: () => setPlayingSide(null)
      });
    } else {
      const audio = play(src);
      if (audio) {
        audio.onended = () => setPlayingSide(null);
      } else {
        setPlayingSide(null);
      }
    }

    setPlayedState(prev => {
        const newState = { ...prev, [side]: true };
        if (newState.left && newState.right && onComplete) {
            setTimeout(() => onComplete(), 800);
        }
        return newState;
    });
  };

  if (!currentPair) return null;

  const bothDone = playedState.left && playedState.right;

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
      <LessonFrame className="pt-6 px-6 pb-20 h-full overflow-y-auto" variant="full">
        <div className="flex flex-col min-h-full">
            <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-6 text-center shrink-0">
               {title || "Listen & Compare"}
            </h2>

            {/* --- ОДНО ОКНО (Общий контейнер) --- */}
            <div className="w-full max-w-sm mx-auto bg-white/5 border border-white/10 rounded-3xl p-2 relative shrink-0 backdrop-blur-sm">

                {/* Внутренняя сетка */}
                <div className="flex items-stretch min-h-[180px]">

                    {/* ЛЕВАЯ ЧАСТЬ */}
                    <button
                        onClick={() => playSound("left")}
                        className={`flex-1 relative rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${playingSide === "left" ? "bg-white/5" : "hover:bg-white/5"}`}
                    >
                        <div className="w-2/3 max-w-[100px]">
                            <VisualDecoder
                                text={currentPair.left.text}
                                compact={true}
                                hideDefaultButton={true}
                                viewBoxPad={40}
                                interactionMode="view_only"
                            />
                        </div>
                        {/* Статус */}
                        <div className="mt-2 h-6 flex items-center justify-center">
                             {playingSide === "left" ? <Volume2 size={16} className="text-cyan-400 animate-pulse"/> :
                              playedState.left ? <Check size={16} className="text-emerald-400"/> :
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tap</span>}
                        </div>
                    </button>

                    {/* РАЗДЕЛИТЕЛЬ VS */}
                    <div className="flex flex-col items-center justify-center px-2">
                        <div className="w-px h-16 bg-white/10"></div>
                        <div className="py-2 text-[10px] font-black italic text-slate-600">VS</div>
                        <div className="w-px h-16 bg-white/10"></div>
                    </div>

                    {/* ПРАВАЯ ЧАСТЬ */}
                    <button
                        onClick={() => playSound("right")}
                        className={`flex-1 relative rounded-2xl flex flex-col items-center justify-center transition-all duration-300 ${playingSide === "right" ? "bg-white/5" : "hover:bg-white/5"}`}
                    >
                        <div className="w-2/3 max-w-[100px]">
                            <VisualDecoder
                                text={currentPair.right.text}
                                compact={true}
                                hideDefaultButton={true}
                                viewBoxPad={40}
                                interactionMode="view_only"
                            />
                        </div>
                        {/* Статус */}
                        <div className="mt-2 h-6 flex items-center justify-center">
                             {playingSide === "right" ? <Volume2 size={16} className="text-cyan-400 animate-pulse"/> :
                              playedState.right ? <Check size={16} className="text-emerald-400"/> :
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Tap</span>}
                        </div>
                    </button>

                </div>
            </div>

            {/* ИНСТРУКЦИЯ (Нижняя строчка) */}
            <div ref={footerRef} className="text-center space-y-3 mt-8 pb-8 transition-all duration-500">
                <p className={`text-lg font-bold transition-all duration-500 ${bothDone ? 'text-emerald-300 scale-105' : 'text-white'}`}>
                    {currentPair.instruction || (bothDone ? "Great!" : "Tap to listen")}
                </p>
                {note && (
                    <div className={`transition-all duration-500 delay-100 ${bothDone ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <p className="text-slate-400 text-sm italic max-w-xs mx-auto leading-relaxed px-4 py-3 rounded-xl bg-black/20 border border-white/5">
                            {note}
                        </p>
                    </div>
                )}
            </div>

            {/* ПОДСКАЗКА (исчезает когда все готово) */}
            <div className={`mt-auto flex justify-center transition-opacity duration-500 ${bothDone ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <div className="px-4 py-2 bg-black/40 rounded-full border border-white/5 text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={10} className="text-cyan-500" />
                    <span>Listen to both</span>
                </div>
            </div>
        </div>
      </LessonFrame>
    </div>
  );
}
