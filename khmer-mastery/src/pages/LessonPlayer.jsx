import React, { useState, useEffect, useRef } from 'react';
import { Volume2, ArrowRight, X, CheckCircle2, ChevronLeft } from 'lucide-react';
import VisualDecoder, { HIGHLIGHT_MODES } from '../components/VisualDecoder';
import KhmerColoredText from '../components/KhmerColoredText';
import MobileLayout from '../components/Layout/MobileLayout';
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



// --- ИМПОРТ КОМПОНЕНТОВ (БЕЗ ЛИШНИХ ПАПОК) ---
import HeroSlide from '../components/LessonSlides/HeroSlide';
import InventorySlide from '../components/LessonSlides/InventorySlide';
import UniversalTheorySlide from '../components/LessonSlides/UniversalTheorySlide';
import ConsonantStreamDrill from '../components/Drills/ConsonantStreamDrill';

const KHMER_PATTERN = /[\u1780-\u17FF]/;
const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/KhmerOS_siemreap.ttf';

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

  // --- УПРАВЛЕНИЕ БЛОКИРОВКОЙ КНОПКИ "ДАЛЕЕ" ---
  useEffect(() => {
    setCanAdvance(false);
    setRevealedConsonants(new Set());

    const rawType = safeItems[step]?.type;
    const currentType = rawType ? rawType.toLowerCase() : '';

    const autoUnlockTypes = [
      'theory',
      'learn_char',
      'word_breakdown',
      'title',
      'meet-teams',
      'rule',
      'reading-algorithm',
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
  const type = rawType ? rawType.toLowerCase() : '';

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
        <div className="w-full">
          {/* ВРЕМЕННЫЕ ТАБЫ РЕЖИМОВ */}
          <div className="flex justify-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => setHighlightMode(HIGHLIGHT_MODES.ALL)}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                highlightMode === HIGHLIGHT_MODES.ALL
                  ? 'bg-cyan-500 text-black border-cyan-300'
                  : 'bg-gray-900 text-white border-white/10'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setHighlightMode(HIGHLIGHT_MODES.CONSONANTS)}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                highlightMode === HIGHLIGHT_MODES.CONSONANTS
                  ? 'bg-cyan-500 text-black border-cyan-300'
                  : 'bg-gray-900 text-white border-white/10'
              }`}
            >
              Consonants
            </button>
            <button
              type="button"
              onClick={() => setHighlightMode(HIGHLIGHT_MODES.OFF)}
              className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                highlightMode === HIGHLIGHT_MODES.OFF
                  ? 'bg-cyan-500 text-black border-cyan-300'
                  : 'bg-gray-900 text-white border-white/10'
              }`}
            >
              Off
            </button>
          </div>

          <VisualDecoder
            key={step}
            data={current}
            highlightMode={highlightMode}
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
        </div>
      )}

      {type === 'vocab_card' && (
        <div className="w-full cursor-pointer" onClick={() => handleVocabCardFlip(current.audio)}>
          <div className={`relative h-[22rem] transition-all duration-500 preserve-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-8 text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">{t('lesson.cardEnglish')}</p>
              <h2 className="text-3xl font-black italic text-white">{englishText}</h2>
            </div>
            <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-8 text-center text-white">
              <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">{t('lesson.cardKhmer')}</p>
              <div className="flex flex-col items-center gap-3 w-full">
                <div className="min-h-[4.5rem] flex items-center justify-center">
                  <KhmerColoredText
                    text={khmerText}
                    fontUrl={DEFAULT_KHMER_FONT_URL}
                    fontSize={72}
                    className="text-4xl font-black leading-[1.2]"
                  />
                </div>
                <p className="text-base text-cyan-100 font-semibold tracking-wide">
                  <span className="text-[11px] text-cyan-400 font-black uppercase tracking-widest mr-2">{t('lesson.pronunciationLabel')}:</span>
                  {current.pronunciation || '—'}
                </p>
              </div>
              {current.audio ? (
                <div onClick={(e) => { e.stopPropagation(); playLocalAudio(current.audio); }} className="p-5 bg-cyan-500 rounded-full text-black hover:bg-cyan-400 active:scale-90 transition-all shadow-lg">
                  <Volume2 size={28} />
                </div>
              ) : <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('lesson.audioUnavailable')}</p>}
            </div>
          </div>
        </div>
      )}

      {type === 'quiz' && (
        <div className="w-full space-y-3">
          <h2 className="text-xl font-black mb-8 italic uppercase text-center text-white">{current?.question ?? ''}</h2>
          {quizOptions.map((opt, i) => {
            const { value, text, pronunciation, audio: optionAudio } = getQuizOption(opt);
            const rawValue = value;

            let buttonClass = 'bg-gray-900 border-white/5 text-white';
            if (selectedOption === rawValue) {
              const isCorrect = String(rawValue).trim() === String(current.correct_answer).trim();
              buttonClass = isCorrect
                ? 'bg-emerald-600 border-emerald-400 text-white'
                : 'bg-red-600 border-red-400 text-white';
            }

            return (
              <button
                key={i}
                disabled={!!selectedOption}
                onClick={() => handleQuizAnswer(rawValue, current.correct_answer, optionAudio || current.audio)}
                className={`w-full p-5 border rounded-2xl text-left font-bold transition-all ${buttonClass}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-2xl font-black">{text}</span>
                  {pronunciation && <span className="text-xl font-semibold text-cyan-100 tracking-wide">{pronunciation}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* УНИВЕРСАЛЬНАЯ ТЕОРИЯ */}
      {(type === 'theory' || type === 'title' || type === 'meet-teams' || type === 'rule' || type === 'reading-algorithm' || type === 'ready' || type === 'intro') && (
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


      {type === 'no-spaces' && (
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
