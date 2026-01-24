import React, { useMemo, useState } from 'react';
import {
  Check, Gem, Layers, BookOpen, RefreshCw, ChevronRight, ChevronDown, ChevronUp
} from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import EmptyState from '../components/UI/EmptyState';
import useCourseMap from '../hooks/useCourseMap';
import { t } from '../i18n';
import { updateLastOpenedProgress } from '../data/progress';

// МЫ ОСТАВИЛИ ТОЛЬКО ОДИН БЛОК, ЧТОБЫ БЫЛО КРАСИВО И НЕ ПУСТО
const COURSE_LEVELS = [
  {
    title: "CONTACT & REACTIONS",
    description: "I don't get lost, I'm polite, and I am understood.",
    range: [1, 5],
    color: "text-cyan-400",
    bg: "from-cyan-500/10 to-transparent",
    border: "border-cyan-500/20"
  },

  // --- 🔥 ТВОЙ ГЛАВНЫЙ БЛОК (R1 и далее) ---
  {
    title: "VISUAL DECODER: READING & WRITING",
    description: "Crack the code. Learn the Khmer script from scratch.",
    range: [10000, 10699],
    color: "text-amber-400",
    bg: "from-amber-500/10 to-transparent",
    border: "border-amber-500/20",
    isBootcamp: true
  },

  {
    title: "DAILY LIFE",
    description: "I live, buy, get medical help, and move around.",
    range: [6, 10],
    color: "text-teal-400",
    bg: "from-teal-500/10 to-transparent",
    border: "border-teal-500/20"
  },
  {
    title: "THINKING IN KHMER",
    description: "I start understanding the meaning, not just the phrases.",
    range: [11, 18],
    color: "text-sky-400",
    bg: "from-sky-500/10 to-transparent",
    border: "border-sky-500/20"
  },
  {
    title: "GRAMMAR AS A TOOL",
    description: "Understanding structure: Causes, conditions, and frequency.",
    range: [19, 23],
    color: "text-indigo-400",
    bg: "from-indigo-500/10 to-transparent",
    border: "border-indigo-500/20"
  },
  {
    title: "EXPANDING THE WORLD",
    description: "Work, education, technology, and travel.",
    range: [24, 28],
    color: "text-violet-400",
    bg: "from-violet-500/10 to-transparent",
    border: "border-violet-500/20"
  },
  {
    title: "CONNECTED SPEECH",
    description: "Logic, opinions, conflicts, and storytelling.",
    range: [29, 38],
    color: "text-purple-400",
    bg: "from-purple-500/10 to-transparent",
    border: "border-purple-500/20"
  },
  {
    title: "LANGUAGE AS THOUGHT",
    description: "Abstract concepts, idioms, and native speed.",
    range: [39, 46],
    color: "text-fuchsia-400",
    bg: "from-fuchsia-500/10 to-transparent",
    border: "border-fuchsia-500/20"
  },
  {
    title: "NO TRANSLATION NEEDED",
    description: "Cultural subtext, humor, irony, and fluency.",
    range: [47, 60],
    color: "text-rose-400",
    bg: "from-rose-500/10 to-transparent",
    border: "border-rose-500/20"
  }
];

