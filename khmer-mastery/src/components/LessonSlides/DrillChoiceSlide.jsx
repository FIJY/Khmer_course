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
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "28px",
    padding: "24px",
    boxShadow: "0 22px 45px rgba(0,0,0,0.45)",
    background: "linear-gradient(180deg, rgba(20,27,40,0.96), rgba(10,14,24,0.98))",
    color: "rgba(255,255,255,0.92)",
    boxSizing: "border-box",
  },

  title: {
    fontSize: "20px",
    fontWeight: 800,
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
  },
  subtitle: {
    fontSize: "12px",
    opacity: 0.6,
    marginBottom: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.2em",
  },
  prompt: {
    fontSize: "15px",
    marginBottom: "16px",
    lineHeight: 1.5,
    color: "rgba(226,232,240,0.8)",
  },
  text: {
    fontSize: "14px",
    opacity: 0.8,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "12px",
    marginBottom: "18px",
  },
  option: {
    border: "1px solid rgba(148,163,184,0.2)",
    borderRadius: "18px",
    padding: "16px 10px",
    cursor: "pointer",
    background: "rgba(15,23,42,0.8)",
    minHeight: "84px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    userSelect: "none",
  },
  optionSelected: {
    border: "2px solid rgba(34,211,238,0.9)",
    boxShadow: "0 0 0 2px rgba(34,211,238,0.15)",
    background: "rgba(14,116,144,0.28)",
  },
  optionLocked: {
    opacity: 0.6,
    cursor: "default",
  },
  optionText: {
    fontSize: "30px",
    lineHeight: 1,
  },
  optionLabel: {
    fontSize: "12px",
    opacity: 0.65,
    marginTop: "6px",
  },
  actions: {
    display: "flex",
    gap: "10px",
    justifyContent: "flex-end",
    marginTop: "8px",
  },
  actionBtn: {
    border: "1px solid rgba(148,163,184,0.35)",
    borderRadius: "14px",
    padding: "10px 16px",
    background: "rgba(15,23,42,0.7)",
    cursor: "pointer",
    fontSize: "14px",
    color: "rgba(226,232,240,0.9)",
  },
  primaryBtn: {
    border: "1px solid rgba(34,211,238,0.7)",
    background: "rgba(34,211,238,0.18)",
    color: "rgba(255,255,255,0.95)",
    fontWeight: 700,
  },
  btnDisabled: {
    opacity: 0.6,
    cursor: "default",
  },
  feedback: {
    marginTop: "12px",
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "14px",
  },
  feedbackOk: {
    border: "1px solid rgba(34,211,238,0.4)",
    background: "rgba(20,184,166,0.15)",
  },
  feedbackBad: {
    border: "1px solid rgba(248,113,113,0.4)",
    background: "rgba(248,113,113,0.12)",
  },
  micro: {
    marginTop: "10px",
    fontSize: "12px",
    opacity: 0.55,
    color: "rgba(148,163,184,0.9)",
  },
};
