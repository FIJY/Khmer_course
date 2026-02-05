import React from "react";
import LessonFrame from "../UI/LessonFrame";
import VisualDecoder from "../VisualDecoder";

export default function HeroSlide({ data, heroSelected = false, onHeroFound, onPlayAudio }) {
  const mode = data?.mode || "unlock"; // unlock | hunt

  // Общие поля (поддержим разные названия)
  const title = data?.title || data?.name || "Find the Hero";
  const description = Array.isArray(data?.description)
    ? data.description
    : typeof data?.description === "string"
      ? [data.description]
      : [];

  const footer = data?.footer || "";
  const word = data?.word || "";
  const targetChar = data?.target || data?.target_char || data?.targetChar || "";
  const charSplit = data?.char_split || data?.charSplit || null;

  const normalizeChar = (value) => {
    if (!value) return "";
    return String(value).replace(/\u25CC/g, "").trim().normalize("NFC");
  };

  const handleGlyphClick = (glyphChar, glyphMeta) => {
    if (!targetChar) return;
    if (glyphMeta?.isSubscript) return;
    const normalizedGlyph = normalizeChar(glyphChar);
    const normalizedTarget = normalizeChar(targetChar);
    if (normalizedGlyph && normalizedTarget && normalizedGlyph === normalizedTarget) {
      onHeroFound?.();
    }
  };

  const consonantCount = React.useMemo(() => {
    const chars = Array.from(word);
    let count = 0;
    for (let i = 0; i < chars.length; i += 1) {
      const ch = chars[i];
      const cp = ch.codePointAt(0);
      const isConsonant = cp >= 0x1780 && cp <= 0x17A2;
      const isSubscript = chars[i - 1] === "្";
      if (isConsonant && !isSubscript) count += 1;
    }
    return count;
  }, [word]);

  // UNLOCK: индекс последней непустой строки (чтобы сделать её жирнее)
  const lastNonEmptyIndex = (() => {
    for (let i = description.length - 1; i >= 0; i--) {
      if (String(description[i] ?? "").trim() !== "") return i;
    }
    return -1;
  })();

  // ПРАВКА: чуть меньше “резни” по высоте, ровнее паддинги
  // (не трогаем область глифа — только общую рамку/типографику)
  const frameClass =
    "pt-5 sm:pt-7 px-6 sm:px-8 pb-10 sm:pb-12 max-h-[calc(100dvh-175px)] overflow-hidden";

  if (mode === "hunt") {
    return (
      <div className="w-full flex flex-col items-center text-center animate-in fade-in duration-500">
        <LessonFrame className={frameClass} variant="full">
          <div className="h-full overflow-y-auto pr-2 flex flex-col">
            <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-4">
              Find the Hero
            </h2>

            <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400 mb-4">
              Hero:{" "}
              <span className="text-emerald-300 font-bold">
                {consonantCount}
              </span>
            </div>

            <p className="text-slate-300 mb-5 text-[clamp(0.95rem,3vw,1.05rem)]">
              Tap the main consonant.
            </p>

            {/* VisualDecoder занимает остаток высоты и центрируется — НЕ ТРОГАЕМ */}
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-[360px] w-full">
                <div className="scale-[0.95] sm:scale-[1.05] origin-top">
                  <VisualDecoder
                    text={word}
                    targetChar={targetChar}
                    charSplit={charSplit}
                    onGlyphClick={handleGlyphClick}
                    onLetterClick={onPlayAudio}
                    compact={true}
                    viewBoxPad={55}
                  />
                </div>
              </div>
            </div>

            {footer ? (
              <>
                <div className="mt-7 h-px w-full bg-white/10" />
                <p className="mt-3 text-xs sm:text-sm italic text-white/60 pb-4 leading-relaxed">
                  {footer}
                </p>
              </>
            ) : null}
          </div>
        </LessonFrame>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center text-center animate-in fade-in duration-500">
      <LessonFrame className={frameClass} variant="full">
        <div className="h-full overflow-y-auto pr-2 flex flex-col">
          {/* Маленький заголовок как в твоём дизайне */}
          <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-4">
            {title}
          </h2>

          {/* Текст слева, как в макете */}
          <div className="w-full text-left flex-shrink-0 space-y-3">
            {description.map((line, idx) => {
              const t = String(line ?? "");
              if (!t.trim()) return <div key={idx} className="h-4" />;

              const isLastStrong = idx === lastNonEmptyIndex;
              return (
                <p
                  key={idx}
                  className={
                    isLastStrong
                      ? "text-[clamp(1.25rem,4vw,1.75rem)] font-black text-white mt-1 leading-snug tracking-tight"
                      : "text-[clamp(1.1rem,3.6vw,1.5rem)] font-bold text-white/95 leading-snug"
                  }
                >
                  {t}
                </p>
              );
            })}
          </div>

          {/* VisualDecoder занимает остаток высоты — НЕ ТРОГАЕМ */}
          {word ? (
            <div className="flex-1 flex items-center justify-center mt-6 relative">
              <div className="absolute top-2 left-3 text-[10px] uppercase tracking-[0.32em] text-slate-400">
                Hero:{" "}
                <span className="text-emerald-300 font-bold">
                  {heroSelected ? 1 : 0}/{consonantCount || 1}
                </span>
              </div>
              <div className="max-w-[320px] w-full">
                <div className="scale-[0.95] sm:scale-[1.05] origin-top">
                  <VisualDecoder
                    text={word}
                    targetChar={targetChar}
                    charSplit={charSplit}
                    onGlyphClick={handleGlyphClick}
                    onLetterClick={onPlayAudio}
                    compact={true}
                    viewBoxPad={55}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {footer ? (
            <>
              <div className="mt-7 h-px w-full bg-white/10" />
              <p className="mt-3 text-xs sm:text-sm italic text-white/60 pb-4 leading-relaxed">
                {footer}
              </p>
            </>
          ) : null}
        </div>
      </LessonFrame>
    </div>
  );
}
