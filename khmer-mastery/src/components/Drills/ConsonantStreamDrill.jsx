import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Check, Star, MousePointerClick, AlertTriangle } from "lucide-react";
import LessonFrame from "../UI/LessonFrame";
import VisualDecoder from "../VisualDecoder";

// Хелпер: проверка на согласную
const isKhmerConsonant = (ch) => {
  if (!ch) return false;
  const code = ch.codePointAt(0);
  return code >= 0x1780 && code <= 0x17a2;
};

export default function ConsonantStreamDrill(props) {
  const { onPlayAudio, onComplete } = props;

  // --- УМНЫЙ ПОИСК ДАННЫХ ---
  const source = useMemo(() => {
    if (props.data) {
      if (props.data.khmerText || props.data.text) return props.data;
      if (props.data.data && (props.data.data.khmerText || props.data.data.text)) return props.data.data;
    }
    if (props.khmerText || props.text) return props;
    return {};
  }, [props]);

  const title = source.title || "No Spaces Drill";
  const subtitle = source.subtitle || "Tap each consonant in the stream.";
  const khmerText = source.khmerText || source.text || "";
  const wordList = source.word_list || source.wordList || [];

  const [foundIds, setFoundIds] = useState([]);
  const [errorId, setErrorId] = useState(null);
  const [renderedGlyphs, setRenderedGlyphs] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  // Хендлер рендера основного текста
  const handleGlyphsRendered = useCallback((glyphs) => {
    setRenderedGlyphs((prev) => {
      if (prev.length === glyphs.length && prev[0]?.char === glyphs[0]?.char) {
        return prev;
      }
      return glyphs;
    });
  }, []);

  const targetIds = useMemo(() => {
    if (!renderedGlyphs.length) return new Set();
    const targets = new Set();
    renderedGlyphs.forEach((g, idx) => {
      const char = g.resolvedChar || g.char;
      if (isKhmerConsonant(char) && !g.isSubscript) {
        targets.add(g.id ?? idx);
      }
    });
    return targets;
  }, [renderedGlyphs]);

  useEffect(() => {
    if (targetIds.size > 0 && foundIds.length === targetIds.size) {
      if (!isFinished) {
        setIsFinished(true);
        if (onPlayAudio) onPlayAudio("success.mp3");
        setTimeout(() => {
           if (onComplete) onComplete();
        }, 1500);
      }
    }
  }, [foundIds, targetIds, isFinished, onPlayAudio, onComplete]);

  const handleGlyphClick = useCallback((char, meta) => {
    if (isFinished) return;
    const glyphId = meta.id ?? meta.index;

    if (foundIds.includes(glyphId)) return;

    if (targetIds.has(glyphId)) {
      setFoundIds(prev => [...prev, glyphId]);
      if (onPlayAudio) onPlayAudio("click.mp3");
    } else {
      setErrorId(glyphId);
      if (onPlayAudio) onPlayAudio("error.mp3");
      setTimeout(() => setErrorId(null), 400);
    }
  }, [foundIds, targetIds, isFinished, onPlayAudio]);

  const getFillColor = useCallback(({ idx, glyph }) => {
    const id = glyph.id ?? idx;
    if (foundIds.includes(id)) return "#34d399";
    if (errorId === id) return "#ef4444";
    if (isFinished && !targetIds.has(id)) return "rgba(255,255,255,0.2)";
    return "white";
  }, [foundIds, errorId, isFinished, targetIds]);

  if (!khmerText) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6 bg-black">
         <div className="text-red-400">Data Error: No text provided</div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
      <LessonFrame className="px-4 pt-6 pb-10 border-0 flex flex-col items-center h-auto min-h-full overflow-y-auto" variant="full">

        {/* ЗАГОЛОВОК */}
        <div className="text-center mb-6 w-full sticky top-0 bg-[#0f172a] z-10 py-2">
          <div className="flex items-center justify-center gap-2 mb-2">
             <MousePointerClick size={16} className="text-cyan-400" />
             <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
               {title}
             </h2>
          </div>
          <p className="text-lg font-medium text-white mb-3">{subtitle}</p>

          <div className="flex items-center justify-center gap-3">
             <div className="h-2 w-32 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                <div
                   className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                   style={{ width: `${(foundIds.length / (targetIds.size || 1)) * 100}%` }}
                />
             </div>
             <span className="text-sm font-mono font-bold text-gray-300">
                {foundIds.length} / {targetIds.size}
             </span>
          </div>
        </div>

        {/* ИГРОВАЯ ЗОНА */}
        <div className="w-full bg-gray-900/50 rounded-3xl border border-white/10 p-8 mb-8 min-h-[180px] flex items-center justify-center relative shadow-inner">
             <VisualDecoder
                text={khmerText}
                compact={false}
                interactionMode="view_only"
                hideDefaultButton={true}
                onGlyphsRendered={handleGlyphsRendered}
                onGlyphClick={handleGlyphClick}
                getGlyphFillColor={getFillColor}
                viewBoxPad={40}
             />

             {isFinished && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] rounded-3xl animate-in fade-in duration-300 z-20">
                    <div className="bg-emerald-500 text-black px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3 transform scale-110">
                        <Check size={24} strokeWidth={3} /> Excellent!
                    </div>
                </div>
             )}
        </div>

        {/* --- СПРАВОЧНИК СЛОВ (ТЕПЕРЬ С ГЛИФАМИ) --- */}
        {wordList && wordList.length > 0 && (
            <div className="w-full max-w-md space-y-4 pb-6">
                <div className="flex items-center gap-3 pl-2 opacity-60 mb-2">
                    <div className="h-[1px] flex-1 bg-white/30"></div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-300 font-semibold">Words in this stream</span>
                    <div className="h-[1px] flex-1 bg-white/30"></div>
                </div>

                {wordList.map((word, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-3 px-5 hover:bg-white/10 transition-colors">
                        <div className="flex flex-col gap-1">
                            {/* ЗАМЕНА: Вместо текста используем VisualDecoder для слова */}
                            <div className="h-12 min-w-[80px] relative -ml-2">
                                <VisualDecoder
                                    text={word.khmer}
                                    compact={true}
                                    interactionMode="view_only"
                                    hideDefaultButton={true}
                                    viewBoxPad={20} // Плотный вид
                                />
                            </div>

                            {word.pronunciation && (
                                <div className="text-xs text-slate-400 font-mono pl-1">{word.pronunciation}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-right">
                            {word.translation && (
                                <span className="text-sm text-slate-300 font-medium">{word.translation}</span>
                            )}
                            {word.starred && <Star size={16} className="text-amber-400 fill-amber-400" />}
                        </div>
                    </div>
                ))}
            </div>
        )}

      </LessonFrame>
    </div>
  );
}