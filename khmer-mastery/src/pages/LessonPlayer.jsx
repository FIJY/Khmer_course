import React from 'react';
import { Volume2, ArrowRight, BookOpen, ChevronLeft } from 'lucide-react';
import VisualDecoder from '../components/VisualDecoder';
import KhmerColoredText from '../components/KhmerColoredText';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import useLessonPlayer from '../hooks/useLessonPlayer';
import BootcampSession from '../components/Bootcamp/BootcampSession';
import { t } from '../i18n';
import SessionCompletion from '../components/Session/SessionCompletion';
import SessionFrame from '../components/Session/SessionFrame';

// --- ИМПОРТИРУЕМ НОВЫЕ СЛАЙДЫ ---
import HeroSlide from '../components/LessonSlides/HeroSlide';
import InventorySlide from '../components/LessonSlides/InventorySlide';

const KHMER_PATTERN = /[\u1780-\u17FF]/;
const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

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
  const bootcampLessonIds = React.useMemo(() => new Set([10000, 10100, 10101]), []);
  const bootcampLessonId = Number(lessonInfo?.lesson_id ?? lessonInfo?.id ?? id);
  const bootcampTitle = lessonInfo?.title?.toLowerCase() ?? '';
  const isBootcampLesson = bootcampLessonIds.has(bootcampLessonId)
    || bootcampTitle.includes('bootcamp')
    || bootcampTitle.includes('unit r1')
    || bootcampTitle.includes('the foundation');

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

  if (isBootcampLesson) return <BootcampSession onClose={() => navigate('/map')} practiceItems={safeItems} title={lessonInfo?.title} />;
  if (!safeItems.length || !safeItems[step]) return <ErrorState title={t('errors.lessonEmpty')} message={t('empty.lessonContent')} onRetry={refresh} secondaryAction={<Button variant="outline" onClick={() => navigate('/map')}>{t('actions.backToMap')}</Button>} />;

  const current = safeItems[step]?.data;
  const type = safeItems[step]?.type;

  const frontText = current?.front ?? '';
  const backText = current?.back ?? '';
  const frontHasKhmer = KHMER_PATTERN.test(frontText);
  const backHasKhmer = KHMER_PATTERN.test(backText);
  const englishText = frontHasKhmer && !backHasKhmer ? backText : frontText;
  const khmerText = frontHasKhmer && !backHasKhmer ? frontText : backText;
  const quizOptions = Array.isArray(current?.options) ? current.options : [];

  const getQuizOption = (opt) => {
    if (opt && typeof opt === 'object') {
      return { text: opt.text ?? opt.value ?? opt.label ?? opt.answer ?? '', pronunciation: opt.pronunciation ?? '', audio: opt.audio ?? null };
    }
    const metadata = current?.options_metadata?.[opt];
    if (metadata) {
      return { text: opt, pronunciation: metadata.pronunciation, audio: metadata.audio };
    }
    const pronunciationMap = current?.option_pronunciations || current?.pronunciations || {};
    return { text: opt, pronunciation: pronunciationMap?.[opt] ?? lessonPronunciations?.[opt] ?? '', audio: null };
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
              {t('actions.continue')} <ArrowRight size={20} />
            </Button>
          </div>
          {!canAdvance && <p className="mt-3 text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center">{t('lesson.hintContinue')}</p>}
        </footer>
      )}
    >

        {type === 'learn_char' && (
          <HeroSlide data={current} onPlayAudio={playLocalAudio} />
        )}

        {type === 'word_breakdown' && (
          <InventorySlide data={current} onPlayAudio={playLocalAudio} />
        )}

        {type === 'visual_decoder' && <VisualDecoder key={step} data={current} onComplete={() => setCanAdvance(true)} hideDefaultButton={true} />}

        {type === 'vocab_card' && (
          <div className="w-full cursor-pointer" onClick={() => handleVocabCardFlip(current.audio)}>
            <div className={`relative h-[22rem] transition-all duration-500 preserve-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">{t('lesson.cardEnglish')}</p>
                <h2 className="text-3xl font-black italic text-white">{englishText}</h2>
              </div>
              <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-8 text-center text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">{t('lesson.cardKhmer')}</p>
                <KhmerColoredText text={khmerText} fontUrl={DEFAULT_KHMER_FONT_URL} fontSize={72} className="text-4xl font-black mb-2" />
                <p className="text-base text-cyan-100 font-semibold tracking-wide mb-4">
                  <span className="text-[11px] text-cyan-400 font-black uppercase tracking-widest mr-2">{t('lesson.pronunciationLabel')}:</span>
                  {current.pronunciation || '—'}
                </p>
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
               const { text, pronunciation, audio: optionAudio } = getQuizOption(opt);

               // Получаем "сырое" значение для сравнения (учитываем, что это может быть объект)
               const rawValue = (typeof opt === 'object' && opt !== null) ? (opt.value || opt.text || opt.answer) : opt;

               // Логика цвета кнопки
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

        {type === 'theory' && (
          <div className="w-full bg-gray-900 border border-white/10 p-8 rounded-[3.5rem] text-center">
            <BookOpen className="text-cyan-500/20 mx-auto mb-4" size={32} />
            <h2 className="text-xl font-black italic uppercase text-cyan-400 mb-4">{current.title}</h2>
            <p className="text-base text-gray-300 italic">{current.text}</p>
          </div>
        )}
    </SessionFrame>
  );
}
