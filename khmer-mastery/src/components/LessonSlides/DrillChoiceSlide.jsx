import React, { useEffect, useMemo, useState } from "react";
import LessonFrame from "../UI/LessonFrame";
import LessonHeader from "../UI/LessonHeader";
import { getSoundFileForChar } from "../../data/audioMap";

/**
 * DrillChoiceSlide
 * - layout: "grid" (сетка) сейчас реализован
 * - строгая проверка A: выбранное множество === correct_ids
 *
 * Props:
 *  - data: lesson item data (object)
 *  - onPlayAudio: (filename: string) => void   // можно передать playLocalAudio
 *  - onComplete: () => void                    // вызовется при успешной проверке
 */
export default function DrillChoiceSlide({ data, onPlayAudio, onComplete }) {
  const {
    title = "",
    subtitle = "",
    prompt = "",
    layout = "grid", // "grid" | "stream" (stream добавим позже)
    mode = "multi",  // "multi" | "single" (single поддерживается)
    options = [],
    correct_ids = [],
    shuffle = true,
    success_text = "✅ Nice.",
    fail_text = "Try again.",
    check_button_text = "Check",
    reset_button_text = "Reset",
  } = data || {};

  const [selectedIds, setSelectedIds] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | correct | wrong
  const [completed, setCompleted] = useState(false);

  // Стабильная “перетасовка” на один показ карточки
  const shuffledOptions = useMemo(() => {
    const arr = Array.isArray(options) ? [...options] : [];
    if (!shuffle) return arr;

    // Fisher-Yates
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(options), shuffle]);

  // Сброс состояния при смене карточки (data)
  useEffect(() => {
    setSelectedIds([]);
    setStatus("idle");
    setCompleted(false);
  }, [data]);

  const correctSet = useMemo(() => {
    return new Set(Array.isArray(correct_ids) ? correct_ids : []);
  }, [correct_ids]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const correctSelectedCount = useMemo(() => {
    let count = 0;
    selectedIds.forEach((id) => {
      if (correctSet.has(id)) count += 1;
    });
    return count;
  }, [selectedIds, correctSet]);

  function play(option) {
    if (!onPlayAudio) return;
    if (option?.audio) {
      onPlayAudio(option.audio);
      return;
    }
    if (option?.text) {
      const fallbackAudio = getSoundFileForChar(option.text);
      if (fallbackAudio) onPlayAudio(fallbackAudio);
    }
  }

  function toggle(id, option) {
    if (!id) return;
    if (completed) return;

    // проигрываем звук на тап
    play(option);

    setStatus("idle");

    setSelectedIds((prev) => {
      const set = new Set(prev);

      if (mode === "single") {
        // single: клик = выбрать только этот
        return [id];
      }

      // multi: toggle
      if (set.has(id)) set.delete(id);
      else set.add(id);

      return Array.from(set);
    });
  }

  function setsAreEqual(aSet, bSet) {
    if (aSet.size !== bSet.size) return false;
    for (const v of aSet) if (!bSet.has(v)) return false;
    return true;
  }

  function handleCheck() {
    if (completed) return;

    // Строго A: exact match
    const ok = setsAreEqual(selectedSet, correctSet);

    if (ok) {
      setStatus("correct");
      setCompleted(true);
      // даём плееру открыть Continue
      if (typeof onComplete === "function") onComplete();
    } else {
      setStatus("wrong");
    }
  }

  function handleReset() {
    if (completed) return;
    setSelectedIds([]);
    setStatus("idle");
  }

  if (!data) {
    return (
      <div className="w-full flex justify-center px-4">
        <LessonFrame className="max-w-[720px] p-6">
          <div className="text-lg font-black uppercase tracking-[0.08em]">Missing data</div>
        </LessonFrame>
      </div>
    );
  }

  if (layout !== "grid") {
    return (
      <div className="w-full flex justify-center px-4">
        <LessonFrame className="max-w-[720px] p-6">
          <LessonHeader title={title || "Drill"} />
          <div className="text-sm text-slate-300 mt-2">
            layout="{layout}" пока не реализован. (Сделаем следующим шагом)
          </div>
        </LessonFrame>
      </div>
    );
  }

  const baseOptionClass =
    "border border-slate-500/30 rounded-2xl px-3 py-4 min-h-[84px] flex flex-col items-center justify-center bg-slate-900/60 text-white transition-all";
  const selectedOptionClass =
    "border-cyan-400 shadow-[0_0_0_2px_rgba(34,211,238,0.2)] bg-cyan-500/15";
  const selectedCorrectClass =
    "border-emerald-400 shadow-[0_0_0_2px_rgba(52,211,153,0.25)] bg-emerald-500/15";
  const selectedWrongClass =
    "border-rose-400 shadow-[0_0_0_2px_rgba(248,113,113,0.25)] bg-rose-500/10";
  const lockedOptionClass = "opacity-60 cursor-default";
  const showCorrectness = correctSet.size > 0;

  return (
    <div className="w-full flex justify-center px-4">
      <LessonFrame className="max-w-[720px] p-6">
        <LessonHeader title={title} subtitle={subtitle} hint={prompt} align="left" />

        <div className="flex items-center justify-between text-xs text-slate-400 uppercase tracking-[0.3em] mt-4">
          <span>Selected</span>
          <span className="text-cyan-300 font-black">{selectedIds.length}</span>
          <span>Correct</span>
          <span className="text-emerald-300 font-black">{correctSelectedCount} / {correctSet.size}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4 mb-5">
          {shuffledOptions.map((opt) => {
            const id = opt?.id;
            const text = opt?.text ?? "";
            const isSelected = id ? selectedSet.has(id) : false;
            const isCorrect = id ? correctSet.has(id) : false;
            const optionClassName = [
              baseOptionClass,
              isSelected && showCorrectness && isCorrect ? selectedCorrectClass : "",
              isSelected && showCorrectness && !isCorrect ? selectedWrongClass : "",
              isSelected && !showCorrectness ? selectedOptionClass : "",
              completed ? lockedOptionClass : "hover:border-cyan-400/60",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={id || text}
                type="button"
                className={optionClassName}
                onClick={() => toggle(id, opt)}
                disabled={!id || completed}
                title={opt?.hint || ""}
              >
                <div className="text-2xl leading-none">{text}</div>
                {opt?.label ? (
                  <div className="text-xs text-slate-400 mt-2">{opt.label}</div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className={`px-4 py-2 rounded-full border border-slate-500/40 text-slate-200 text-sm ${completed ? "opacity-60 cursor-default" : "hover:border-slate-300/60"}`}
            onClick={handleReset}
            disabled={completed}
          >
            {reset_button_text}
          </button>

          <button
            type="button"
            className={`px-4 py-2 rounded-full border border-cyan-400/60 bg-cyan-500/20 text-cyan-100 text-sm font-semibold ${completed ? "opacity-60 cursor-default" : "hover:bg-cyan-500/30"}`}
            onClick={handleCheck}
            disabled={completed}
          >
            {check_button_text}
          </button>
        </div>

        {status === "correct" ? (
          <div className="mt-4 px-4 py-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-100 text-sm">
            {success_text}
          </div>
        ) : null}

        {status === "wrong" ? (
          <div className="mt-4 px-4 py-2 rounded-2xl border border-rose-400/40 bg-rose-500/15 text-rose-100 text-sm">
            {fail_text}
          </div>
        ) : null}

        {/* маленькая подсказка о строгом правиле (можно убрать) */}
        <div className="mt-4 text-xs text-slate-400">
          {mode === "multi"
            ? "Нужно выбрать ровно правильный набор (лишнее = ошибка)."
            : "Нужно выбрать ровно один правильный вариант."}
        </div>
      </LessonFrame>
    </div>
  );
}
