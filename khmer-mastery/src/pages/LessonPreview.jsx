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
      // 1. Получаем заголовок и слова
      const { data: lessonData } = await supabase
        .from('lessons')
        .select('*')
        .eq('id', id)
        .single();

      // 2. Получаем все элементы (теорию), чтобы показать её целиком
      const { data: itemData } = await supabase
        .from('lesson_items')
        .select('*')
        .eq('lesson_id', id)
        .order('order_index', { ascending: true });

      setLesson(lessonData);
      setItems(itemData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const theoryBlocks = items.filter(item => item.type === 'theory');

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400">⏳</div>;

  return (
    <div className="min-h-screen bg-black text-white pb-32 font-sans">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-20 flex items-center gap-4">
        <button onClick={() => navigate('/map')} className="text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={28} />
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Lesson Preview</h1>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-12">
        {/* Lesson Title Section */}
        <section>
          <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
            {lesson?.title}
          </h2>
          <p className="text-gray-500 font-medium">Read the guide below before starting your practice.</p>
        </section>

        {/* THEORY SECTION: Собираем всю теорию в один блок */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-cyan-400 mb-4">
            <BookOpen size={20} />
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Grammar & Rules</h3>
          </div>

          <div className="space-y-8">
            {theoryBlocks.map((block, idx) => (
              <div key={idx} className="bg-gray-900/30 border-l-4 border-cyan-500 p-6 rounded-r-3xl">
                <h4 className="text-lg font-bold mb-2 text-white">{block.data.title}</h4>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{block.data.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* VOCABULARY SECTION: Все слова этого урока */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-cyan-400 mb-4">
            <Info size={20} />
            <h3 className="text-sm font-black uppercase tracking-[0.2em]">Key Vocabulary</h3>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {lesson?.vocabulary?.map((word, idx) => (
              <div key={idx} className="flex items-center justify-between p-5 bg-gray-900/50 border border-white/5 rounded-3xl">
                <div>
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-xl font-bold text-white">{word.khmer}</span>
                    <span className="text-cyan-400 text-sm font-medium">{word.pronunciation}</span>
                  </div>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">{word.english}</p>
                </div>
                <button
                  onClick={() => new Audio(`/sounds/${word.audio}`).play()}
                  className="w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center hover:bg-cyan-500 hover:text-black transition-all"
                >
                  <Volume2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FIXED FOOTER: Start Practice */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-xl border-t border-white/5 z-30">
        <button
          onClick={() => navigate(`/lesson/${id}`)}
          className="max-w-xl mx-auto w-full py-5 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
        >
          <Play size={18} fill="currentColor" /> Start Interactive Session
        </button>
      </div>
    </div>
  );
}