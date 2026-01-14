import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { X, Volume2, BookOpen, ScrollText, Play } from 'lucide-react';
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

  const playAudio = (file) => {
    if (file) new Audio(`/sounds/${file}`).play().catch(() => {});
  };

  if (loading) return <div className="h-screen bg-black flex items-center justify-center text-cyan-400 font-black italic">LOADING...</div>;

  return (
    <MobileLayout withNav={false}>
      <header className="p-4 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate('/map')} className="p-2 text-gray-500 hover:text-white"><X size={24} /></button>
        <h2 className="text-[10px] font-black uppercase tracking-widest text-cyan-500">Lesson Preview</h2>
        <div className="w-10" />
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20 text-cyan-400">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-black italic uppercase mb-2 leading-none">{lesson?.title}</h1>
          <p className="text-gray-500 font-bold italic">{lesson?.description}</p>
        </div>

        <div className="space-y-3 mb-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-4 px-1">Vocabulary to learn</h3>
          {items.filter(i => i.type === 'vocab_card').map((item, index) => (
            <div key={index} onClick={() => playAudio(item.data.audio)} className="flex items-center justify-between bg-gray-900/50 border border-white/5 p-4 rounded-2xl active:scale-95 transition-all cursor-pointer">
              <div>
                <h4 className="text-lg font-black text-white">{item.data.back}</h4>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{item.data.front}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500"><Volume2 size={18} /></div>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-6 pb-12 bg-black/80 backdrop-blur-md">
        <Button onClick={() => navigate(`/lesson/${id}`)}>
          Start Lesson <Play size={18} fill="currentColor" />
        </Button>
      </footer>
    </MobileLayout>
  );
}