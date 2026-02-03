import React from 'react';
import { Puzzle, Volume2 } from 'lucide-react';
import KhmerColoredText from '../KhmerColoredText';
import { getSoundFileForChar } from '../../data/audioMap';
import LessonFrame from '../UI/LessonFrame';
import LessonHeader from '../UI/LessonHeader';

const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function InventorySlide({ data, onPlayAudio }) {
  const wordAudio = data.audio || data.word_audio || data.phrase_audio || '';
  const playWordAudio = () => {
    if (!onPlayAudio) return;
    if (wordAudio) {
      onPlayAudio(wordAudio);
      return;
    }
    const charSounds = (data.chars || [])
      .map((char) => getSoundFileForChar(char))
      .filter(Boolean);
    charSounds.forEach((sound, idx) => {
      setTimeout(() => onPlayAudio(sound), idx * 500);
    });
  };

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Главная карточка слова */}
      <LessonFrame className="p-8 text-center relative overflow-visible space-y-6">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <Puzzle size={16} />
          <span className="font-black uppercase tracking-[0.2em] text-[10px]">Word Breakdown</span>
        </div>
        <LessonHeader
          hint="Task: tap the word to hear it, then tap each letter to hear its sound."
        />

        <button
          type="button"
          onClick={playWordAudio}
          className="flex flex-col items-center gap-3 mx-auto"
        >
          <div className="min-h-[4rem] flex items-center justify-center">
            <KhmerColoredText
              text={data.word}
              fontUrl={DEFAULT_KHMER_FONT_URL}
              fontSize={64}
              className="leading-[1.2]"
            />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white">{data.pronunciation}</h2>
            <p className="text-cyan-400 text-lg italic font-medium">{data.translation}</p>
          </div>
        </button>

        <button
            onClick={playWordAudio}
            className="absolute top-4 right-4 p-2 bg-gray-800/80 rounded-full text-cyan-400 border border-white/5 hover:bg-gray-700 transition-colors"
            aria-label="Play word audio"
            type="button"
          >
            <Volume2 size={20} />
          </button>

        <div className="w-full bg-black/20 rounded-3xl p-6 border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">
              Letter Hints
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {(data.chars || []).map((char, idx) => {
              const audioFile = getSoundFileForChar(char);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => audioFile && onPlayAudio(audioFile)}
                  className="bg-gray-800 border border-white/10 rounded-2xl w-16 h-20 flex items-center justify-center shadow-lg relative overflow-visible group hover:border-cyan-500/50 transition-colors"
                  title="Tap to hear this letter"
                >
                  <KhmerColoredText
                    text={char}
                    fontUrl={DEFAULT_KHMER_FONT_URL}
                    fontSize={32}
                  />
                  <span className="absolute bottom-1 right-2 text-[8px] text-gray-600 font-mono">{idx + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      </LessonFrame>
    </div>
  );
}
