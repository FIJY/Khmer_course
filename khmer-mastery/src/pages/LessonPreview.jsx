import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ChevronLeft, Play, BookOpen, Volume2, Info } from 'lucide-react';

export default function LessonPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchLessonData();
  }, [id]);

  const fetchLessonData = async () => {
    try {
      const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single();
      const { data: itemData } = await supabase.from('lesson_items').select('*').eq('lesson_id', id).order('order_index', { ascending: true });
      setLesson(lessonData);
      setItems(itemData || []);
    } catch (error) {
      console.error('Error loading lesson preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const theoryBlocks = items.filter(item => item.type === 'theory');

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400">⏳</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans">
      <div className="p-6 border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-20 flex items-center gap-4">
        <button onClick={() => navigate('/map')} className="text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Lesson Overview</h1>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-12">
        <header>
          <h2 className="text-5xl font-black mb-3 tracking-tighter uppercase italic text-white leading-none">
            {lesson?.title}
          </h2>
          <p className="text-gray-600 font-bold text-[10px] uppercase tracking-widest">Survival Guide • Module {id}</p>
        </header>

        {/* Теория в виде компактных карточек */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {theoryBlocks.map((block, idx) => (
            <div key={idx} className="bg-gray-900/20 border border-white/5 p-6 rounded-[2rem]">
              <h4 className="text-cyan-400 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen size={12} /> {block.data.title}
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap italic opacity-90">
                {block.data.text}
              </p>
            </div>
          ))}
        </section>

        {/* Словарь в 2 колонки */}
        <section>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-700 mb-6 flex items-center gap-2">
            <Info size={14} /> Vocabulary Bank
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lesson?.vocabulary?.map((word, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-900/30 border border-white/5 rounded-2xl hover:border-cyan-500/20 transition-all">
                <div className="overflow-hidden">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold truncate">{word.khmer}</span>
                    <span className="text-cyan-500 text-[10px] font-bold uppercase tracking-widest">{word.pronunciation}</span>
                  </div>
                  <p className="text-gray-600 text-[9px] font-black uppercase tracking-tighter truncate">{word.english}</p>
                </div>
                <button
                  onClick={() => new Audio(`/sounds/${word.audio}`).play()}
                  className="p-3 bg-cyan-500/10 text-cyan-400 rounded-full hover:bg-cyan-500 hover:text-black transition-all"
                >
                  <Volume2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Футер с кнопкой старта */}
      <div className="fixed bottom-8 left-6 right-6 max-w-xl mx-auto z-40">
        <button
          onClick={() => navigate(`/lesson/${id}`)}
          className="w-full py-5 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-cyan-500/20 flex items-center justify-center gap-3 active:scale-95 transition-transform"
        >
          <Play size={16} fill="currentColor" /> Start Practice Mode
        </button>
      </div>
    </div>
  );
}