export default function CourseMap() {
  const {
    userId,
    loading,
    completedLessons,
    lastOpenedLessonId,
    chapters,
    error,
    navigate,
    refresh
  } = useCourseMap();
  const [openBootcampBlockId, setOpenBootcampBlockId] = useState(null);
  const bootcampChapters = useMemo(
    () => Object.values(chapters).filter((ch) => ch.id >= 10000),
    [chapters]
  );
  const sortedBootcampChapters = useMemo(
    () => [...bootcampChapters].sort((a, b) => a.id - b.id),
    [bootcampChapters]
  );

  const handleBootcampToggle = async (blockId) => {
    setOpenBootcampBlockId((prev) => (prev === blockId ? null : blockId));
    if (!userId) return;
    try {
      await updateLastOpenedProgress(userId, blockId, blockId);
    } catch (err) {
      console.error('Failed to update last opened bootcamp block', err);
    }
  };

  const handleBootcampNavigate = async (blockId, lessonId, target) => {
    if (userId) {
      try {
        await updateLastOpenedProgress(userId, blockId, lessonId);
      } catch (err) {
        console.error('Failed to update last opened bootcamp lesson', err);
      }
    }
    navigate(target);
  };

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
      
      {/* Sticky header */}
      <div className="p-6 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">
          Khmer <span className="text-amber-400">Mastery</span>
        </h1>
        <div className="bg-gray-900 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
          <Gem size={16} className="text-emerald-500 fill-emerald-500/20" />
          <span className="font-black text-xs text-gray-200">{completedLessons.length * 50}</span>
        </div>
      </div>

      <div className="space-y-12 mt-6 pb-24"> {/* Увеличил паддинг снизу, чтобы кнопка не перекрывала контент */}
        {Object.keys(chapters).length === 0 ? (
          <EmptyState
            title={t('empty.lessons')}
            description={t('empty.lessonsSubtext')}
            icon={<RefreshCw size={36} />}
          />
        ) : COURSE_LEVELS.map((level, levelIndex) => {
          const levelChapters = Object.values(chapters).filter(ch =>
            ch.id >= level.range[0] && ch.id <= level.range[1]
          );

          if (!level.isBootcamp && levelChapters.length === 0) return null;

          return (
            <div key={levelIndex} className="relative">
              <div className={`sticky top-[73px] z-30 py-4 px-6 backdrop-blur-xl border-b border-t ${level.border} bg-gradient-to-r ${level.bg} bg-black/60`}>
                <div className="flex items-center gap-3">
                  <Layers size={20} className={level.color} />
                  <div>
                    <h2 className={`text-sm font-black uppercase tracking-[0.2em] ${level.color}`}>
                      {level.title}
                    </h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase opacity-70">
                      {level.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {level.isBootcamp ? sortedBootcampChapters.map((chapter) => {
                  const isOpen = openBootcampBlockId === chapter.id;
                  const subLessonIds = chapter.subLessons.map(sub => Number(sub.id));
                  const isChapterFullDone = subLessonIds.length > 0
                    && subLessonIds.every(id => completedLessons.includes(id));
                  const lessonCount = chapter.subLessons.length;

                  return (
                    <div key={chapter.id} className="relative pl-4 border-l-2 border-white/5">
                      <div className={`absolute -left-[9px] top-10 w-4 h-4 rounded-full border-4 bg-black transition-colors ${isChapterFullDone ? 'border-emerald-500' : 'border-gray-800'}`} />

                      <div className={`bg-gray-900/40 border rounded-[2.5rem] p-6 transition-all duration-500
                        ${isChapterFullDone ? 'border-emerald-500/30' : 'border-white/5'}`}>

                        <div className="flex justify-between items-start mb-6">
                          <div className="max-w-[70%] text-white">
                            <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1 block">
                              Unit {chapter.displayId}
                            </span>
                            <h3 className={`text-xl font-black uppercase tracking-tight leading-none mb-2 ${isChapterFullDone ? 'text-emerald-400' : 'text-white'}`}>
                              {chapter.title}
                            </h3>
                            <p className="text-gray-500 text-xs italic leading-tight">{chapter.description}</p>
                            {lessonCount > 0 && (
                              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-2">
                                {lessonCount} lessons
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleBootcampNavigate(chapter.id, chapter.id, `/lesson/${chapter.id}/preview`)}
                              className={`p-3 rounded-2xl border transition-all active:scale-90
                                ${isChapterFullDone ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-black border-white/10 text-gray-600 hover:text-cyan-400 hover:border-cyan-500/30'}`}
                              type="button"
                            >
                              <BookOpen size={20} />
                            </button>

                            <button
                              onClick={() => handleBootcampToggle(chapter.id)}
                              className="p-3 rounded-2xl border bg-black border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                              type="button"
                            >
                              {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          chapter.subLessons.length > 0 ? (
                            <div className="space-y-2">
                              {chapter.subLessons.map((sub) => {
                                const isDone = completedLessons.includes(Number(sub.id));
                                const isLastOpened = lastOpenedLessonId === Number(sub.id);
                                return (
                                  <button
                                    key={sub.id}
                                    onClick={() => handleBootcampNavigate(chapter.id, Number(sub.id), `/lesson/${sub.id}`)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border text-left group
                                      ${isDone
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                        : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
                                    type="button"
                                  >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border
                                        ${isDone ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-white/10 bg-black text-transparent'}`}>
                                        <Check size={10} strokeWidth={4} />
                                      </div>
                                      <span className={`text-xs font-bold uppercase tracking-wider truncate transition-colors ${isLastOpened ? 'text-amber-300' : 'group-hover:text-white'}`}>
                                        {sub.title}
                                      </span>
                                    </div>
                                    <ChevronRight size={14} className={isDone ? 'text-emerald-500' : 'text-gray-700'} />
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                              Lessons coming soon
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                }) : levelChapters.map((chapter) => {
                  const subLessonIds = chapter.subLessons.map(sub => Number(sub.id));
                  const isChapterFullDone = subLessonIds.length > 0
                    && subLessonIds.every(id => completedLessons.includes(id));

                  return (
                    <div key={chapter.id} className="relative pl-4 border-l-2 border-white/5">
                      <div className={`absolute -left-[9px] top-10 w-4 h-4 rounded-full border-4 bg-black transition-colors ${isChapterFullDone ? 'border-emerald-500' : 'border-gray-800'}`} />

                      <div className={`bg-gray-900/40 border rounded-[2.5rem] p-6 transition-all duration-500
                        ${isChapterFullDone ? 'border-emerald-500/30' : 'border-white/5'}`}>

                        <div className="flex justify-between items-start mb-6">
                          <div className="max-w-[70%] text-white">
                            <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest mb-1 block">
                              Unit {chapter.displayId ?? chapter.id}
                            </span>
                            <h3 className={`text-xl font-black uppercase tracking-tight leading-none mb-2 ${isChapterFullDone ? 'text-emerald-400' : 'text-white'}`}>
                              {chapter.title}
                            </h3>
                            <p className="text-gray-500 text-xs italic leading-tight">{chapter.description}</p>
                          </div>

                          <button
                            onClick={() => navigate(`/lesson/${chapter.id}/preview`)}
                            className={`p-3 rounded-2xl border transition-all active:scale-90
                              ${isChapterFullDone ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-black border-white/10 text-gray-600 hover:text-cyan-400 hover:border-cyan-500/30'}`}
                          >
                            <BookOpen size={20} />
                          </button>
                        </div>

                        {chapter.subLessons.length > 0 && (
                          <div className="space-y-2">
                            {chapter.subLessons.map((sub) => {
                              const isDone = completedLessons.includes(Number(sub.id));
                              return (
                                <button
                                  key={sub.id}
                                  onClick={() => navigate(`/lesson/${sub.id}`)}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border text-left group
                                    ${isDone
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
                                >
                                  <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center border
                                      ${isDone ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-white/10 bg-black text-transparent'}`}>
                                      <Check size={10} strokeWidth={4} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider truncate group-hover:text-white transition-colors">
                                      {sub.title}
                                    </span>
                                  </div>
                                  <ChevronRight size={14} className={isDone ? 'text-emerald-500' : 'text-gray-700'} />
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </MobileLayout>
  );
}
