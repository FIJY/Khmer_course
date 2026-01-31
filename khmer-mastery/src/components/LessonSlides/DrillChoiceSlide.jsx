import React, { useEffect, useMemo, useState } from "react";

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

  function play(option) {
    if (!onPlayAudio) return;
    if (option?.audio) onPlayAudio(option.audio);
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
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.title}>Missing data</div>
        </div>
      </div>
    );
  }

  if (layout !== "grid") {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.title}>{title || "Drill"}</div>
          <div style={styles.text}>
            layout="{layout}" пока не реализован. (Сделаем следующим шагом)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        {title ? <div style={styles.title}>{title}</div> : null}
        {subtitle ? <div style={styles.subtitle}>{subtitle}</div> : null}
        {prompt ? <div style={styles.prompt}>{prompt}</div> : null}

        <div style={styles.grid}>
          {shuffledOptions.map((opt) => {
            const id = opt?.id;
            const text = opt?.text ?? "";
            const isSelected = id ? selectedSet.has(id) : false;

            const btnStyle = {
              ...styles.option,
              ...(isSelected ? styles.optionSelected : null),
              ...(completed ? styles.optionLocked : null),
            };

            return (
              <button
                key={id || text}
                type="button"
                style={btnStyle}
                onClick={() => toggle(id, opt)}
                disabled={!id || completed}
                title={opt?.hint || ""}
              >
                <div style={styles.optionText}>{text}</div>
                {opt?.label ? (
                  <div style={styles.optionLabel}>{opt.label}</div>
                ) : null}
              </button>
            );
          })}
        </div>

        <div style={styles.actions}>
          <button
            type="button"
            style={{ ...styles.actionBtn, ...(completed ? styles.btnDisabled : null) }}
            onClick={handleReset}
            disabled={completed}
          >
            {reset_button_text}
          </button>

          <button
            type="button"
            style={{
              ...styles.actionBtn,
              ...styles.primaryBtn,
              ...(completed ? styles.btnDisabled : null),
            }}
            onClick={handleCheck}
            disabled={completed}
          >
            {check_button_text}
          </button>
        </div>

        {status === "correct" ? (
          <div style={{ ...styles.feedback, ...styles.feedbackOk }}>
            {success_text}
          </div>
        ) : null}

        {status === "wrong" ? (
          <div style={{ ...styles.feedback, ...styles.feedbackBad }}>
            {fail_text}
          </div>
        ) : null}

        {/* маленькая подсказка о строгом правиле (можно убрать) */}
        <div style={styles.micro}>
          {mode === "multi"
            ? "Нужно выбрать ровно правильный набор (лишнее = ошибка)."
            : "Нужно выбрать ровно один правильный вариант."}
        </div>
      </div>
    </div>
  );
}

// Минимальные стили без зависимости от tailwind
const styles = {
  wrap: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    padding: "16px",
    boxSizing: "border-box",
  },
  card: {
    width: "100%",
    maxWidth: "720px",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
    background: "white",
    color: "rgba(0,0,0,0.92)", // <-- ДОБАВЬ ЭТО
    boxSizing: "border-box",
  },

  title: {
    fontSize: "20px",
    fontWeight: 700,
    marginBottom: "6px",
  },
  subtitle: {
    fontSize: "14px",
    opacity: 0.7,
    marginBottom: "12px",
  },
  prompt: {
    fontSize: "16px",
    marginBottom: "14px",
    lineHeight: 1.35,
  },
  text: {
    fontSize: "14px",
    opacity: 0.8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "10px",
    marginTop: "10px",
    marginBottom: "14px",
  },
  option: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: "14px",
    padding: "14px 10px",
    cursor: "pointer",
    background: "white",
    minHeight: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    userSelect: "none",
  },
  optionSelected: {
    border: "2px solid rgba(0,0,0,0.65)",
  },
  optionLocked: {
    opacity: 0.75,
    cursor: "default",
  },
  optionText: {
    fontSize: "30px",
    lineHeight: 1,
  },
  optionLabel: {
    fontSize: "12px",
    opacity: 0.7,
    marginTop: "6px",
  },
  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "6px",
  },
  actionBtn: {
    border: "1px solid rgba(0,0,0,0.15)",
    borderRadius: "12px",
    padding: "10px 14px",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
  },
  primaryBtn: {
    border: "1px solid rgba(0,0,0,0.75)",
    fontWeight: 600,
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "default",
  },
  feedback: {
    marginTop: "12px",
    padding: "10px 12px",
    borderRadius: "12px",
    fontSize: "14px",
  },
  feedbackOk: {
    border: "1px solid rgba(0,0,0,0.18)",
  },
  feedbackBad: {
    border: "1px solid rgba(0,0,0,0.18)",
  },
  micro: {
    marginTop: "10px",
    fontSize: "12px",
    opacity: 0.55,
  },
};
