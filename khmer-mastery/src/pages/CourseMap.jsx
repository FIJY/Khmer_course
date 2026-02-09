import React, { useEffect, useState, useRef } from 'react';
import {
  Check, Gem, Layers, BookOpen, RefreshCw, Play
} from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import EmptyState from '../components/UI/EmptyState';
import useCourseMap from '../hooks/useCourseMap';
import { t } from '../i18n';
import { updateLastOpenedProgress } from '../data/progress';

// Диапазоны включают как ID глав, так и ID подуроков
const COURSE_LEVELS = [
  {
    title: "CONTACT & REACTIONS",
    description: "I don't get lost, I'm polite, and I am understood.",
    range: [1, 599],
    color: "text-cyan-400",
    bg: "from-cyan-500/10 to-transparent",
    border: "border-cyan-500/20"
  },
  {
    title: "DAILY LIFE",
    description: "I live, buy, get medical help, and move around.",
    range: [6, 1099],
    color: "text-teal-400",
    bg: "from-teal-500/10 to-transparent",
    border: "border-teal-500/20"
  },
  {
    title: "VISUAL DECODER: READING & WRITING",
    description: "Crack the code. Learn the Khmer script from scratch.",
    range: [10000, 10699],
    color: "text-amber-400",
    bg: "from-amber-500/10 to-transparent",
    border: "border-amber-500/20"
  },
  {
    title: "THINKING IN KHMER",
    description: "I start understanding the meaning, not just the phrases.",
    range: [11, 1899],
    color: "text-sky-400",
    bg: "from-sky-500/10 to-transparent",
    border: "border-sky-500/20"
  },
  {
    title: "GRAMMAR AS A TOOL",
    description: "Understanding structure: Causes, conditions, and frequency.",
    range: [19, 2399],
    color: "text-indigo-400",
    bg: "from-indigo-500/10 to-transparent",
    border: "border-indigo-500/20"
  },
  {
    title: "EXPANDING THE WORLD",
    description: "Work, education, technology, and travel.",
    range: [24, 2899],
    color: "text-violet-400",
    bg: "from-violet-500/10 to-transparent",
    border: "border-violet-500/20"
  },
  {
    title: "CONNECTED SPEECH",
    description: "Logic, opinions, conflicts, and storytelling.",
    range: [29, 3899],
    color: "text-purple-400",
    bg: "from-purple-500/10 to-transparent",
    border: "border-purple-500/20"
  },
  {
    title: "LANGUAGE AS THOUGHT",
    description: "Abstract concepts, idioms, and native speed.",
    range: [39, 4699],
    color: "text-fuchsia-400",
    bg: "from-fuchsia-500/10 to-transparent",
    border: "border-fuchsia-500/20"
  },
  {
    title: "NO TRANSLATION NEEDED",
    description: "Cultural subtext, humor, irony, and fluency.",
    range: [47, 6099],
    color: "text-rose-400",
    bg: "from-rose-500/10 to-transparent",
    border: "border-rose-500/20"
  },
  {
    title: "SPECIAL & BONUS CONTENT",
    description: "Additional materials and special lessons.",
    range: [99900, 99999],
    color: "text-yellow-400",
    bg: "from-yellow-500/10 to-transparent",
    border: "border-yellow-500/20"
  }
];

