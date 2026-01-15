import React from 'react';
import {
  Check, Gem, Layers, BookOpen, RefreshCw, ChevronRight
} from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import useCourseMap from '../hooks/useCourseMap';

const COURSE_LEVELS = [
  {
    title: "LEVEL 1: SURVIVAL MODE",
    description: "The absolute basics to survive in Cambodia.",
    range: [1, 4],
    color: "text-cyan-400",
    bg: "from-cyan-500/10 to-transparent",
    border: "border-cyan-500/20"
  },
  {
    title: "LEVEL 2: DAILY LIFE",
    description: "Handle real-world situations like a local.",
    range: [5, 9],
    color: "text-emerald-400",
    bg: "from-emerald-500/10 to-transparent",
    border: "border-emerald-500/20"
  },
  {
    title: "LEVEL 3: GRAMMAR ENGINE",
    description: "Stop memorizing phrases, start building sentences.",
    range: [10, 14],
    color: "text-purple-400",
    bg: "from-purple-500/10 to-transparent",
    border: "border-purple-500/20"
  },
  {
    title: "LEVEL 4: VISUAL DECODER",
    description: "Learn to read the Khmer script from scratch.",
    range: [15, 19],
    color: "text-orange-400",
    bg: "from-orange-500/10 to-transparent",
    border: "border-orange-500/20"
  }
];

export default function CourseMap() {
  const {
    loading,
    completedLessons,
    chapters,
    error,
    navigate,
    refresh
  } = useCourseMap();

  if (loading) return <LoadingState label="Loading world map..." className="gap-4" />;

  if (error) {
    return (
      <ErrorState
        title="Map Error"
        message={error}
        onRetry={refresh}
      />
    );
  }

  const hasLessonGroups = Object.keys(chapters).length > 0;

  return (
    <MobileLayout withNav={true}>
      {/* Sticky header to stay visible while scrolling */}
      <div className="p-6 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-2xl font-black tracking-tighter uppercase italic text-white">
          Khmer <span className="text-cyan-400">Mastery</span>
        </h1>
        <div className="bg-gray-900 px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
          <Gem size={16} className="text-emerald-500 fill-emerald-500/20" />
          <span className="font-black text-xs text-gray-200">{completedLessons.length * 50}</span>
        </div>
      </div>

      <div className="space-y-12 mt-6 pb-10">
        {!hasLessonGroups ? (
          <div className="text-center opacity-60 py-20 flex flex-col items-center">
            <RefreshCw size={36} className="mb-4 text-gray-600" />
            <p className="text-gray-400 text-xs uppercase font-black tracking-widest">No lessons available yet</p>
            <p className="text-gray-600 text-[10px] mt-2">Check back soon for new content.</p>
          </div>
        ) : COURSE_LEVELS.map((level, levelIndex) => {
          const levelChapters = Object.values(chapters).filter(ch =>
            ch.id >= level.range[0] && ch.id <= level.range[1]
          );

          if (levelChapters.length === 0) return null;

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
                {levelChapters.map((chapter) => {
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
                              Chapter {chapter.id}
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
