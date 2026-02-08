import React from "react";

const VARIANTS = {
  compact: {
    container: "px-4 py-2 min-h-[64px]",
    char: "text-3xl",
    typeLabel: "text-[10px] uppercase tracking-[0.3em] text-slate-300",
    hint: "text-xs text-slate-300",
  },
  detail: {
    container: "px-5 py-4 min-h-[96px]",
    char: "text-4xl",
    typeLabel: "text-xs uppercase tracking-[0.3em] text-slate-300",
    hint: "text-sm text-slate-200",
  },
};

export default function GlyphHintCard({
  displayChar,
  typeLabel,
  hint,
  isSubscript,
  placeholder = "Tap a glyph",
  variant = "compact",
  className = "",
}) {
  const styles = VARIANTS[variant] || VARIANTS.compact;
  const hasData = Boolean(displayChar);

  return (
    <div
      className={`w-full max-w-xl rounded-2xl border border-white/10 bg-black/40 text-white flex items-center ${styles.container} ${className}`}
    >
      {hasData ? (
        <div className="flex items-center gap-4">
          <div className={`font-khmer ${styles.char}`}>{displayChar}</div>
          <div className="flex flex-col gap-1">
            <div className={styles.typeLabel}>Type</div>
            <div className="text-sm font-semibold text-white">{typeLabel || "Unknown type"}</div>
            {hint ? <div className={styles.hint}>{hint}</div> : null}
            {isSubscript ? (
              <div className="text-xs text-amber-300">Subscript consonant</div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
          {placeholder}
        </div>
      )}
    </div>
  );
}
