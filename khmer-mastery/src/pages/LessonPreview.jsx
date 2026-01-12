import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { X, Volume2, BookOpen, ScrollText } from 'lucide-react';

export default function LessonPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Загружаем информацию о главе/уроке
        const { data: lessonData } = await supabase
          .from('lessons')
          .select('*')
          .eq('id', id)
          .single();
        setLesson(lessonData);

        // 2. Загружаем ВСЕ материалы (слова, теорию) для этой главы
        // Если это Глава 2, мы ищем items для lesson_id = 2
        // (Если ты хочешь показывать слова из подуроков 201, 202 - скажи, я поправлю запрос)
        const { data: itemsData } = await supabase
          .from('lesson_items')
          .select('*')
          .eq('lesson_id', id)
          .order('order_index', { ascending: true });

        setItems(itemsData || []);
      } catch (error) {
        console.error('Error loading preview:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const playAudio = (filename) => {
    if (!filename) return;
    new Audio(`/sounds/${filename}`).play().catch(e => console.log("Audio play error", e));
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-500 font-black tracking-widest">LOADING SUMMARY...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col relative">

      {/* HEADER: Закрыть и Название */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-md border-b border-white/10 p-6 flex items-center justify-between">
        <div>
          <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Chapter Summary</h2>
          <h1 className="text-xl font-black italic text-cyan-400">{lesson?.title}</h1>
        </div>
        <button
          onClick={() => navigate('/map')}
          className="p-3 bg-gray-900 rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* CONTENT: Список слов и теория */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-20">

        {/* Блок описания главы */}
        {lesson?.description && (
          <div className="bg-gray-900/50 p-6 rounded-3xl border border-white/5">
            <p className="text-gray-300 italic leading-relaxed">{lesson.description}</p>
          </div>
        )}

        {/* Если пусто */}
        {items.length === 0 && (
           <div className="text-center py-10 opacity-50">
             <ScrollText size={48} className="mx-auto mb-4" />
             <p>No study materials found for this chapter yet.</p>
           </div>
        )}

        {items.map((item, index) => {
          // ВАРИАНТ 1: Теория
          if (item.type === 'theory') {
            return (
              <div key={index} className="bg-gradient-to-br from-gray-900 to-gray-900/50 p-6 rounded-[2rem] border border-cyan-500/20">
                <div className="flex items-center gap-3 mb-4 text-cyan-400">
                  <BookOpen size={20} />
                  <h3 className="font-black uppercase tracking-widest text-sm">{item.data.title}</h3>
                </div>
                <div className="text-gray-300 leading-7 text-sm whitespace-pre-line">
                  {item.data.text}
                </div>
              </div>
            );
          }

          // ВАРИАНТ 2: Карточка слова (в виде полоски)
          if (item.type === 'vocab_card') {
            return (
              <div key={index}
                onClick={() => playAudio(item.data.audio)}
                className="flex items-center justify-between bg-black border border-white/10 p-5 rounded-2xl active:bg-gray-900 transition-colors cursor-pointer group"
              >
                <div>
                  <h4 className="text-lg font-black text-white mb-1 group-hover:text-cyan-400 transition-colors">
                    {item.data.back} {/* Кхмерский */}
                  </h4>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                    {item.data.front} {/* Английский */}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {item.data.pronunciation && (
                    <span className="text-xs font-bold text-gray-600 italic hidden sm:block">
                      /{item.data.pronunciation}/
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-all">
                    <Volume2 size={18} />
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}

      </div>

      {/* Footer удален, так как кнопки "Начать" не нужно */}
    </div>
  );
}