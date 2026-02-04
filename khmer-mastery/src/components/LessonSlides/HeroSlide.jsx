import React from "react";
import LessonFrame from "../UI/LessonFrame";
import VisualDecoder from "../VisualDecoder";

export default function HeroSlide({ data, onPlayAudio }) {
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

  // HUNT: твой текущий интерактивный режим оставляем (почти) как был
  if (mode === "hunt") {
    return (
      <div className="w-full flex flex-col items-center text-center animate-in fade-in duration-500">
        <LessonFrame className="p-10" variant="full">
          <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-4">
            Find the Hero
          </h2>

          <p className="text-gray-300 mb-6">Tap the main consonant.</p>

          <div className="scale-125">
            <VisualDecoder
              text={word}
              targetChar={targetChar}
              charSplit={charSplit}
              onGlyphClick={onPlayAudio}
            />
          </div>
        </LessonFrame>
      </div>
    );
  }

  // UNLOCK: делаем верстку как на твоём “красивом” theory-слайде + вставляем VisualDecoder в пустое место
  const lastNonEmptyIndex = (() => {
    for (let i = description.length - 1; i >= 0; i--) {
      if (String(description[i] ?? "").trim() !== "") return i;
    }
    return -1;
  })();

  return (
    <div className="w-full flex flex-col items-center text-center animate-in fade-in duration-500">
      <LessonFrame className="p-10" variant="full">
        {/* Маленький заголовок как в твоём дизайне */}
        <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-6">
          {title}
        </h2>

        {/* Текст слева, как в макете */}
        <div className="w-full text-left">
          {description.map((line, idx) => {
            const t = String(line ?? "");
            if (!t.trim()) return <div key={idx} className="h-4" />;

            const isLastStrong = idx === lastNonEmptyIndex;
            return (
              <p
                key={idx}
                className={
                  isLastStrong
                    ? "text-2xl font-black text-white mt-2"
                    : "text-2xl font-bold text-white/95"
                }
              >
                {t}
              </p>
            );
          })}
        </div>

        {/* Пустое место -> VisualDecoder (кликабельные глифы) */}
        {word ? (
          <div className="mt-8 flex justify-center">
            <div className="w-full flex justify-center">
              <div className="max-w-[320px] w-full">
                <div className="scale-[1.25] origin-top">
                  <VisualDecoder
                    text={word}
                    targetChar={targetChar}
                    charSplit={charSplit}
                    onGlyphClick={onPlayAudio}
                  />
                </div>
              </div>
            </div>
          </div>

        ) : null}

        {footer ? (
          <>
            <div className="mt-8 h-px w-full bg-white/10" />
            <p className="mt-4 text-sm italic text-white/60 pb-6">{footer}</p>
          </>
        ) : null}
      </LessonFrame>
    </div>
  );
}
