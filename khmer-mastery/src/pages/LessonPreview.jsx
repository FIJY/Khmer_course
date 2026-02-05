import React from 'react';
import { ArrowRight, X, CheckCircle2, BookOpen, ChevronLeft } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import useLessonPlayer from '../hooks/useLessonPlayer';
import { t } from '../i18n';
import QuizSlide from '../components/LessonSlides/QuizSlide';
import VisualDecoderSlide from '../components/LessonSlides/VisualDecoderSlide';
import VocabCardSlide from '../components/LessonSlides/VocabCardSlide';
import SameDifferentSlide from '../components/LessonSlides/SameDifferentSlide';
// --- ИМПОРТИРУЕМ НОВЫЕ СЛАЙДЫ ---
import HeroSlide from '../components/LessonSlides/HeroSlide';
import InventorySlide from '../components/LessonSlides/InventorySlide';

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
    refresh
  } = useLessonPlayer();

  const safeItems = Array.isArray(items) ? items : [];

  // ... (Оставляем логику lessonPronunciations без изменений) ...
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

  // ... (Оставляем проверки loading, error, isFinished без изменений) ...
  if (loading) return <LoadingState label={t('loading.lesson')} />;
  if (error) return <ErrorState title={t('errors.lesson')} message={error} onRetry={refresh} secondaryAction={<Button variant="outline" onClick={() => navigate('/map')}>{t('actions.backToMap')}</Button>} />;
  if (isFinished) { /* ... код финиша ... */ return (/* ... */ <MobileLayout withNav={true}> ... </MobileLayout>); }
  if (!safeItems.length || !safeItems[step]) return <ErrorState title={t('errors.lessonEmpty')} message={t('empty.lessonContent')} onRetry={refresh} secondaryAction={<Button variant="outline" onClick={() => navigate('/map')}>{t('actions.backToMap')}</Button>} />;


  const current = safeItems[step]?.data;
  const type = safeItems[step]?.type;

  // ... (Логика vocab_card текста) ...
  const frontText = current?.front ?? '';
  const backText = current?.back ?? '';
  const frontHasKhmer = KHMER_PATTERN.test(frontText);
  const backHasKhmer = KHMER_PATTERN.test(backText);
  const englishText = frontHasKhmer && !backHasKhmer ? backText : frontText;
  const khmerText = frontHasKhmer && !backHasKhmer ? frontText : backText;
  const quizOptions = Array.isArray(current?.options) ? current.options : [];

  // ... (Логика getQuizOption) ...
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

  return (
    <MobileLayout
      withNav={true}
      footer={(
        <footer className="p-6 border-t border-white/5 bg-black/80">
          <div className="flex gap-3">
            <button onClick={goBack} disabled={step === 0} className={`p-5 rounded-2xl border transition-all ${step === 0 ? 'opacity-0' : 'bg-gray-900 border-white/10 text-white'}`}>
              <ChevronLeft size={24} />
            </button>
            <Button onClick={handleNext} disabled={!canAdvance} className="flex-1">
              {t('actions.continue')} <ArrowRight size={20} />
            </Button>
          </div>
          {!canAdvance && <p className="mt-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">{t('lesson.hintContinue')}</p>}
        </footer>
      )}
    >
      <header className="p-4 border-b border-white/5 bg-gray-900/20">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/map')} className="p-2 text-gray-500"><X size={24} /></button>
          <div className="text-center flex-1 px-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-1 truncate">{lessonInfo?.title}</h2>
            <div className="w-24 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all" style={{ width: `${safeItems.length ? ((step + 1) / safeItems.length) * 100 : 0}%` }} />
            </div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-2">{t('lesson.progress', { current: step + 1, total: safeItems.length })}</p>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs w-10"><CheckCircle2 size={16}/> {score}</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">

        {/* --- НОВЫЕ СЛАЙДЫ --- */}
        {type === 'learn_char' && (
          <HeroSlide data={current} onPlayAudio={playLocalAudio} />
        )}

        {type === 'word_breakdown' && (
          <InventorySlide data={current} onPlayAudio={playLocalAudio} />
        )}

        {type === 'same_different' && (
                <SameDifferentSlide
                  data={current}
                  onPlayAudio={playLocalAudio}
                  onComplete={() => setCanAdvance(true)}
                />
              )}
          
        {/* --- СТАРЫЕ СЛАЙДЫ --- */}
        {type === 'visual_decoder' && (
          <VisualDecoderSlide
            variant="preview"
            current={current}
            onComplete={() => setCanAdvance(true)}
            hideDefaultButton={true}
          />
        )}

        {type === 'vocab_card' && (
          <VocabCardSlide
            variant="preview"
            isFlipped={isFlipped}
            englishText={englishText}
            khmerText={khmerText}
            pronunciation={current.pronunciation}
            audio={current.audio}
            onFlip={() => handleVocabCardFlip(current.audio)}
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
            showPronunciationPlaceholder={true}
          />
        )}

        {type === 'theory' && (
          <div className="w-full bg-gray-900 border border-white/10 p-8 rounded-[3.5rem] text-center">
            <BookOpen className="text-cyan-500/20 mx-auto mb-4" size={32} />
            <h2 className="text-xl font-black italic uppercase text-cyan-400 mb-4">{current.title}</h2>
            <p className="text-base text-gray-300 italic">{current.text}</p>
          </div>
        )}
      </main>
    </MobileLayout>
  );
}
