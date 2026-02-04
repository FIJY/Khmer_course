import React from 'react';
import { Volume2 } from 'lucide-react';
import LessonFrame from '../UI/LessonFrame';
import KhmerColoredText from '../KhmerColoredText';

const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function VocabCardSlide({
  variant = 'full',
  isFlipped,
  englishText,
  khmerText,
  pronunciation,
  audio,
  onFlip,
  onPlayEnglishAudio,
  onPlayAudio,
  t
}) {
  const content = variant === 'preview' ? (
    <div className="w-full cursor-pointer" onClick={onFlip}>
      <div className={`relative h-[22rem] transition-all duration-500 preserve-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
        <div className="absolute inset-0 backface-hidden bg-gray-900 rounded-[3rem] border border-white/5 flex flex-col items-center justify-center p-8 text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">{t('lesson.cardEnglish')}</p>
          <h2 className="text-3xl font-black italic text-white">{englishText}</h2>
        </div>
        <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 rounded-[3rem] border-2 border-cyan-500/20 flex flex-col items-center justify-center p-8 text-center text-white">
          <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">{t('lesson.cardKhmer')}</p>
          <KhmerColoredText text={khmerText} fontUrl={DEFAULT_KHMER_FONT_URL} fontSize={72} className="text-4xl font-black mb-2" />
          <p className="text-base text-cyan-100 font-semibold tracking-wide mb-4">
            <span className="text-[11px] text-cyan-400 font-black uppercase tracking-widest mr-2">{t('lesson.pronunciationLabel')}:</span>
            {pronunciation || '—'}
          </p>
          {audio ? (
            <div onClick={(e) => { e.stopPropagation(); onPlayAudio(); }} className="p-5 bg-cyan-500 rounded-full text-black hover:bg-cyan-400 active:scale-90 transition-all shadow-lg">
              <Volume2 size={28} />
            </div>
          ) : <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('lesson.audioUnavailable')}</p>}
        </div>
      </div>
    </div>
  ) : (
    <LessonFrame className="relative p-0" variant="full">
      <div className="w-full h-full cursor-pointer" onClick={onFlip}>
        <div className={`relative h-full min-h-[60vh] transition-all duration-500 preserve-3d ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          <div className="absolute inset-0 backface-hidden bg-gray-900 border border-white/5 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">{t('lesson.cardEnglish')}</p>
            <h2 className="text-3xl font-black italic text-white">{englishText}</h2>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPlayEnglishAudio(); }}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/30 transition-colors"
            >
              <Volume2 size={18} />
              <span className="text-xs font-semibold uppercase tracking-widest">English audio</span>
            </button>
          </div>
          <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-gray-900 border-2 border-cyan-500/20 flex flex-col items-center justify-center p-8 text-center text-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3">{t('lesson.cardKhmer')}</p>
            <div className="flex flex-col items-center gap-3 w-full">
              <div className="min-h-[4.5rem] flex items-center justify-center">
                <span className="font-khmer text-5xl leading-[1.2] text-white">{khmerText}</span>
              </div>
              <p className="text-base text-cyan-100 font-semibold tracking-wide">
                <span className="text-[11px] text-cyan-400 font-black uppercase tracking-widest mr-2">{t('lesson.pronunciationLabel')}:</span>
                {pronunciation || '—'}
              </p>
            </div>
            {audio ? (
              <div onClick={(e) => { e.stopPropagation(); onPlayAudio(); }} className="p-5 bg-cyan-500 rounded-full text-black hover:bg-cyan-400 active:scale-90 transition-all shadow-lg">
                <Volume2 size={28} />
              </div>
            ) : <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{t('lesson.audioUnavailable')}</p>}
          </div>
        </div>
      </div>
    </LessonFrame>
  );

  return content;
}
