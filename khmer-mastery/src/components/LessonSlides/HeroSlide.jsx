// src/components/LessonSlides/HeroSlide.jsx
import React, { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import LessonFrame from "../UI/LessonFrame";
import VisualDecoder from "../VisualDecoder";
import { getKhmerGlyphCategory } from "../../lib/khmerGlyphRenderer";
import { getSoundFileForChar } from "../../data/audioMap";
import useAudioPlayer from "../../hooks/useAudioPlayer";
import {
  DEFAULT_FEEDBACK_SOUNDS,
  evaluateGlyphSuccess
} from "../../lib/glyphFeedback";
import GlyphHintCard from "../UI/GlyphHintCard";
import {
  buildGlyphDisplayChar,
  normalizeGlyphChar,
} from "../../lib/glyphHintUtils";

export default function HeroSlide({
  data,
  heroSelected = false,
  onHeroFound,
  onPlayAudio,
  onReset,
  resetKey
}) {
  const [activeChar, setActiveChar] = useState(null);
  const [localResetKey, setLocalResetKey] = useState(0);

  // НОВОЕ: Состояние для хранения всех найденных "Героев"
  const [foundConsonants, setFoundConsonants] = useState(new Set());

  const footerRef = useRef(null);
  const { playSequence } = useAudioPlayer();

  const word = data?.word || "";
  const targetChar = data?.target || data?.target_char || "";
  const charSplit = data?.char_split || null;
  const title = data?.title || data?.name || "Find the Hero";
  const description = Array.isArray(data?.description) ? data.description : [data?.description || ""];
  const footer = data?.footer || "";
  const successRule = data?.success_rule ?? data?.successRule ?? (targetChar ? "target" : null);
  const feedbackSounds = {
    ...DEFAULT_FEEDBACK_SOUNDS,
    ...(data?.feedback_sounds || {}),
    ...(data?.feedbackSounds || {}),
    ...(data?.success_sound ? { success: data.success_sound } : {}),
    ...(data?.error_sound ? { error: data.error_sound } : {}),
  };

  const normalizeChar = (v) => normalizeGlyphChar(v);

  useEffect(() => {
    if (activeChar && footerRef.current) {
      const timer = setTimeout(() => {
        footerRef.current.scrollIntoView({ behavior: "smooth", block: "end", inline: "nearest" });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeChar]);

  // Считаем общее количество согласных в слове (знаменатель счетчика)
  const consonantCount = React.useMemo(() => {
    const chars = Array.from(word);
    let count = 0;
    for (let i = 0; i < chars.length; i++) {
      const cp = chars[i].codePointAt(0);
      // Считаем только буквы диапазона согласных, которые НЕ являются ножками
      if (cp >= 0x1780 && cp <= 0x17A2 && chars[i-1] !== "្") count++;
    }
    return count;
  }, [word]);

  const handleGlyphClick = (glyphChar, glyphMeta) => {
    setActiveChar(glyphMeta);

    // Получаем категорию символа для точной проверки
    const normChar = normalizeChar(glyphChar);
    const category = getKhmerGlyphCategory(normChar);
    const isTarget = normalizeChar(glyphChar) === normalizeChar(targetChar);
    const soundFile = getSoundFileForChar(glyphChar);

    // Логика счетчика: Если это БАЗОВАЯ согласная (не ножка и не знак)
    if (category === 'consonant' && !glyphMeta?.isSubscript) {
        // Добавляем ID глифа (или индекс) в список найденных
        const id = glyphMeta.id ?? glyphMeta.index; // Убедись, что ID уникален
        setFoundConsonants(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }

    // Логика победы (только если нашли Цель)
    if (targetChar && !glyphMeta?.isSubscript && isTarget) {
      onHeroFound?.();
    }

    if (soundFile && successRule) {
      const isSuccess = evaluateGlyphSuccess({
        rule: successRule,
        glyphChar,
        glyphMeta,
        targetChar
      });
      const feedbackSound = isSuccess ? feedbackSounds.success : feedbackSounds.error;
      const sequence = soundFile ? [feedbackSound, soundFile] : [feedbackSound];
      playSequence(sequence, { gapMs: 200 });
      return;
    }

    if (soundFile && onPlayAudio) {
      onPlayAudio(soundFile);
    }
  };

  const handleFullReset = () => {
    setActiveChar(null);
    setFoundConsonants(new Set()); // Сбрасываем счетчик найденных
    setLocalResetKey(prev => prev + 1);
    if (onReset) onReset();
  };

  // Умная функция определения роли для подсказки
  const getRoleInfo = (charData) => {
    const char = normalizeChar(charData.resolvedChar);
    const isTarget = char === normalizeChar(targetChar);

    // 1. Сначала проверяем ножки
    if (charData.isSubscript) {
      return {
        title: "Subscript Consonant",
        desc: "A 'leg' attached to the Hero. It modifies the block.",
        color: "text-amber-300"
      };
    }

    // 2. Если это наша цель
    if (isTarget) {
      return {
        title: "The Hero",
        desc: "Correct! This is the main consonant.",
        color: "text-emerald-300"
      };
    }

    // 3. Используем точную классификацию из библиотеки
    const category = getKhmerGlyphCategory(char);

    switch (category) {
      case 'consonant':
        return {
          title: "Consonant",
          desc: "A Hero, but not the one we are looking for.",
          color: "text-white"
        };
      case 'vowel_dep':
        return {
          title: "Dependent Vowel",
          desc: "An accessory. It needs a Hero to make a sound.",
          color: "text-blue-300"
        };
      case 'vowel_ind':
        return {
          title: "Independent Vowel",
          desc: "A rare vowel that can stand alone.",
          color: "text-indigo-300"
        };
      case 'diacritic':
        return {
          title: "Diacritic / Sign", // Исправлено для кружочка ំ
          desc: "A sign that changes the sound length or tone.",
          color: "text-pink-300"
        };
      case 'numeral':
        return {
          title: "Numeral",
          desc: "A Khmer number.",
          color: "text-slate-300"
        };
      default:
        return {
          title: "Accessory",
          desc: "Just a decoration or punctuation.",
          color: "text-slate-400"
        };
    }
  };

  const roleInfo = activeChar ? getRoleInfo(activeChar) : null;
  const hintDisplayChar = activeChar
    ? buildGlyphDisplayChar({
        glyphChar: activeChar.resolvedChar,
        isSubscript: activeChar.isSubscript,
        isSubscriptConsonant:
          activeChar.isSubscript && /[\u1780-\u17A2]/.test(normalizeChar(activeChar.resolvedChar)),
      })
    : null;

  return (
    <div className="w-full flex flex-col items-center text-center animate-in fade-in duration-500">
      <LessonFrame className="pt-5 px-6 pb-4 max-h-[calc(100dvh-175px)] overflow-hidden" variant="full">
        <div className="h-full overflow-y-auto pr-2 flex flex-col pb-32">
          <h2 className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 mb-6">{title}</h2>

          <div className="w-full text-left space-y-3 mb-8">
            {description.map((line, idx) => (
              <p key={idx} className={`text-white leading-snug ${idx === description.length - 1 ? 'text-2xl font-black' : 'text-lg font-bold opacity-80'}`}>
                {line}
              </p>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex items-center justify-between w-full mb-4 px-2">
              <div className="text-[10px] uppercase tracking-[0.32em] text-slate-400">
                Found: <span className="text-emerald-300 font-bold">
                    {/* Теперь счетчик показывает реальное число найденных уникальных согласных */}
                    {foundConsonants.size}/{consonantCount || 1}
                </span>
              </div>
              <button
                onClick={handleFullReset}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-slate-300 hover:text-cyan-300 transition-all active:scale-95"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            </div>

            <div className="max-w-[320px] w-full">
              <VisualDecoder
                text={word}
                targetChar={targetChar}
                charSplit={charSplit}
                onGlyphClick={handleGlyphClick}
                compact={true}
                viewBoxPad={55}
                showTapHint={false}
                resetSelectionKey={localResetKey || resetKey}
              />
            </div>

            <div className="mt-6 w-full max-w-[320px] mx-auto min-h-[140px]">
              {activeChar && roleInfo ? (
                <GlyphHintCard
                  displayChar={hintDisplayChar}
                  typeLabel={roleInfo.title}
                  hint={roleInfo.desc}
                  isSubscript={activeChar.isSubscript}
                  placeholder="Tap to analyze structure"
                  variant="detail"
                />
              ) : (
                <div className="py-8 text-[10px] uppercase tracking-[0.3em] text-slate-600 italic text-center w-full">
                  Tap to analyze structure
                </div>
              )}
            </div>
          </div>

          {footer && (
            <div ref={footerRef} className="mt-auto pt-6 border-t border-white/10 text-xs italic text-white/40 pt-10">
              {footer}
            </div>
          )}
        </div>
      </LessonFrame>
    </div>
  );
}
