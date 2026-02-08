// src/LessonPlayer.jsx
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { HIGHLIGHT_MODES } from '../components/VisualDecoder';
import { getSoundFileForChar } from '../data/audioMap';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import useLessonPlayer from '../hooks/useLessonPlayer';
import { t } from '../i18n';
import { DEFAULT_FEEDBACK_SOUNDS, evaluateGlyphSuccess } from '../lib/glyphFeedback';
import SessionCompletion from '../components/Session/SessionCompletion';
import SessionFrame from '../components/Session/SessionFrame';
import AnalysisSlide from '../components/LessonSlides/AnalysisSlide';
import ComparisonAudio from '../components/LessonSlides/ComparisonAudio';
import QuizSlide from '../components/LessonSlides/QuizSlide';
import VisualDecoderSlide from '../components/LessonSlides/VisualDecoderSlide';
import VocabCardSlide from '../components/LessonSlides/VocabCardSlide';
import DrillChoiceSlide from "../components/LessonSlides/DrillChoiceSlide";
// --- ИМПОРТ КОМПОНЕНТОВ ---
import HeroSlide from '../components/LessonSlides/HeroSlide';
import InventorySlide from '../components/LessonSlides/InventorySlide';
import UniversalTheorySlide from '../components/LessonSlides/UniversalTheorySlide';
import ConsonantStreamDrill from '../components/Drills/ConsonantStreamDrill';
import SameDifferentSlide from '../components/LessonSlides/SameDifferentSlide'; // <--- ДОБАВЛЕН ИМПОРТ
import IntroduceGroupSlide from '../components/LessonSlides/IntroduceGroupSlide';
import AudioGuessSlide from '../components/LessonSlides/AudioGuessSlide';
import GlyphHintCard from '../components/UI/GlyphHintCard';
import {
  buildGlyphDisplayChar,
  getGlyphHintContent,
  normalizeGlyphChar,
  resolveGlyphMeta,
  truncateHint,
  COENG_CHAR,
} from '../lib/glyphHintUtils';
import { getKhmerGlyphCategory } from '../lib/khmerGlyphRenderer';
import { buildShapeApiUrl } from '../lib/apiConfig';

const KHMER_PATTERN = /[\u1780-\u17FF]/;

