import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, BookOpen, Volume2, Play } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import EmptyState from '../components/UI/EmptyState';
import { fetchLessonById, fetchLessonItemsByLessonId } from '../data/lessons';
import { t } from '../i18n';

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

  if (loading) return <LoadingState label={t('loading.preview')} />;

  if (error) {
    return (
      <ErrorState
        title={t('errors.preview')}
        message={error}
        onRetry={fetchData}
      />
    );
  }

  const vocabItems = items.filter(i => i.type === 'vocab_card');
  const theoryItems = items.filter(i => i.type === 'theory');

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

        {theoryItems.length > 0 && (
          <div className="space-y-4 mb-10">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4 px-1">
              {t('preview.notesTitle')}
            </h3>
            {theoryItems.map((item, idx) => (
              <div key={idx} className="bg-gray-900/40 border border-white/5 p-4 rounded-2xl space-y-2">
                <h4 className="text-sm font-black text-white uppercase tracking-wide">{item.data.title}</h4>
                <p className="text-sm text-gray-300">{item.data.text}</p>
                {item.data.culture_note && (
                  <p className="text-xs text-cyan-300">
                    <span className="font-black uppercase tracking-wide mr-2">{t('preview.cultureLabel')}:</span>
                    {item.data.culture_note}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4 px-1">{t('empty.vocabList')}</h3>
          {vocabItems.length === 0 ? (
            <EmptyState
              title={t('empty.vocab')}
              actions={(
                <>
                  <Button variant="outline" onClick={() => navigate('/map')}>
                    {t('actions.backToMap')}
                  </Button>
                  <Button onClick={() => navigate(`/lesson/${id}`)}>
                    {t('actions.startLesson')} <Play size={18} fill="currentColor" />
                  </Button>
                </>
              )}
              className="py-8"
            />
          ) : vocabItems.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between bg-gray-900/50 border border-white/5 p-4 rounded-2xl">
              <div>
                <h4 className="text-lg font-black text-white">{item.data.back}</h4>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{item.data.front}</p>
                {item.data.pronunciation && (
                  <p className="text-xs text-gray-400 mt-1">
                    <span className="uppercase font-black tracking-widest mr-2">{t('preview.pronunciationLabel')}:</span>
                    {item.data.pronunciation}
                  </p>
                )}
              </div>
              <Volume2 size={18} className="text-cyan-500" />
            </div>
          ))}
        </div>

        {vocabItems.length > 0 && (
          <Button onClick={() => navigate(`/lesson/${id}`)}>
            {t('actions.startLesson')} <Play size={18} fill="currentColor" />
          </Button>
        )}
      </main>
    </MobileLayout>
  );
}
