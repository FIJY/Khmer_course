import React, { useEffect, useMemo, useRef, useState } from "react";
import { Play } from "lucide-react";
import LessonFrame from "../UI/LessonFrame";

const PLAY_DEBOUNCE_MS = 320;
const AUTO_REPLAY_DELAY_MS = 420;
const PLAYING_STATE_MS = 1100;

export default function AudioGuessSlide({ data, onPlayAudio, onComplete }) {
  const {
    title = "Listen",
    subtitle = "Listen and tap the glyph.",
    mode = "letter",
    audio = "",
    prompt_repeat = true,
    correct = {},
    choices = [],
    attempts = 2,
    reveal_on_fail = true,
    auto_play_on_enter = false,
    min_choices = 2,
    max_choices = 4
  } = data || {};

  const [selectedGlyph, setSelectedGlyph] = useState(null);
  const [status, setStatus] = useState("idle");
  const [attemptsLeft, setAttemptsLeft] = useState(attempts);
  const [showReveal, setShowReveal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [shakeIndex, setShakeIndex] = useState(0);
  const [audioMissing, setAudioMissing] = useState(false);

  const lastPlayRef = useRef(0);
  const playTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const completedRef = useRef(false);
  const hasPlayedRef = useRef(false);

  const normalizedChoices = useMemo(() => {
    const list = Array.isArray(choices) ? choices : [];
    const trimmed = list.slice(0, max_choices);
    if (trimmed.length < min_choices) return trimmed;
    return trimmed;
  }, [choices, max_choices, min_choices]);

  const correctGlyph = correct?.glyph ?? "";

  const markComplete = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (typeof onComplete === "function") onComplete();
  };

  const resetState = () => {
    completedRef.current = false;
    setSelectedGlyph(null);
    setStatus("idle");
    setAttemptsLeft(attempts);
    setShowReveal(false);
    setShowToast(false);
    setIsPlaying(false);
    setShakeIndex(0);
    setAudioMissing(false);
    hasPlayedRef.current = false;
  };

  useEffect(() => {
    resetState();
  }, [data]);

  useEffect(() => {
    if (!audio) {
      setAudioMissing(true);
      markComplete();
    }
  }, [audio]);

  useEffect(() => {
    if (!auto_play_on_enter || !audio) return;
    const timer = setTimeout(() => {
      handlePlay();
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto_play_on_enter, audio]);

  useEffect(() => () => {
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
  }, []);

  const handlePlay = () => {
    if (!audio) {
      setShowToast(true);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = setTimeout(() => setShowToast(false), 1800);
      return;
    }

    if (!prompt_repeat && hasPlayedRef.current) return;

    const now = Date.now();
    if (now - lastPlayRef.current < PLAY_DEBOUNCE_MS) return;
    lastPlayRef.current = now;

    if (typeof onPlayAudio === "function") onPlayAudio(audio);
    hasPlayedRef.current = true;
    setIsPlaying(true);
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    playTimeoutRef.current = setTimeout(() => {
      setIsPlaying(false);
    }, PLAYING_STATE_MS);
  };

  const triggerAutoReplay = () => {
    if (!audio) return;
    if (playTimeoutRef.current) clearTimeout(playTimeoutRef.current);
    playTimeoutRef.current = setTimeout(() => {
      handlePlay();
    }, AUTO_REPLAY_DELAY_MS);
  };

  const handleChoice = (choice) => {
    const glyph = choice?.glyph;
    if (!glyph || completedRef.current) return;
    setSelectedGlyph(glyph);

    const isCorrect = glyph === correctGlyph;
    if (isCorrect) {
      setStatus("correct");
      setShowReveal(true);
      markComplete();
      if (typeof onPlayAudio === "function") onPlayAudio("success.mp3");
      triggerAutoReplay();
      return;
    }

    setStatus("wrong");
    setShakeIndex((prev) => prev + 1);
    if (typeof onPlayAudio === "function") onPlayAudio("error.mp3");

    const remaining = Math.max(0, attemptsLeft - 1);
    setAttemptsLeft(remaining);

    if (remaining > 0) {
      triggerAutoReplay();
      return;
    }

    if (reveal_on_fail) {
      setStatus("reveal");
      setShowReveal(true);
      markComplete();
      triggerAutoReplay();
      return;
    }

    markComplete();
  };

  const gridClass = normalizedChoices.length === 4
    ? "grid-cols-2"
    : normalizedChoices.length === 3
      ? "grid-cols-3"
      : "grid-cols-2";

  const isFinished = completedRef.current;
  const showListenHint = status === "wrong" && attemptsLeft > 0;

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
      <LessonFrame className="w-full max-w-3xl px-6 pt-8 pb-10 border-0" variant="full">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2">{title}</h2>
          {subtitle ? (
            <p className="text-sm md:text-base text-slate-300">{subtitle}</p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col items-center">
          <button
            type="button"
            onClick={handlePlay}
            disabled={audioMissing || (!prompt_repeat && hasPlayedRef.current)}
            className={`group relative w-36 h-36 md:w-44 md:h-44 rounded-full border border-white/10 bg-white/5 text-white flex items-center justify-center transition-all ${isPlaying ? "audio-guess-playing" : "hover:border-cyan-400/50 hover:bg-cyan-500/10"} ${audioMissing ? "opacity-40 cursor-not-allowed" : "active:scale-[0.98]"}`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-white/10 flex items-center justify-center transition-all ${isPlaying ? "bg-cyan-500/20" : "group-hover:bg-cyan-500/20"}`}>
                <Play className="text-cyan-200" size={28} />
              </div>
              <span className="text-[11px] uppercase tracking-[0.35em] text-slate-300">Play</span>
            </div>
          </button>
          {showToast ? (
            <div className="mt-3 px-3 py-1.5 rounded-full bg-rose-500/15 text-rose-200 text-[11px] uppercase tracking-[0.2em]">
              Audio missing
            </div>
          ) : null}
          {!prompt_repeat && hasPlayedRef.current ? (
            <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-slate-500">Replay locked</div>
          ) : null}
        </div>

        <div className="mt-8">
          <div className={`grid ${gridClass} gap-4`}>
            {normalizedChoices.map((choice, idx) => {
              const glyph = choice?.glyph ?? "";
              const label = choice?.label ?? "";
              const isSelected = selectedGlyph === glyph;
              const isCorrect = glyph === correctGlyph;
              const showCorrect = showReveal && isCorrect;
              const showDim = showReveal && !isCorrect;
              const showWrong = status === "wrong" && isSelected;
              const isDisabled = isFinished || audioMissing;

              const buttonKey = `${glyph}-${idx}-${showWrong ? shakeIndex : 0}`;

              return (
                <button
                  key={buttonKey}
                  type="button"
                  onClick={() => handleChoice(choice)}
                  disabled={isDisabled}
                  className={`relative rounded-3xl px-4 py-6 md:py-7 text-white transition-all border border-transparent bg-white/0 ${isSelected ? "bg-white/5" : ""} ${showCorrect ? "border-emerald-400/40 bg-emerald-500/10 shadow-[0_0_22px_rgba(52,211,153,0.35)]" : ""} ${showWrong ? "border-rose-400/40 bg-rose-500/10 audio-guess-shake" : ""} ${showDim ? "opacity-40" : ""} ${isDisabled ? "cursor-default" : "hover:border-cyan-400/40 hover:bg-cyan-500/5 active:scale-[0.98]"}`}
                >
                  <div className="text-5xl md:text-6xl leading-none drop-shadow-sm">{glyph}</div>
                  {label ? (
                    <div className="mt-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
                  ) : null}
                  {showCorrect ? (
                    <div className="absolute inset-0 rounded-3xl border border-emerald-400/40 pointer-events-none" />
                  ) : null}
                  {showWrong ? (
                    <div key={shakeIndex} className="absolute inset-0 rounded-3xl border border-rose-400/40 pointer-events-none" />
                  ) : null}
                </button>
              );
            })}
          </div>

          {showListenHint ? (
            <div className="mt-4 text-center text-xs uppercase tracking-[0.3em] text-slate-400">Listen again.</div>
          ) : null}

          {showReveal ? (
            <div className="mt-6 mx-auto max-w-md p-4 rounded-3xl border border-white/10 bg-white/5 text-center animate-in fade-in slide-in-from-bottom-2">
              <div className="text-4xl md:text-5xl mb-2">{correct?.glyph}</div>
              {correct?.roman ? (
                <div className="text-sm uppercase tracking-[0.25em] text-cyan-200">{correct.roman}</div>
              ) : null}
              {correct?.ipa ? (
                <div className="text-xs text-slate-400 mt-1">/{correct.ipa}/</div>
              ) : null}
              {mode === "word" && correct?.char_split ? (
                <div className="mt-2 text-xs text-slate-400">{correct.char_split}</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </LessonFrame>
    </div>
  );
}