export default function LessonPlayer() {
  const {
    id,
    navigate,
    lessonInfo,
    items,
    step,
    score,
    quizCount,
    canAdvance,
    isFlipped,
    loading,
    error,
    selectedOption,
    isFinished,
    lessonPassed,
    handleNext,
    playLocalAudio,
    handleVocabCardFlip,
    handleQuizAnswer,
    goBack,
    setCanAdvance,
    refresh,
    playSequence,
    alphabetDb
  } = useLessonPlayer();

  const safeItems = Array.isArray(items) ? items : [];

  // --- ЛОГИКА ДЛЯ МАТРИЦЫ (No Spaces) ---
  const [revealedConsonants, setRevealedConsonants] = useState(new Set());

  // --- СОСТОЯНИЕ UI ---
  const [highlightMode, setHighlightMode] = useState(HIGHLIGHT_MODES.ALL);
  const [visualSelectedIds, setVisualSelectedIds] = useState([]);
  const [visualGlyphCount, setVisualGlyphCount] = useState(0);
  const [visualGlyphs, setVisualGlyphs] = useState([]);
  const [visualResetSeed, setVisualResetSeed] = useState(0);
  const [heroSelected, setHeroSelected] = useState(false);
  const [noSpacesHint, setNoSpacesHint] = useState(null);
  const [noSpacesSubscriptIndices, setNoSpacesSubscriptIndices] = useState(new Set());

  // --- СБРОС СОСТОЯНИЯ ПРИ СМЕНЕ ШАГА ---
  useEffect(() => {
    // Сбрасываем все флаги при входе на новый шаг
    setCanAdvance(false);
    setRevealedConsonants(new Set());
    setVisualSelectedIds([]);
    setVisualGlyphCount(0);
    setVisualGlyphs([]);
    setVisualResetSeed((prev) => prev + 1);
    setHeroSelected(false);
    setNoSpacesHint(null);
    setNoSpacesSubscriptIndices(new Set());

    const rawType = safeItems[step]?.type;
    const currentType = rawType
      ? rawType.toLowerCase().trim().replace(/[\s-]+/g, '_')
      : '';

    const autoUnlockTypes = [
      'theory',
      'word_breakdown',
      'title',
      'ready',
      'intro',
      'analysis',
      'comparison_audio',
      'introduce_group',
      'drill_choice'
    ];

    if (autoUnlockTypes.includes(currentType)) {
      setCanAdvance(true);
    }

    setHighlightMode(HIGHLIGHT_MODES.ALL);

  }, [step, safeItems, setCanAdvance]);

  // --- ОБЕРТКА ДЛЯ ПЕРЕХОДА (FIX STALE STATE) ---
  const handleContinue = () => {
    // Принудительно блокируем кнопку ПЕРЕД переходом,
    // чтобы она не моргнула активным состоянием на новом слайде
    setCanAdvance(false);
    setHeroSelected(false);
    handleNext();
  };

  const current = safeItems[step]?.data;
  const rawType = safeItems[step]?.type;
  const type = rawType
    ? rawType.toLowerCase().trim().replace(/[\s-]+/g, '_')
    : '';
  const noSpacesWordList = current?.word_list || current?.wordList || [];

  useEffect(() => {
    if (type === 'no_spaces' && Array.isArray(noSpacesWordList) && noSpacesWordList.length > 0) {
      setCanAdvance(true);
    }
  }, [noSpacesWordList, setCanAdvance, type]);

  const baseConsonantGlyphIds = useMemo(() => {
    const ids = new Set();
    visualGlyphs.forEach((glyph, idx) => {
      const char = glyph?.resolvedChar || glyph?.char || "";
      const isConsonant = /[\u1780-\u17A2]/.test(char);
      if (isConsonant && !glyph?.isSubscript) {
        ids.add(glyph?.id ?? idx);
      }
    });
    return ids;
  }, [visualGlyphs]);

  const selectedBaseConsonantCount = useMemo(() => {
    if (!visualSelectedIds.length || baseConsonantGlyphIds.size === 0) return 0;
    return visualSelectedIds.filter((id) => baseConsonantGlyphIds.has(id)).length;
  }, [visualSelectedIds, baseConsonantGlyphIds]);

  const getFeedbackConfig = () => ({
    rule: current?.success_rule ?? current?.successRule,
    sounds: {
      ...DEFAULT_FEEDBACK_SOUNDS,
      ...(current?.feedback_sounds || {}),
      ...(current?.feedbackSounds || {}),
      ...(current?.success_sound ? { success: current.success_sound } : {}),
      ...(current?.error_sound ? { error: current.error_sound } : {})
    }
  });

  const fallbackTypeFromChar = (glyphChar) => {
    const normalized = normalizeGlyphChar(glyphChar);
    const khmerMatch = normalized.match(/[\u1780-\u17FF]/);
    const targetChar = khmerMatch ? khmerMatch[0] : normalized;
    const category = getKhmerGlyphCategory(targetChar);
    const map = {
      consonant: 'consonant',
      vowel_dep: 'vowel_dependent',
      vowel_ind: 'vowel_independent',
      diacritic: 'diacritic',
      numeral: 'numeral',
      space: 'space',
      coeng: 'consonant'
    };
    return map[category] || 'symbol';
  };

  useEffect(() => {
    if (type !== 'no_spaces' || !current?.khmerText || noSpacesWordList.length > 0) return;
    let active = true;

    fetch(`${buildShapeApiUrl("/api/shape")}?text=${encodeURIComponent(current.khmerText)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!active) return;
        const glyphs = Array.isArray(json) ? json : [];
        const resolved = resolveGlyphMeta(glyphs, current.khmerText);
        const indices = new Set();
        resolved.forEach((glyph) => {
          if (glyph.isSubscript && glyph.resolvedIndex >= 0) {
            indices.add(glyph.resolvedIndex);
          }
        });
        setNoSpacesSubscriptIndices(indices);
      })
      .catch(() => {
        if (!active) return;
        setNoSpacesSubscriptIndices(new Set());
      });

    return () => {
      active = false;
    };
  }, [current?.khmerText, noSpacesWordList.length, type]);

  const updateNoSpacesHint = (index, char) => {
    const chars = Array.from(current?.khmerText || '');
    const isSubscript = noSpacesSubscriptIndices.size > 0
      ? noSpacesSubscriptIndices.has(index)
      : chars[index - 1] === COENG_CHAR;
    const normalized = normalizeGlyphChar(char);
    const isSubscriptConsonant = isSubscript && /[\u1780-\u17A2]/.test(normalized);
    const { typeLabel, hint } = getGlyphHintContent({
      glyphChar: normalized,
      alphabetDb,
      fallbackTypeLabel: fallbackTypeFromChar
    });
    const hintMaxChars = current?.hint_max_chars ?? current?.hintMaxChars;
    const truncatedHint = truncateHint(hint, hintMaxChars);
    setNoSpacesHint({
      displayChar: buildGlyphDisplayChar({
        glyphChar: normalized,
        isSubscript,
        isSubscriptConsonant,
      }),
      typeLabel,
      hint: truncatedHint,
      isSubscript,
    });
  };

  const handleConsonantClick = (index, char) => {
    updateNoSpacesHint(index, char);
    setRevealedConsonants((prev) => {
      const next = new Set(prev);
      next.add(index);
      if (current?.khmerText) {
        const totalConsonants = Array.from(current.khmerText).filter(c => c.match(/[\u1780-\u17A2]/)).length;
        const { rule, sounds } = getFeedbackConfig();
        const chars = Array.from(current.khmerText || '');
        const isSubscript = chars[index - 1] === '្';
        const isSuccess = rule
          ? evaluateGlyphSuccess({
              rule,
              glyphChar: char,
              glyphMeta: { isSubscript },
              targetChar: current?.target ?? current?.target_char
            })
          : null;
        const soundFile = current.consonantAudioMap?.[char]
          || getSoundFileForChar(char)
          || 'click.mp3';
        if (next.size >= totalConsonants) {
          playLocalAudio('success.mp3');
          setCanAdvance(true);
        } else {
          if (isSuccess === null) {
            playLocalAudio(soundFile);
          } else {
            playSequence([isSuccess ? sounds.success : sounds.error, soundFile]);
          }
        }
      }
      return next;
    });
  };

  const handleNonConsonantClick = (index, char) => {
    updateNoSpacesHint(index, char);
    const { rule, sounds } = getFeedbackConfig();
    const chars = Array.from(current?.khmerText || '');
    const isSubscript = chars[index - 1] === '្';
    const isSuccess = rule
      ? evaluateGlyphSuccess({
          rule,
          glyphChar: char,
          glyphMeta: { isSubscript },
          targetChar: current?.target ?? current?.target_char
        })
      : false;
    const soundFile = getSoundFileForChar(char);
    if (rule) {
      const sequence = soundFile ? [isSuccess ? sounds.success : sounds.error, soundFile] : [sounds.error];
      playSequence(sequence);
    } else {
      playLocalAudio('error.mp3');
    }
  };

  const lessonPronunciations = React.useMemo(() => {
    const map = {};
    safeItems.forEach(item => {
        const data = item?.data;
        if (!data?.pronunciation) return;
        const front = data.front ?? '';
        const back = data.back ?? '';
        const khmerWord = KHMER_PATTERN.test(front) ? front : (KHMER_PATTERN.test(back) ? back : '');
        if (khmerWord) map[khmerWord] = data.pronunciation;
    });
    return map;
  }, [safeItems]);

  const getQuizOption = (opt) => {
    if (opt && typeof opt === 'object') return { value: opt.value ?? opt.text ?? '', text: opt.text ?? opt.value ?? '', pronunciation: opt.pronunciation ?? '', audio: opt.audio ?? null };
    const metadata = current?.options_metadata?.[opt];
    if (metadata) return { value: opt, text: opt, pronunciation: metadata.pronunciation, audio: metadata.audio };
    return { value: opt, text: opt, pronunciation: current?.option_pronunciations?.[opt] ?? lessonPronunciations?.[opt] ?? '', audio: null };
  };

  const playEnglishAudio = () => {
    if (typeof window === 'undefined') return;
    const txt = (KHMER_PATTERN.test(current?.front) && !KHMER_PATTERN.test(current?.back)) ? current?.back : current?.front;
    if (!txt) return;
    const utterance = new SpeechSynthesisUtterance(txt);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  if (loading) return <LoadingState label={t('loading.lesson')} />;
  if (error) return <ErrorState title={t('errors.lesson')} message={error} onRetry={refresh} secondaryAction={<Button variant="outline" onClick={() => navigate('/map')}>{t('actions.backToMap')}</Button>} />;

  if (isFinished) {
    return lessonPassed ? (
      <SessionCompletion title={t('lesson.complete')} description={t('lesson.score', { score, total: quizCount })} score={score} total={quizCount} actionLabel={t('actions.backToMap')} onAction={() => navigate('/map')} />
    ) : (
      <SessionCompletion variant="failure" title={t('lesson.reviewNeeded')} actionLabel={t('actions.retry')} onAction={refresh} />
    );
  }

  if (!safeItems.length || !safeItems[step]) return <ErrorState title={t('errors.lessonEmpty')} message={t('empty.lessonContent')} onRetry={refresh} secondaryAction={<Button variant="outline" onClick={() => navigate('/map')}>{t('actions.backToMap')}</Button>} />;

  const frontText = current?.front ?? '';
  const backText = current?.back ?? '';
  const englishText = KHMER_PATTERN.test(frontText) && !KHMER_PATTERN.test(backText) ? backText : frontText;
  const khmerText = KHMER_PATTERN.test(frontText) && !KHMER_PATTERN.test(backText) ? frontText : backText;
  const quizOptions = Array.isArray(current?.options) ? current.options : [];

  return (
    <SessionFrame
      title={lessonInfo?.title}
      progressCurrent={step + 1}
      progressTotal={safeItems.length}
      progressLabel={t('lesson.progress', { current: step + 1, total: safeItems.length })}
      score={score}
      onClose={() => navigate('/map')}
      footer={(
        <footer className="p-6 border-t border-white/5 bg-black/80">
          <div className="flex gap-3">
            <button onClick={goBack} disabled={step === 0} className={`p-5 rounded-2xl border transition-all ${step === 0 ? 'opacity-0' : 'bg-gray-900 border-white/10 text-white'}`} type="button">
              <ChevronLeft size={24} />
            </button>
            <Button onClick={handleContinue} disabled={!canAdvance} className="flex-1 text-base md:text-lg">
              {current?.type === 'ready' ? 'FINISH' : t('actions.continue')} <ArrowRight size={24} />
            </Button>
          </div>
          {!canAdvance && <p className="mt-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">{t('lesson.hintContinue')}</p>}
        </footer>
      )}
    >
      {type === 'learn_char' && (
        <HeroSlide
          key={step} // ВАЖНО: сброс состояния при смене слайда
          data={current}
          heroSelected={heroSelected}
          onHeroFound={() => {
            setHeroSelected(true);
            setCanAdvance(true);
          }}
          onPlayAudio={playLocalAudio}
          onReset={() => {
            setHeroSelected(false);
            setCanAdvance(false);
            setVisualResetSeed(s => s + 1);
          }}
          resetKey={visualResetSeed}
        />
      )}

      {/* --- ДОБАВЛЕН БЛОК ДЛЯ 4-й КАРТОЧКИ --- */}
      {type === 'same_different' && (
        <SameDifferentSlide
          data={current}
          onPlayAudio={playLocalAudio}
          onComplete={() => setCanAdvance(true)}
        />
      )}
      {type === 'drill_choice' && (
              <DrillChoiceSlide
                data={current}
                onPlayAudio={playLocalAudio}
                onComplete={() => setCanAdvance(true)}
              />
            )}

      {type === 'introduce_group' && (
        <IntroduceGroupSlide
          data={current}
          onPlayAudio={playLocalAudio}
        />
      )}

      {type === "audio_guess" && (
        <AudioGuessSlide data={current} onPlayAudio={playLocalAudio} onComplete={() => setCanAdvance(true)} />
      )}

      {type === 'word_breakdown' && (
        <InventorySlide data={current} onPlayAudio={playLocalAudio} alphabetDb={alphabetDb} />
      )}

      {type === 'visual_decoder' && (
        <VisualDecoderSlide
          key={step}
          current={current}
          highlightMode={highlightMode}
          selectionCount={selectedBaseConsonantCount}
          glyphCount={visualGlyphCount}
          onSelectionChange={(ids) => {
            setVisualSelectedIds(ids);
            const nextSelected = ids.filter((id) => baseConsonantGlyphIds.has(id)).length;
            setCanAdvance(visualGlyphCount > 0 && nextSelected >= visualGlyphCount);
          }}
          onGlyphsRendered={(glyphs) => {
            const list = Array.isArray(glyphs) ? glyphs : [];
            setVisualGlyphs(list);
            const count = list.filter((glyph) => {
              const char = glyph?.resolvedChar || glyph?.char || "";
              return /[\u1780-\u17A2]/.test(char) && !glyph?.isSubscript;
            }).length;
            setVisualGlyphCount(count);
            if (count > 0 && selectedBaseConsonantCount >= count) setCanAdvance(true);
          }}
          onResetSelection={() => {
            setVisualSelectedIds([]);
            setVisualResetSeed((prev) => prev + 1);
            setCanAdvance(false);
          }}
          resetSelectionKey={visualResetSeed}
          alphabetDb={alphabetDb}
          onLetterClick={(fileName) => fileName && playLocalAudio(fileName)}
          hideDefaultButton={true}
        />
      )}

      {type === 'vocab_card' && (
        <VocabCardSlide
          isFlipped={isFlipped}
          englishText={englishText}
          khmerText={khmerText}
          pronunciation={current.pronunciation}
          audio={current.audio}
          onFlip={() => handleVocabCardFlip(current.audio)}
          onPlayEnglishAudio={playEnglishAudio}
          onPlayAudio={() => playLocalAudio(current.audio)}
          t={t}
        />
      )}

      {type === 'quiz' && (
        <QuizSlide
          current={current}
          quizOptions={quizOptions}
          selectedOption={selectedOption}
          getQuizOption={getQuizOption}
          onAnswer={handleQuizAnswer}
        />
      )}

      {(type === 'theory' || type === 'title' || type === 'ready' || type === 'intro') && (
        <UniversalTheorySlide type={type} data={current} onPlayAudio={playLocalAudio} />
      )}

      {type === 'analysis' && (
        <AnalysisSlide data={current} onPlayAudio={playLocalAudio} alphabetDb={alphabetDb} />
      )}

      {type === 'comparison_audio' && (
        <ComparisonAudio data={current} onComplete={() => setCanAdvance(true)} hideDefaultButton={true} />
      )}

      {type === 'no_spaces' && (
        <div className="w-full flex flex-col items-center">
          <h2 className="text-3xl font-black text-white mb-2 text-center uppercase italic">{current.title}</h2>
          <p className="text-gray-400 mb-6 text-center text-sm font-medium">{current.subtitle}</p>
          <ConsonantStreamDrill
            text={current.khmerText}
            revealedSet={revealedConsonants}
            onConsonantClick={handleConsonantClick}
            onNonConsonantClick={handleNonConsonantClick}
            wordList={noSpacesWordList}
          />
          {noSpacesWordList.length === 0 ? (
            <div className="mt-4 flex justify-center w-full">
              <GlyphHintCard
                displayChar={noSpacesHint?.displayChar}
                typeLabel={noSpacesHint?.typeLabel}
                hint={noSpacesHint?.hint}
                isSubscript={noSpacesHint?.isSubscript}
                placeholder="Tap a glyph"
              />
            </div>
          ) : null}
          {noSpacesWordList.length === 0 ? (
            <div className="mt-4 p-4 bg-gray-900 rounded-2xl border border-white/10 text-xs text-gray-400 w-full text-center">
              <span className="text-emerald-400 font-bold uppercase tracking-widest mr-2">Goal:</span>
              Find all {Array.from(current.khmerText || '').filter(c => c.match(/[\u1780-\u17A2]/)).length} commanders
            </div>
          ) : null}
        </div>
      )}
    </SessionFrame>
  );
}