export default function CourseMap() {
  const {
    userId,
    loading,
    completedLessons,
    lastOpenedBlockId,
    lastOpenedLessonId,
    chapters,
    error,
    navigate,
    refresh
  } = useCourseMap();

  // Инициализируем: открыт только первый уровень по умолчанию (пока не загрузился прогресс)
  const [openLevels, setOpenLevels] = useState(() => COURSE_LEVELS.map((_, i) => i === 0));
  const [hasScrolled, setHasScrolled] = useState(false);

  // --- ЛОГИКА АККОРДЕОНА ---
  // При клике открываем выбранный уровень и закрываем все остальные
  const handleLevelToggle = (levelIndex) => {
    setOpenLevels((prev) => prev.map((isOpen, idx) => {
      if (idx === levelIndex) return !isOpen; // Переключаем текущий
      return false; // Все остальные закрываем
    }));
  };

  const handleNavigate = async (blockId, lessonId, target) => {
    if (userId) {
      updateLastOpenedProgress(userId, blockId, lessonId).catch(console.error);
    }
    navigate(target);
  };

  // --- АВТО-ОТКРЫТИЕ ПО ПРОГРЕССУ ---
  // Когда данные загрузились, находим активный уровень и открываем ТОЛЬКО его
  useEffect(() => {
    if (!lastOpenedBlockId) return;
    const numericId = Number(lastOpenedBlockId);
    const levelIndex = COURSE_LEVELS.findIndex(
      (level) => numericId >= level.range[0] && numericId <= level.range[1]
    );

    if (levelIndex >= 0) {
      setOpenLevels(COURSE_LEVELS.map((_, idx) => idx === levelIndex));
    }
  }, [lastOpenedBlockId]);


  // --- ЛОГИКА АВТО-СКРОЛЛА ---
  useEffect(() => {
    if (loading || hasScrolled || Object.keys(chapters).length === 0) return;

    const targetId = lastOpenedLessonId || lastOpenedBlockId;

    if (targetId) {
      setTimeout(() => {
        const element = document.getElementById(`lesson-${targetId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHasScrolled(true);
        }
      }, 500); // Чуть увеличил задержку для надежности после рендера аккордеона
    }
  }, [loading, hasScrolled, lastOpenedLessonId, lastOpenedBlockId, chapters]);


  if (loading) return <LoadingState label={t('loading.worldMap')} className="gap-4" />;

  if (error) {
    return (
      <ErrorState
        title={t('errors.map')}
        message={error}
        onRetry={refresh}
      />
    );
  }

  return (
    <MobileLayout withNav={true}>
      <div className="p-4 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-40 h-16">
        <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">
          Khmer <span className="text-amber-400">Mastery</span>
        </h1>
        <div className="bg-gray-900 px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
          <Gem size={14} className="text-emerald-500 fill-emerald-500/20" />
          <span className="font-black text-xs text-gray-200">{completedLessons.length * 50}</span>
        </div>
      </div>

      <div className="space-y-4 mt-4 pb-24">
        {Object.keys(chapters).length === 0 ? (
          <EmptyState
            title={t('empty.lessons')}
            description={t('empty.lessonsSubtext')}
            icon={<RefreshCw size={36} />}
          />
        ) : COURSE_LEVELS.map((level, levelIndex) => {
          // Фильтрация глав для текущего уровня
          const levelChapters = Object.values(chapters).filter(ch => {
            const id = Number(ch.id);
            return id >= level.range[0] && id <= level.range[1];
          }).sort((a, b) => {
             if (a.order_index !== b.order_index) return a.order_index - b.order_index;
             return a.id - b.id;
          });

          const isLevelOpen = openLevels[levelIndex];

          // Не показываем пустые уровни
          if (levelChapters.length === 0) return null;

          return (
            <div key={levelIndex} className="relative">
              {/* Заголовок уровня (Липкий) */}
              <div
                className={`sticky top-16 z-30 py-3 px-4 backdrop-blur-xl border-b border-t ${level.border} bg-gradient-to-r ${level.bg} bg-black/80 cursor-pointer transition-colors hover:bg-white/5`}
                onClick={() => handleLevelToggle(levelIndex)} // Клик по всей полоске работает как переключатель
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Layers size={18} className={level.color} />
                    <div>
                      <h2 className={`text-xs font-black uppercase tracking-[0.2em] ${level.color}`}>
                        {level.title}
                      </h2>
                      <p className="text-[9px] text-gray-400 font-bold uppercase opacity-70 leading-none mt-0.5">
                        {level.description}
                      </p>
                    </div>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-black/40 border border-white/10 text-gray-400">
                    <div className={`transform transition-transform duration-300 ${isLevelOpen ? 'rotate-180' : ''} text-[10px]`}>
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              {/* Список глав */}
              {isLevelOpen && (
                <div className="px-4 py-4 space-y-4 animate-in slide-in-from-top-2 duration-300">
                  {levelChapters.map((chapter) => {
                    const subLessonIds = chapter.subLessons.map(sub => Number(sub.id));
                    const isChapterFullDone = subLessonIds.length > 0 && subLessonIds.every(id => completedLessons.includes(id));
                    const lessonCount = chapter.subLessons.length;

                    return (
                      <div key={chapter.id} id={`lesson-${chapter.id}`} className="relative pl-3 border-l border-white/5">
                        {/* Индикатор статуса главы */}
                        <div className={`absolute -left-[6.5px] top-6 w-3 h-3 rounded-full border-[2px] bg-black transition-colors ${isChapterFullDone ? 'border-emerald-500' : 'border-gray-800'}`} />

                        {/* Карточка главы */}
                        <div className={`bg-gray-900/40 border rounded-2xl p-4 transition-all duration-300 ${isChapterFullDone ? 'border-emerald-500/30' : 'border-white/5'}`}>

                          {/* Заголовок Главы + Кнопка старта */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="pr-4">
                              <h3 className={`text-base font-black uppercase tracking-tight leading-tight mb-1 ${isChapterFullDone ? 'text-emerald-400' : 'text-white'}`}>
                                {chapter.title}
                              </h3>
                              <p className="text-gray-500 text-[11px] leading-tight">{chapter.description}</p>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNavigate(chapter.id, chapter.id, `/lesson/${chapter.id}/preview`);
                              }}
                              className={`shrink-0 p-2.5 rounded-xl border transition-all active:scale-95 ${isChapterFullDone ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-black border-white/10 text-gray-500 hover:text-cyan-400 hover:border-cyan-500/30'}`}
                            >
                              {isChapterFullDone ? <Check size={18} strokeWidth={3} /> : <BookOpen size={18} />}
                            </button>
                          </div>

                          {/* Список подуроков (Всегда виден внутри открытого уровня) */}
                          <div className="space-y-1">
                            {lessonCount > 0 ? (
                              chapter.subLessons.map((sub) => {
                                const isDone = completedLessons.includes(Number(sub.id));
                                const isCurrent = Number(lastOpenedLessonId) === Number(sub.id);

                                return (
                                  <button
                                    key={sub.id}
                                    id={`lesson-${sub.id}`}
                                    onClick={() => handleNavigate(chapter.id, Number(sub.id), `/lesson/${sub.id}`)}
                                    className={`w-full flex items-center justify-between py-2 px-3 rounded-lg transition-all border text-left group
                                      ${isDone
                                        ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-500/80'
                                        : (isCurrent ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-100' : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200')
                                      }`}
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      {/* Иконка статуса урока */}
                                      {isDone ? (
                                        <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />
                                      ) : (
                                        <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${isCurrent ? 'border-cyan-400' : 'border-gray-700'}`} />
                                      )}

                                      <span className="text-[11px] font-bold uppercase tracking-wider truncate">
                                        {sub.title}
                                      </span>
                                    </div>

                                    <Play size={10} className={`opacity-0 group-hover:opacity-100 transition-opacity ${isCurrent ? 'opacity-100 fill-cyan-400 text-cyan-400' : 'text-gray-500'}`} />
                                  </button>
                                );
                              })
                            ) : (
                              <div className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold pl-1">
                                No lessons yet
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </MobileLayout>
  );
}