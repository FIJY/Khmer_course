import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, BookOpen, Volume2, Play } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import { fetchLessonById, fetchLessonItemsByLessonId } from '../data/lessons';

export default function LessonPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const lessonData = await fetchLessonById(id);
      setLesson(lessonData);
      const itemsData = await fetchLessonItemsByLessonId(id);
      setItems(itemsData);
    } catch (e) {
      console.error(e);
      setError('Unable to load the lesson preview.');
    }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingState label="Loading preview..." />;

  if (error) {
    return (
      <ErrorState
        title="Preview Error"
        message={error}
        onRetry={fetchData}
      />
    );
  }

  const vocabItems = items.filter(i => i.type === 'vocab_card');

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
          {vocabItems.length === 0 ? (
            <div className="text-center opacity-60 py-8 space-y-4">
              <p className="text-gray-500 italic">No vocabulary items yet</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate('/map')}>
                  Back to Map
                </Button>
                <Button onClick={() => navigate(`/lesson/${id}`)}>
                  Start Lesson <Play size={18} fill="currentColor" />
                </Button>
              </div>
            </div>
          ) : vocabItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-900/50 border border-white/5 p-4 rounded-2xl">
              <div>
                <h4 className="text-lg font-black text-white">{item.data.back}</h4>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{item.data.front}</p>
              </div>
              <Volume2 size={18} className="text-cyan-500" />
            </div>
          ))}
        </div>

        {vocabItems.length > 0 && (
          <Button onClick={() => navigate(`/lesson/${id}`)}>
            Start Lesson <Play size={18} fill="currentColor" />
          </Button>
        )}
      </main>
    </MobileLayout>
  );
}
