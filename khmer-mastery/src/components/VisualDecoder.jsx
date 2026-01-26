import React, { useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import KhmerEngineFinal from "./KhmerEngineFinal";

const DEFAULT_KHMER_FONT_URL =
  import.meta.env.VITE_KHMER_FONT_URL ?? "/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf";

export default function VisualDecoder({ data, onComplete, hideDefaultButton = true }) {
  const [picked, setPicked] = useState(null); // { gid, index } from engine

  const word = data?.word ?? data?.khmer ?? data?.khmerText ?? data?.text ?? "";
  const translation = data?.english_translation ?? data?.translation ?? data?.meaning ?? "";
  const pronunciation = data?.pronunciation ?? "";
  const hint = data?.hint ?? data?.task ?? "";

  const audioFile = data?.word_audio ?? data?.audio ?? null;

  const canComplete = useMemo(() => !!picked, [picked]);

  const playAudio = (file) => {
    if (!file) return;
    const src = file.startsWith("/") ? file : `/sounds/${file}`;
    const a = new Audio(src);
    a.play().catch(() => {});
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-6">
      {/* Главная карточка */}
      <div className="w-full max-w-[420px] bg-gray-900/60 border border-white/10 rounded-[2rem] p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Visual Decoder
            </div>
            {hint && (
              <div className="mt-2 text-xs text-gray-300 font-semibold">
                {hint}
              </div>
            )}
          </div>

          {audioFile && (
            <button
              type="button"
              onClick={() => playAudio(audioFile)}
              className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-cyan-500/20 hover:border-cyan-400/30 transition"
              title="Play audio"
            >
              <Volume2 size={18} />
            </button>
          )}
        </div>

        {/* Глифовый движок */}
        <div className="flex justify-center">
          <KhmerEngineFinal
            text={word}
            fontUrl={DEFAULT_KHMER_FONT_URL}
            fontSize={130}
            padding={40}
            height={260}
            onSelect={(payload) => {
              // payload: { gid, index } (см. патч ниже)
              setPicked(payload);
              // если хочешь авто-разблок при первом выборе:
              // onComplete?.();
            }}
          />
        </div>

        {/* Инфо про выбранный глиф */}
        <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/10">
          <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
            Selected glyph
          </div>

          {picked ? (
            <div className="flex flex-col gap-2">
              <div className="text-sm text-white font-bold">
                glyph_id: <span className="text-cyan-300">{picked.gid}</span>{" "}
                <span className="text-gray-500 font-semibold">#{picked.index}</span>
              </div>
              <div className="text-xs text-gray-300">
                Теперь ты можешь привязывать этот glyph_id к “типу” (согласная/гласная/подписная/диакритика)
                и сохранять в свою базу.
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">
              Нажми на любой глиф, чтобы выбрать.
            </div>
          )}
        </div>

        {/* Переводы */}
        {(translation || pronunciation) && (
          <div className="mt-4 text-center space-y-2">
            {pronunciation && (
              <div className="text-cyan-200 font-mono text-lg tracking-widest">
                /{pronunciation}/
              </div>
            )}
            {translation && (
              <div className="text-white text-2xl font-black italic uppercase">
                {translation}
              </div>
            )}
          </div>
        )}

        {/* Кнопка завершения (если надо) */}
        {!hideDefaultButton && (
          <button
            type="button"
            disabled={!canComplete}
            onClick={() => onComplete?.()}
            className={`mt-5 w-full py-4 rounded-2xl font-black uppercase tracking-widest transition border
              ${canComplete
                ? "bg-cyan-500/20 border-cyan-400/30 text-cyan-200 hover:bg-cyan-500/30"
                : "bg-white/5 border-white/10 text-gray-500 cursor-not-allowed"
              }`}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
