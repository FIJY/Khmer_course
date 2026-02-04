import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { HIGHLIGHT_MODES } from '../components/VisualDecoder';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import useLessonPlayer from '../hooks/useLessonPlayer';
import { t } from '../i18n';
import SessionCompletion from '../components/Session/SessionCompletion';
import SessionFrame from '../components/Session/SessionFrame';
import DrillChoiceSlide from "../components/LessonSlides/DrillChoiceSlide";
import AnalysisSlide from '../components/LessonSlides/AnalysisSlide';
import ComparisonAudio from '../components/LessonSlides/ComparisonAudio';
import QuizSlide from '../components/LessonSlides/QuizSlide';
import VisualDecoderSlide from '../components/LessonSlides/VisualDecoderSlide';
import VocabCardSlide from '../components/LessonSlides/VocabCardSlide';



// --- ИМПОРТ КОМПОНЕНТОВ (БЕЗ ЛИШНИХ ПАПОК) ---
import HeroSlide from '../components/LessonSlides/HeroSlide';
import InventorySlide from '../components/LessonSlides/InventorySlide';
import UniversalTheorySlide from '../components/LessonSlides/UniversalTheorySlide';
import ConsonantStreamDrill from '../components/Drills/ConsonantStreamDrill';

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
    alphabetDb
  } = useLessonPlayer();

  const safeItems = Array.isArray(items) ? items : [];
  const audioRef = useRef(null);

  // --- ЛОГИКА ДЛЯ МАТРИЦЫ (No Spaces) ---
  const [revealedConsonants, setRevealedConsonants] = useState(new Set());

  // --- ВРЕМЕННЫЕ РЕЖИМЫ ПОДСВЕТКИ ДЛЯ DECODER ---
  const [highlightMode, setHighlightMode] = useState(HIGHLIGHT_MODES.ALL);
  const [visualSelectedIds, setVisualSelectedIds] = useState([]);
  const [visualGlyphCount, setVisualGlyphCount] = useState(0);

  // --- УПРАВЛЕНИЕ БЛОКИРОВКОЙ КНОПКИ "ДАЛЕЕ" ---
  useEffect(() => {
    setCanAdvance(false);
    setRevealedConsonants(new Set());
    setVisualSelectedIds([]);
    setVisualGlyphCount(0);

    const rawType = safeItems[step]?.type;
    const currentType = rawType
      ? rawType.toLowerCase().trim().replace(/[\s-]+/g, '_')
      : '';

    const autoUnlockTypes = [
      'theory',
      'learn_char',
      'word_breakdown',
      'title',
      'meet_teams',
      'rule',
      'reading_algorithm',
      'ready',
      'intro',
      'analysis',
      'comparison_audio'
    ];


    if (autoUnlockTypes.includes(currentType)) {
      setCanAdvance(true);
    }

    // сбрасываем режим подсветки при переходе (можно потом убрать)
    setHighlightMode(HIGHLIGHT_MODES.ALL);

  }, [step, safeItems, setCanAdvance]);

  const current = safeItems[step]?.data;

  const rawType = safeItems[step]?.type;
  const type = rawType
    ? rawType.toLowerCase().trim().replace(/[\s-]+/g, '_')
    : '';

  const handleConsonantClick = (index, char) => {
    setRevealedConsonants((prev) => {
      const next = new Set(prev);
      next.add(index);

      if (current?.khmerText) {
        const totalConsonants = Array.from(current.khmerText).filter(c => c.match(/[\u1780-\u17A2]/)).length;

        if (next.size >= totalConsonants) {
          playLocalAudio('success.mp3');
          setCanAdvance(true);
        } else {
          const soundFile = current.consonantAudioMap?.[char];
          if (soundFile) playLocalAudio(soundFile);
          else playLocalAudio('click.mp3');
        }
      }
      return next;
    });
  };

  const lessonPronunciations = React.useMemo(() => {
    const map = {};
    safeItems.forEach(item => {
      const data = item?.data;
      if (!data?.pronunciation) return;
      const front = data.front ?? '';
      const back = data.back ?? '';
      const khmerWord = KHMER_PATTERN.test(front) ? front : (KHMER_PATTERN.test(back) ? back : '');
      if (khmerWord) {
        map[khmerWord] = data.pronunciation;
      }
    });
    return map;
  }, [safeItems]);

  const getQuizOption = (opt) => {
    if (opt && typeof opt === 'object') {
      return {
        value: opt.value ?? opt.text ?? opt.label ?? opt.answer ?? '',
        text: opt.text ?? opt.value ?? opt.label ?? opt.answer ?? '',
        pronunciation: opt.pronunciation ?? '',
        audio: opt.audio ?? null
      };
    }
    const metadata = current?.options_metadata?.[opt];
    if (metadata) {
      return { value: opt, text: opt, pronunciation: metadata.pronunciation, audio: metadata.audio };
    }
    const pronunciationMap = current?.option_pronunciations || current?.pronunciations || {};
    return { value: opt, text: opt, pronunciation: pronunciationMap?.[opt] ?? lessonPronunciations?.[opt] ?? '', audio: null };
  };

  if (loading) return <LoadingState label={t('loading.lesson')} />;
  if (error) return <ErrorState title={t('errors.lesson')} message={error} onRetry={refresh} secondaryAction={<Button variant="outline" onClick={() => navigate('/map')}>{t('actions.backToMap')}</Button>} />;

  if (isFinished) {
    return lessonPassed ? (
      <SessionCompletion
        title={t('lesson.complete')}
        description={t('lesson.score', { score, total: quizCount })}
        score={score}
        total={quizCount}
        actionLabel={t('actions.backToMap')}
        onAction={() => navigate('/map')}
      />
    ) : (
      <SessionCompletion
        variant="failure"
        title={t('lesson.reviewNeeded')}
        actionLabel={t('actions.retry')}
        onAction={refresh}
      />
    );
  }

  if (!safeItems.length || !safeItems[step]) return <ErrorState title={t('errors.lessonEmpty')} message={t('empty.lessonContent')} onRetry={refresh} secondaryAction={<Button variant="outline" onClick={() => navigate('/map')}>{t('actions.backToMap')}</Button>} />;

  const frontText = current?.front ?? '';
  const backText = current?.back ?? '';
  const frontHasKhmer = KHMER_PATTERN.test(frontText);
  const backHasKhmer = KHMER_PATTERN.test(backText);
  const englishText = frontHasKhmer && !backHasKhmer ? backText : frontText;
  const khmerText = frontHasKhmer && !backHasKhmer ? frontText : backText;
  const quizOptions = Array.isArray(current?.options) ? current.options : [];
  const playEnglishAudio = () => {
    if (typeof window === 'undefined') return;
    if (!englishText) return;
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(englishText);
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

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
            <Button onClick={handleNext} disabled={!canAdvance} className="flex-1">
              {current?.type === 'ready' ? 'FINISH' : t('actions.continue')} <ArrowRight size={20} />
            </Button>
          </div>
          {!canAdvance && <p className="mt-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">{t('lesson.hintContinue')}</p>}
        </footer>
      )}
    >
      {type === 'learn_char' && (
        <HeroSlide data={current} onPlayAudio={playLocalAudio} />
      )}
      {type === "drill_choice" && (
        <DrillChoiceSlide
          data={current}
          onPlayAudio={playLocalAudio}
          onComplete={() => setCanAdvance(true)}
        />
      )}



      {type === 'word_breakdown' && (
        <InventorySlide data={current} onPlayAudio={playLocalAudio} />
      )}

      {/* --- ВИЗУАЛЬНЫЙ ДЕКОДЕР --- */}
      {type === 'visual_decoder' && (
        <VisualDecoderSlide
          key={step}
          current={current}
          highlightMode={highlightMode}
          selectionCount={visualSelectedIds.length}
          glyphCount={visualGlyphCount}
          onSelectionChange={setVisualSelectedIds}
          onGlyphsRendered={(glyphs) => setVisualGlyphCount(glyphs?.length || 0)}
          onLetterClick={(fileName) => {
            if (fileName) {
              console.log("Playing audio file:", fileName);
              playLocalAudio(fileName);
            } else {
              console.log("Silent character selected (no audio)");
            }
            setCanAdvance(true);
          }}
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

      {/* УНИВЕРСАЛЬНАЯ ТЕОРИЯ */}
      {(type === 'theory' || type === 'title' || type === 'meet_teams' || type === 'rule' || type === 'reading_algorithm' || type === 'ready' || type === 'intro') && (
        <UniversalTheorySlide
          type={type}
          data={current}
          onPlayAudio={playLocalAudio}
        />
      )}

      {type === 'analysis' && (
        <AnalysisSlide
          data={current}
          onPlayAudio={playLocalAudio}
          alphabetDb={alphabetDb}
        />
      )}
      {type === 'comparison_audio' && (
        <ComparisonAudio
          data={current}
          onComplete={() => setCanAdvance(true)}
          hideDefaultButton={true}
        />
      )}


      {type === 'no_spaces' && (
        <div className="w-full flex flex-col items-center">
          <h2 className="text-3xl font-black text-white mb-2 text-center uppercase italic">{current.title}</h2>
          <p className="text-gray-400 mb-6 text-center text-sm font-medium">{current.subtitle}</p>

          <ConsonantStreamDrill
            text={current.khmerText}
            revealedSet={revealedConsonants}
            onConsonantClick={handleConsonantClick}
            onNonConsonantClick={() => playLocalAudio('error.mp3')}
          />

          <div className="mt-4 p-4 bg-gray-900 rounded-2xl border border-white/10 text-xs text-gray-400 w-full text-center">
            <span className="text-emerald-400 font-bold uppercase tracking-widest mr-2">Goal:</span>
            Find all {Array.from(current.khmerText || '').filter(c => c.match(/[\u1780-\u17A2]/)).length} commanders
          </div>
        </div>
      )}
    </SessionFrame>
  );
}
