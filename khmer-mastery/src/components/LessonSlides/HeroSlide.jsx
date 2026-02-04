import React from "react";
import LessonFrame from "../UI/LessonFrame";
import VisualDecoder from "../VisualDecoder";

export default function HeroSlide({ data, onPlayAudio }) {
  const mode = (data?.mode || "unlock").toLowerCase(); // unlock | hunt

  const title = data?.title || data?.name || "Find the Hero";

  // description: string | string[]
  const descriptionRaw = Array.isArray(data?.description)
    ? data.description
    : typeof data?.description === "string"
      ? [data.description]
      : [];

  // убираем пустые строки — spacing делаем через gap
  const description = descriptionRaw
    .map((x) => String(x ?? "").trim())
    .filter(Boolean);

  const footer = String(data?.footer || "").trim();

  const word = String(data?.word || "").trim();
  const targetChar = String(
    data?.target || data?.target_char || data?.targetChar || ""
  ).trim();

  const charSplit = data?.char_split || data?.charSplit || null;

  // считаем “видимые” согласные (без subscript после coeng)
  const consonantCount = React.useMemo(() => {
    if (!word) return 0;
    const chars = Array.from(word);
    let count = 0;
    for (let i = 0; i < chars.length; i += 1) {
      const ch = chars[i];
      const cp = ch.codePointAt(0);

      // Khmer consonants range: U+1780..U+17A2
      const isConsonant = cp >= 0x1780 && cp <= 0x17A2;
      const isSubscript = chars[i - 1] === "្";
      if (isConsonant && !isSubscript) count += 1;
    }
    return count;
  }, [word]);

  // Последняя строка — акцентная
  const lastIndex = description.length - 1;

  // Никаких max-h/overflow-hidden на рамке:
  // ограничиваем только внутренний контент и даём нормальный flex.
  const frameClass = "p-5 sm:p-8";

  // Общий layout: header + body (flex-1) + footer pinned
  return (
    <div className="w-full flex flex-col items-center text-center animate-in fade-in duration-500">
      <LessonFrame className={frameClass} variant="full">
        <div className="min-h-[52vh] flex flex-col">
          {/* TOP */}
          <div className="flex-shrink-0">
            <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-3">
              {title}
            </h2>

            {/* (опционально) счётчик согласных */}
            {word ? (
              <div className="text-[10px] uppercase tracking-[0.3em] text-slate-400 mb-4">
                Consonants:{" "}
                <span className="text-emerald-300 font-bold">{consonantCount}</span>
              </div>
            ) : null}
          </div>

          {/* BODY */}
          <div className="flex-1 flex flex-col">
            {/* Текст */}
            {description.length > 0 ? (
              <div className="w-full text-left space-y-3">
                {description.map((line, idx) => {
                  const isLastStrong = idx === lastIndex;
                  return (
                    <p
                      key={`line-${idx}`}
                      className={
                        isLastStrong
                          ? "text-[clamp(1.25rem,4vw,1.85rem)] font-black text-white mt-1"
                          : "text-[clamp(1.05rem,3.2vw,1.55rem)] font-bold text-white/95"
                      }
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            ) : null}

            {/* ВИЗУАЛЬНЫЙ БЛОК */}
            {mode === "hunt" ? (
              <>
                <p className="text-gray-300 mt-5 mb-3 text-left">
                  Tap the main consonant.
                </p>

                <div className="flex-1 flex items-center justify-center mt-2">
                  <div className="max-w-[360px] w-full">
                    <div className="scale-[0.98] sm:scale-[1.06] origin-top">
                      <VisualDecoder
                        text={word}
                        targetChar={targetChar}
                        charSplit={charSplit}
                        onLetterClick={onPlayAudio}
                        compact={true}
                        viewBoxPad={55}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // unlock: показываем “слово-глиф” крупно и красиво
              word ? (
                <div className="flex-1 flex items-center justify-center mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      // если твой onPlayAudio умеет играть по букве/файлу — ок.
                      // иначе просто оставь без клика.
                      if (onPlayAudio && targetChar) onPlayAudio(targetChar);
                    }}
                    className="w-full"
                  >
                    <div className="mx-auto max-w-[520px] rounded-3xl bg-black/35 border border-white/5 px-6 py-10">
                      <div className="font-khmer text-white text-[clamp(3.2rem,9vw,5.5rem)] leading-none">
                        {word}
                      </div>
                      <div className="mt-3 text-xs text-cyan-300/70 uppercase tracking-[0.25em]">
                        tap to hear (optional)
                      </div>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="flex-1" />
              )
            )}
          </div>

          {/* FOOTER pinned */}
          {footer ? (
            <div className="flex-shrink-0 mt-6">
              <div className="h-px w-full bg-white/10" />
              <p className="mt-3 text-xs sm:text-sm italic text-white/60">
                {footer}
              </p>
            </div>
          ) : null}
        </div>
      </LessonFrame>
    </div>
  );
}
