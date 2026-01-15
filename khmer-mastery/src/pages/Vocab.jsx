import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Search, Volume2, ScrollText } from 'lucide-react';
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';
import ErrorState from '../components/UI/ErrorState';
import LoadingState from '../components/UI/LoadingState';
import EmptyState from '../components/UI/EmptyState';
import useVocab from '../hooks/useVocab';
import { t } from '../i18n';

export default function Vocab() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    error,
    filter,
    setFilter,
    filteredItems,
    playAudio,
    refresh
  } = useVocab();

  return (
    <MobileLayout>
      {/* HEADER */}
      <div className="p-6 sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="text-cyan-500" size={24} />
          <h1 className="text-3xl font-black italic tracking-tighter uppercase text-white">{t('vocab.title')}</h1>
        </div>
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
          {t('vocab.wordsAvailable', { count: items.length })}
        </p>
      </div>

      {/* SEARCH */}
      <div className="px-6 mt-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder={t('vocab.searchPlaceholder')}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full bg-gray-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-cyan-500/50 outline-none transition-all font-bold"
          />
        </div>
      </div>

      {/* WORD LIST */}
      <div className="px-6 mt-6 space-y-3 pb-10">
        {loading ? (
          <LoadingState label={t('loading.dictionary')} fullScreen={false} className="py-10" />
        ) : error ? (
          <ErrorState
            title={t('errors.dictionary')}
            message={error}
            onRetry={refresh}
            fullScreen={false}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title={t('empty.vocab')}
            icon={<ScrollText size={48} />}
            actions={(
              <Button variant="outline" onClick={() => navigate('/map')}>
                {t('actions.backToMap')}
              </Button>
            )}
          />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            title={t('empty.results')}
            icon={<ScrollText size={48} />}
          />
        ) : (
          filteredItems.map((item, i) => (
            <div
              key={i}
              onClick={() => playAudio(item.data.audio)}
              className="bg-gray-900/20 border border-white/5 p-5 rounded-2xl flex items-center justify-between active:bg-gray-800 transition-colors cursor-pointer group hover:border-cyan-500/20"
            >
              <div className="flex items-center gap-4 text-white">
                <div className="w-8 h-8 rounded-full bg-cyan-500/5 text-cyan-500 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-black transition-all">
                  <Volume2 size={14} />
                </div>
                <div>
                  <h3 className="font-black text-lg leading-none mb-1">{item.data.back}</h3>
                  <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{item.data.front}</p>
                </div>
              </div>
              <span className="text-[8px] font-black text-gray-800 uppercase tracking-tighter">L-{item.lesson_id}</span>
            </div>
          ))
        )}
      </div>
    </MobileLayout>
  );
}
