import React from 'react';
import { Volume2, ArrowRight, X, CheckCircle2, Trophy, BookOpen, ChevronLeft, Frown } from 'lucide-react';
import VisualDecoder from '../components/VisualDecoder';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import useLessonPlayer from '../hooks/useLessonPlayer';
import { t } from '../i18n';

export default function LessonPlayer() {
  const {
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

  if (loading) return <LoadingState label={t('loading.lesson')} />;

  if (error) {
    return (
      <ErrorState
        title={t('errors.lesson')}
        message={error}
        onRetry={refresh}
        secondaryAction={(
          <Button variant="outline" onClick={() => navigate('/map')}>
            {t('actions.backToMap')}
          </Button>
        )}
      />
    );
  }

  if (!items.length) {
    return (
      <ErrorState
        title={t('errors.lessonEmpty')}
        message={t('empty.lessonContent')}
        secondaryAction={(
          <Button variant="outline" onClick={() => navigate('/map')}>
            {t('actions.backToMap')}
          </Button>
        )}
      />
    );
  }

  if (isFinished) {
    return (
      <MobileLayout withNav={true}>
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          {lessonPassed ? (
            <>
              <Trophy size={80} className="text-emerald-400 mb-8 animate-bounce" />
              <h1 className="text-4xl font-black italic uppercase mb-2 text-white">{t('lesson.complete')}</h1>
              <p className="text-gray-400 mb-8 text-xl font-bold">{t('lesson.score', { score, total: quizCount })}</p>
              <Button onClick={() => navigate('/map')}>{t('actions.backToMap')}</Button>
            </>
          ) : (
            <>
              <Frown size={80} className="text-red-500 mb-8" />
              <h1 className="text-3xl font-black italic uppercase mb-2 text-white">{t('lesson.reviewNeeded')}</h1>
              <Button variant="danger" onClick={refresh}>{t('actions.retry')}</Button>
            </>
          )}
        </div>
      </MobileLayout>
    );
  }

  const current = items[step]?.data;
  const type = items[step]?.type;

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
        </footer>
      )}
    >
      <header className="p-4 border-b border-white/5 bg-gray-900/20">
        <div className="flex justify-between items-center">
          <button onClick={() => navigate('/map')} className="p-2 text-gray-500"><X size={24} /></button>
          <div className="text-center flex-1 px-4">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-cyan-500 mb-1 truncate">{lessonInfo?.title}</h2>
            <div className="w-24 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all" style={{ width: `${items.length ? ((step + 1) / items.length) * 100 : 0}%` }} />
            </div>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-2">
              {t('lesson.progress', { current: step + 1, total: items.length })}
            </p>
          </div>
          <div className="flex items-center gap-1 text-emerald-500 font-bold text-xs w-10"><CheckCircle2 size={16}/> {score}</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        {type === 'visual_decoder' && <VisualDecoder data={current} onComplete={() => setCanAdvance(true)} hideDefaultButton={true} />}

        {type === 'vocab_card' && (
          <div className="w-full cursor-pointer" onClick={() => handleVocabCardFlip(current.audio)}>
            <div className={`relative h-[22rem] transition-all duration-500 preserve-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
              {/* Front side */}
              <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-8 text-center">
                <h2 className="text-3xl font-black italic text-white">{current.front}</h2>
              </div>

              {/* Back side */}
              <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-8 text-center text-white">
                <h2 className="text-4xl font-black mb-3">{current.back}</h2>

                {/* Replay audio button */}
                <div
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent flip on audio replay
                    playLocalAudio(current.audio);
                  }}
                  className="p-5 bg-cyan-500 rounded-full text-black hover:bg-cyan-400 active:scale-90 transition-all shadow-lg"
                >
                  <Volume2 size={28} />
                </div>
              </div>
            </div>
          </div>
        )}

        {type === 'quiz' && (
          <div className="w-full space-y-3">
             <h2 className="text-xl font-black mb-8 italic uppercase text-center text-white">{current.question}</h2>
             {current.options.map((opt, i) => (
               <button key={i} disabled={!!selectedOption} onClick={() => handleQuizAnswer(opt, current.correct_answer)}
                 className={`w-full p-5 border rounded-2xl text-left font-bold transition-all ${selectedOption === opt ? (opt === current.correct_answer ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white') : 'bg-gray-900 border-white/5 text-white'}`}
               >
                 {opt}
               </button>
             ))}
          </div>
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
