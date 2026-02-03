// src/components/LessonSlides/ComparisonAudio.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Volume2, Pause } from "lucide-react";
import { getSoundFileForChar } from "../../data/audioMap";
import LessonFrame from "../UI/LessonFrame";
import LessonHeader from "../UI/LessonHeader";
import LessonGlyphDecoder from "../LessonGlyphDecoder";

/**
 * ComparisonAudio Component
 *
 * Displays two (or more) columns of Khmer text with audio playback.
 * Perfect for R1 lessons:
 * - ក (Sun) vs គ (Moon) with same vowel
 * - ក + ា vs ក + ះ (different vowels)
 * - etc.
 *
 * Props:
 * - title: string (lesson title)
 * - pairs: array of { left, right, instruction? }
 *   where left/right = { text, label?, audio?, romanization?, team? }
 * - note: string (optional note at bottom)
 * - onComplete: callback when user clicks play
 */
export default function ComparisonAudio({
  data = {},
  onComplete,
  hideDefaultButton = false,
}) {
  const { title, pairs = [], note } = data;

  const [playingIndex, setPlayingIndex] = useState(null);
  const [playingSide, setPlayingSide] = useState(null); // "left" or "right"
  const [playedSides, setPlayedSides] = useState(() => new Map());
  const audioRef = useRef(null);

  const SOUNDS_URL = import.meta.env.VITE_SOUNDS_URL || "/sounds";

  // Получить путь звука (с fallback)
  const getSoundPath = (audioFile) => {
    if (!audioFile) return null;
    if (audioFile.startsWith("http")) return audioFile;
    return `${SOUNDS_URL}/${audioFile}`;
  };

  // Получить звук для символа или использовать предоставленный
  const getAudio = (item) => {
    if (!item) return null;
    if (item.audio) return item.audio;
    if (item.text) return getSoundFileForChar(item.text);
    return null;
  };

  useEffect(() => {
    setPlayedSides(new Map());
  }, [pairs]);

  const hasCompletedPair = useMemo(() => {
    return pairs.some((pair, pairIdx) => {
      const leftAudio = getAudio(pair.left);
      const rightAudio = getAudio(pair.right);
      const progress = playedSides.get(pairIdx);
      const leftDone = !leftAudio || progress?.left;
      const rightDone = !rightAudio || progress?.right;
      return leftDone && rightDone;
    });
  }, [pairs, playedSides]);

  useEffect(() => {
    if (hasCompletedPair && onComplete) {
      onComplete();
    }
  }, [hasCompletedPair, onComplete]);

  const markPlayed = (pairIdx, side) => {
    setPlayedSides((prev) => {
      const next = new Map(prev);
      const current = next.get(pairIdx) || { left: false, right: false };
      next.set(pairIdx, { ...current, [side]: true });
      return next;
    });
  };

  // Воспроизвести звук
  const playSound = (audioFile, pairIdx, side) => {
    if (!audioFile) return;

    const path = getSoundPath(audioFile);
    if (!path) return;
    markPlayed(pairIdx, side);

    if (audioRef.current) {
      audioRef.current.src = path;
      audioRef.current.onended = () => {
        setPlayingIndex(null);
        setPlayingSide(null);
      };

      audioRef.current
        .play()
        .then(() => {
          setPlayingIndex(pairIdx);
          setPlayingSide(side);
        })
        .catch((e) => {
          console.error("Audio playback failed:", e);
          setPlayingIndex(null);
          setPlayingSide(null);
        });
    }
  };

  const isPlaying = (pairIdx, side) => {
    return playingIndex === pairIdx && playingSide === side;
  };

  return (
    <LessonFrame className="space-y-6 p-6">
      <audio ref={audioRef} crossOrigin="anonymous" />

      {/* Title */}
      {title && (
        <LessonHeader title={title} />
      )}

      {/* Pairs */}
      <div className="space-y-8">
        {pairs.map((pair, pairIdx) => {
          const leftAudio = getAudio(pair.left);
          const rightAudio = getAudio(pair.right);

          return (
            <div key={pairIdx} className="space-y-4">
              {/* Instruction */}
              {pair.instruction && (
                <p className="text-sm text-slate-300 italic text-center">
                  {pair.instruction}
                </p>
              )}

              {/* Two columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* LEFT */}
                <div className="flex flex-col items-center space-y-3">
                  {/* Khmer glyph */}
                  <div
                    className={`w-full rounded-2xl p-3 ${isPlaying(pairIdx, "left") ? "bg-cyan-500/10 border border-cyan-400/40" : "bg-black/20 border border-white/10"}`}
                  >
                    <LessonGlyphDecoder
                      text={pair.left?.text}
                      compact={true}
                      hideDefaultButton={true}
                      viewBoxPad={50}
                      onGlyphClick={() => playSound(leftAudio, pairIdx, "left")}
                    />
                  </div>

                  {/* Label */}
                  {pair.left?.label && (
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {pair.left.label}
                    </p>
                  )}

                  {/* Romanization */}
                  {pair.left?.romanization && (
                    <p className="text-sm text-cyan-400 font-mono">
                      {pair.left.romanization}
                    </p>
                  )}

                  {/* Play button */}
                  {leftAudio && (
                    <button
                      onClick={() => playSound(leftAudio, pairIdx, "left")}
                      disabled={isPlaying(pairIdx, "left")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-60 transition-colors"
                      aria-label="Play left audio"
                    >
                      {isPlaying(pairIdx, "left") ? (
                        <>
                          <Pause size={16} />
                          <span className="text-sm">Playing...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={16} />
                          <span className="text-sm">Play</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* RIGHT */}
                <div className="flex flex-col items-center space-y-3">
                  {/* Khmer glyph */}
                  <div
                    className={`w-full rounded-2xl p-3 ${isPlaying(pairIdx, "right") ? "bg-cyan-500/10 border border-cyan-400/40" : "bg-black/20 border border-white/10"}`}
                  >
                    <LessonGlyphDecoder
                      text={pair.right?.text}
                      compact={true}
                      hideDefaultButton={true}
                      viewBoxPad={50}
                      onGlyphClick={() => playSound(rightAudio, pairIdx, "right")}
                    />
                  </div>

                  {/* Label */}
                  {pair.right?.label && (
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      {pair.right.label}
                    </p>
                  )}

                  {/* Romanization */}
                  {pair.right?.romanization && (
                    <p className="text-sm text-cyan-400 font-mono">
                      {pair.right.romanization}
                    </p>
                  )}

                  {/* Play button */}
                  {rightAudio && (
                    <button
                      onClick={() => playSound(rightAudio, pairIdx, "right")}
                      disabled={isPlaying(pairIdx, "right")}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/30 disabled:opacity-60 transition-colors"
                      aria-label="Play right audio"
                    >
                      {isPlaying(pairIdx, "right") ? (
                        <>
                          <Pause size={16} />
                          <span className="text-sm">Playing...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={16} />
                          <span className="text-sm">Play</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Note */}
      {note && (
        <div className="mt-6 p-4 bg-black/30 rounded-2xl border border-white/10">
          <p className="text-sm text-slate-200 italic">{note}</p>
        </div>
      )}

      {/* Auto-unlock button */}
      {!hideDefaultButton && (
        <div className="flex justify-center pt-4">
          <button
            onClick={onComplete}
            className="px-6 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 font-semibold hover:bg-emerald-500/30 transition-colors"
          >
            Got it! Continue →
          </button>
        </div>
      )}
    </LessonFrame>
  );
}
