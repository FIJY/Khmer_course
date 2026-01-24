import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Volume2, Loader2 } from 'lucide-react';
// Импортируем компонент с методом "Двойного наложения"
// Убедись, что файл InteractiveOverlayWord.jsx существует в той же папке!
import InteractiveOverlayWord from './InteractiveOverlayWord'; 

// Путь к шрифту (для предзагрузки)
const DEFAULT_KHMER_FONT_URL = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function VisualDecoder({ data, onComplete }) {
  const {
    word, 
    target_char, 
    hint, 
    english_translation,
    pronunciation, 
    letter_series, 
    word_audio,
    char_audio_map, 
    char_split 
  } = data;

  const [status, setStatus] = useState('searching'); // searching | success | error
  const [fontLoaded, setFontLoaded] = useState(false);
  const audioRef = useRef(null);

  // Используем разбивку из БД или, на крайний случай, делим по буквам
  const parts = char_split && char_split.length > 0 ? char_split : (word ? word.split('') : []);

  // 1. Предзагрузка шрифта (чтобы не было скачка стилей)
  useEffect(() => {
    const font = new FontFace('Noto Sans Khmer', `url(${DEFAULT_KHMER_FONT_URL})`);
    font.load().then(f => {
      document.fonts.add(f);
      setFontLoaded(true);
    }).catch((err) => {
      console.warn("Font loading skipped or failed:", err);
      // Всё равно разрешаем рендер, браузер использует запасной шрифт
      setFontLoaded(true);
    });
  }, []);

  // 2. Определение темы (A-Series / O-Series)
  const getTheme = () => {
    if (letter_series === 1) return { badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Sun size={12}/> A-Series</div> };
    if (letter_series === 2) return { badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Moon size={12}/> O-Series</div> };
    return { badge: null };
  };
  const theme = getTheme();

  // 3. Воспроизведение аудио
  const playAudio = (file) => {
    if (!file) return;
    const path = file.startsWith('/') ? file : `/sounds/${file}`;
    if (audioRef.current) { 
        audioRef.current.pause(); 
        audioRef.current.currentTime = 0; 
    }
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(e => console.warn("Audio error:", e));
  };

  // 4. Обработка клика по части слова
  const handlePartClick = (part, index) => {
    if (status === 'success') return;
    
    // Играем звук части (если есть) или звук целевой буквы
    const sound = char_audio_map?.[part] || char_audio_map?.[target_char];
    if (sound) playAudio(sound);

    // Проверяем, содержит ли нажатая часть нашу цель
    // trim() нужен, чтобы убрать случайные пробелы
    if (part.includes(target_char.trim())) {
      setStatus('success');
      playAudio('success.mp3'); // Звук успеха
      
      // Через секунду играем слово целиком и завершаем
      if (word_audio) {
          setTimeout(() => playAudio(word_audio), 1000);
      }
      onComplete();
    } else {
      // Ошибка
      setStatus('error');
      playAudio('error.mp3');
      // Сбрасываем статус через полсекунды, чтобы можно было пробовать снова
      setTimeout(() => setStatus('searching'), 500);
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">
      
      {/* --- БЛОК СЛОВА --- */}
      <div className={`mb-12 relative transition-all duration-700 ${status === 'success' ? 'scale-110' : ''}`}>
         
         {/* Эффект свечения при победе */}
         {status === 'success' && (
             <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse rounded-full pointer-events-none"/>
         )}

         {/* Лоадер шрифта */}
         {!fontLoaded && (
             <div className="text-cyan-400 animate-pulse flex gap-2 items-center">
                 <Loader2 className="animate-spin" size={20}/> 
                 Loading...
             </div>
         )}

         {/* Основной интерактивный компонент */}
         {fontLoaded && (
            <InteractiveOverlayWord 
                word={word}
                parts={parts}
                onPartClick={handlePartClick}
                fontSize={130} // Размер шрифта можно менять здесь
            />
         )}

         {/* Кнопка воспроизведения слова целиком */}
         <div 
            className="mt-8 flex justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer" 
            onClick={() => playAudio(word_audio)}
         >
            <div className="bg-white/5 border border-white/10 rounded-full p-3 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors">
                <Volume2 size={24} />
            </div>
         </div>
      </div>

      {/* --- БЛОК ИНФОРМАЦИИ --- */}
      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
         {pronunciation && (
             <p className="text-cyan-300 font-mono text-xl tracking-widest">/{pronunciation}/</p>
         )}
         
         <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">
             {english_translation}
         </h3>
         
         <div className="pt-6 flex justify-center items-center gap-3">
             {theme.badge}
             <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-xl border border-white/10">
                 Task: {hint}
             </span>
         </div>
      </div>

    </div>
  );
}