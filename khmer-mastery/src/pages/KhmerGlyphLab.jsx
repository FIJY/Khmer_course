import React, { useState } from 'react';
import VisualDecoder from '../components/VisualDecoder'; // Наш новый компонент
import Button from '../components/UI/Button';
import MobileLayout from '../components/Layout/MobileLayout';

export default function KhmerGlyphLab() {
  const [inputText, setInputText] = useState('កាហ្វេ');
  const [activeWord, setActiveWord] = useState('កាហ្វេ');

  return (
    <MobileLayout withNav={false} contentClassName="flex flex-col items-center p-6 gap-6">
      <h1 className="text-3xl font-bold text-cyan-400 text-center">🔬 Лаборатория Глифов</h1>

      {/* Блок управления */}
      <div className="bg-gray-800/70 p-6 rounded-2xl border border-gray-700 w-full">
        <label className="block text-sm text-gray-400 mb-2">Введите слово на кхмерском:</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-xl font-khmer text-white focus:border-cyan-500 outline-none"
          />
          <Button onClick={() => setActiveWord(inputText)}>
            Показать
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * Если слово не отображается, добавьте его в <code>scripts/generate-glyphs.cjs</code> и запустите скрипт.
        </p>
      </div>

      {/* Экран просмотра */}
      <div className="w-full bg-black/40 p-8 rounded-3xl border border-white/10 min-h-[240px] flex items-center justify-center">
        <VisualDecoder
          text={activeWord}
          onLetterClick={(char) => console.log("Клик:", char)}
        />
      </div>

      {/* Список для быстрой проверки */}
      <div className="flex flex-wrap gap-2 justify-center">
        {["កាហ្វេ", "សួស្តី", "ញ៉ាំ", "ខ្មែរ", "សាលារៀន", "ទឹក", "ម៉ាក់"].map(word => (
           <button
             key={word}
             onClick={() => { setInputText(word); setActiveWord(word); }}
             className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm border border-gray-600"
           >
             {word}
           </button>
        ))}
      </div>
    </MobileLayout>
  );
}
