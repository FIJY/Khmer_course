import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { X, BookOpen, Volume2, Play } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';

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
        const { data: lessonData } = await supabase.from('lessons').select('*').eq('id', id).single();
        setLesson(lessonData);
        const { data: itemsData } = await supabase.from('lesson_items')
          .select('*').eq('lesson_id', id).order('order_index', { ascending: true });
        setItems(itemsData || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic">LOADING PREVIEW...</div>;

  return (
    <MobileLayout withNav={true}>
      <header className="p-4 border-b border-white/5">
        <button onClick={() => navigate('/map')} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="text-center mb-10">
          <BookOpen className="text-cyan-500 mx-auto mb-4" size={48} />
          <h1 className="text-3xl font-black uppercase italic mb-2 text-white">{lesson?.title}</h1>
          <p className="text-gray-500 italic">{lesson?.description}</p>
        </div>

        <div className="space-y-3 mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4 px-1">Vocabulary List</h3>
          {items.filter(i => i.type === 'vocab_card').map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-900/50 border border-white/5 p-4 rounded-2xl">
              <div>
                <h4 className="text-lg font-black text-white">{item.data.back}</h4>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{item.data.front}</p>
              </div>
              <Volume2 size={18} className="text-cyan-500" />
            </div>
          ))}
        </div>

        <Button onClick={() => navigate(`/lesson/${id}`)}>
          Start Lesson <Play size={18} fill="currentColor" />
        </Button>
      </main>
    </MobileLayout>
  );
}