import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Volume2, Loader2 } from 'lucide-react';

// Дефолтный шрифт
const DEFAULT_KHMER_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

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

  const [status, setStatus] = useState('searching');
  const [fontLoaded, setFontLoaded] = useState(false);
  const audioRef = useRef(null);

  // Canvas refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [clickZones, setClickZones] = useState([]);

  // Части слова
  const parts = char_split && char_split.length > 0 ? char_split : (word ? word.split('') : []);

  // ТЕМА
  const getTheme = () => {
    if (letter_series === 1) return { badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Sun size={12}/> A-Series</div> };
    if (letter_series === 2) return { badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Moon size={12}/> O-Series</div> };
    return { badge: null };
  };
  const theme = getTheme();

  // 1. ЗАГРУЗКА ШРИФТА (Критически важно!)
  useEffect(() => {
    const fontName = 'Noto Sans Khmer';
    const font = new FontFace(fontName, `url(${DEFAULT_KHMER_FONT_URL})`);

    font.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
      setFontLoaded(true); // Только теперь разрешаем рисовать
    }).catch(err => {
      console.warn("Font load failed, using fallback", err);
      setFontLoaded(true); // Пытаемся рисовать даже если ошибка
    });
  }, []);

  // 2. ОТРИСОВКА НА CANVAS (Только когда шрифт готов)
  useEffect(() => {
    if (!fontLoaded || !canvasRef.current || !parts.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Настройки текста
    const fontSize = 120; // Базовый размер
    const fontStr = `${fontSize}px "Noto Sans Khmer", serif`;
    ctx.font = fontStr;

    // --- РАСЧЕТ ЗОН ---
    // Чтобы узнать, где начинается и кончается каждая буква, мы измеряем части
    const zones = [];
    let currentX = 0;

    // Хитрость: измеряем ширину нарастающим итогом, чтобы учесть кернинг
    let accumStr = "";
    parts.forEach((part, i) => {
       const prevW = ctx.measureText(accumStr).width;
       accumStr += part;
       const currW = ctx.measureText(accumStr).width;
       const partW = currW - prevW;

       zones.push({ char: part, x: prevW, width: partW, index: i });
       currentX = currW;
    });
    setClickZones(zones);

    // --- НАСТРОЙКА РАЗМЕРА ---
    // Устанавливаем размер с учетом Retina (DPR)
    const displayWidth = currentX;
    const displayHeight = fontSize * 1.6;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.scale(dpr, dpr);

    // --- ФУНКЦИЯ РИСОВАНИЯ ---
    const draw = () => {
        // Очистка
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // Важно: переустанавливаем шрифт после ресайза/scale
        ctx.font = fontStr;
        ctx.textBaseline = 'middle';
        const y = displayHeight / 2;

        // 1. БАЗОВЫЙ СЛОЙ (Белый)
        // Рисуем слово целиком. Это гарантирует идеальные лигатуры.
        ctx.fillStyle = 'white';
        ctx.fillText(word, 0, y);

        // 2. СЛОЙ ПОДСВЕТКИ (Маска)
        // Если есть наведение или статус успеха - рисуем цветную версию поверх
        if (hoveredIndex !== null || status === 'success') {
            zones.forEach((zone, i) => {
                const isHovered = i === hoveredIndex;
                const isTargetPart = zone.char.includes(target_char);

                // Условия подсветки:
                // - Если мы ищем (searching) и навели мышь -> Cyan
                // - Если нашли (success) и это та самая часть -> Green
                let shouldHighlight = false;
                let color = '#22d3ee'; // Cyan

                if (status === 'searching' && isHovered) {
                    shouldHighlight = true;
                }
                if (status === 'success' && isTargetPart) {
                    shouldHighlight = true;
                    color = '#34d399'; // Emerald
                }

                if (shouldHighlight) {
                    ctx.save();
                    // МАГИЯ: Обрезаем область рисования (Clip) только до ширины этой буквы
                    ctx.beginPath();
                    // Добавляем 1px чтобы перекрыть швы
                    ctx.rect(zone.x - 1, 0, zone.width + 2, displayHeight);
                    ctx.clip();

                    // Рисуем ТО ЖЕ САМОЕ слово, но цветное, в ТОЙ ЖЕ позиции
                    ctx.fillStyle = color;
                    ctx.fillText(word, 0, y);

                    // Добавляем свечение
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 15;
                    ctx.fillText(word, 0, y);

                    ctx.restore();
                }
            });
        }
    };

    draw();

  }, [fontLoaded, word, parts, hoveredIndex, status, target_char]);

  // --- ОБРАБОТЧИКИ МЫШИ ---
  const handleMouseMove = (e) => {
    if (!clickZones.length) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const index = clickZones.findIndex(z => x >= z.x && x <= z.x + z.width);
    setHoveredIndex(index !== -1 ? index : null);
    canvasRef.current.style.cursor = index !== -1 ? 'pointer' : 'default';
  };

  const handleMouseLeave = () => setHoveredIndex(null);

  const handleClick = () => {
    if (hoveredIndex === null || status === 'success') return;

    const zone = clickZones[hoveredIndex];
    const part = zone.char;

    // Звук
    const sound = char_audio_map?.[part] || char_audio_map?.[target_char];
    if (sound) playAudio(sound);

    if (part.includes(target_char)) {
      setStatus('success');
      playAudio('success.mp3');
      if (word_audio) setTimeout(() => playAudio(word_audio), 1000);
      onComplete();
    } else {
      setStatus('error');
      playAudio('error.mp3');
      // При ошибке можно добавить визуальный эффект (например, красную вспышку),
      // но в Canvas это сложнее, пока ограничимся звуком
      setTimeout(() => setStatus('searching'), 500);
    }
  };

  // Аудио хелпер
  const playAudio = (file) => {
    if (!file) return;
    const path = file.startsWith('/') ? file : `/sounds/${file}`;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(e => console.warn(e));
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">

      {/* ГЛАВНОЕ СЛОВО */}
      <div className={`mb-12 relative transition-all duration-700 ${status === 'success' ? 'scale-110' : ''}`}>

         {!fontLoaded && (
            <div className="flex flex-col items-center text-cyan-400 animate-pulse">
                <Loader2 className="animate-spin mb-2" />
                <span className="text-xs uppercase tracking-widest">Loading Fonts...</span>
            </div>
         )}

         {/* CANVAS */}
         {/* opacity-0 пока шрифт не загрузится, чтобы не мигало квадратами */}
         <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className={`transition-opacity duration-300 ${fontLoaded ? 'opacity-100' : 'opacity-0'}`}
         />

         {/* Иконка звука */}
         {fontLoaded && (
            <div
                className="mt-4 flex justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => playAudio(word_audio)}
            >
                <div className="bg-white/5 border border-white/10 rounded-full p-2 hover:bg-cyan-500/20 hover:text-cyan-400">
                    <Volume2 size={24} />
                </div>
            </div>
         )}
      </div>

      {/* ИНФО */}
      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
         {pronunciation && (
            <p className="text-cyan-300 font-mono text-xl tracking-widest">/{pronunciation}/</p>
         )}
         <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">
            {english_translation}
         </h3>

         <div className="pt-6 flex justify-center gap-3">
             {theme.badge}
             <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-xl border border-white/10">
               Task: {hint}
             </span>
         </div>
      </div>
    </div>
  );
}