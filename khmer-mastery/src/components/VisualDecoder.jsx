import React, { useState, useEffect, useRef } from 'react';
import { Sun, Moon, Volume2, Loader2 } from 'lucide-react';

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

  const canvasRef = useRef(null);
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

  // 1. ЗАГРУЗКА ШРИФТА
  useEffect(() => {
    const fontName = 'Noto Sans Khmer';
    const font = new FontFace(fontName, `url(${DEFAULT_KHMER_FONT_URL})`);
    font.load().then((loadedFont) => {
      document.fonts.add(loadedFont);
      setFontLoaded(true);
    }).catch(() => setFontLoaded(true));
  }, []);

  // 2. ОТРИСОВКА
  useEffect(() => {
    if (!fontLoaded || !canvasRef.current || !parts.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // НАСТРОЙКИ РАЗМЕРА
    const fontSize = 100; // Чуть уменьшим базу, чтобы влезало
    // Кхмерский требует много места сверху и снизу. Множитель 2.5 безопасен.
    const lineHeight = fontSize * 2.5;
    const fontStr = `${fontSize}px "Noto Sans Khmer", serif`;

    ctx.font = fontStr;

    // --- РАСЧЕТ ШИРИНЫ И ЗОН ---
    const zones = [];
    let currentX = 0;

    // Используем метод накопления ширины
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

    // Добавляем горизонтальный отступ (padding), чтобы swashes не резались
    const paddingX = 20;
    const displayWidth = currentX + (paddingX * 2);
    const displayHeight = lineHeight;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;

    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    ctx.scale(dpr, dpr);

    // --- РИСОВАНИЕ ---
    const draw = () => {
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        ctx.font = fontStr;
        ctx.textBaseline = 'middle';
        // Центруем по вертикали и добавляем отступ слева
        const x = paddingX;
        const y = displayHeight / 2 + (fontSize * 0.1); // Чуть ниже центра, так как у кхмерского "верх" тяжелее

        // 1. БАЗОВЫЙ СЛОЙ
        ctx.fillStyle = 'white';
        ctx.fillText(word, x, y);

        // 2. ПОДСВЕТКА (Через маску)
        if (hoveredIndex !== null || status === 'success') {
            zones.forEach((zone, i) => {
                const isHovered = i === hoveredIndex;
                const isTargetPart = zone.char.includes(target_char);

                let shouldHighlight = false;
                let color = '#22d3ee'; // Cyan (Поиск)

                if (status === 'searching' && isHovered) shouldHighlight = true;
                if (status === 'success' && isTargetPart) {
                    shouldHighlight = true;
                    color = '#34d399'; // Green (Успех)
                }

                if (shouldHighlight) {
                    ctx.save();
                    // Маска: режем строго по ширине буквы (зона клика), но на всю высоту
                    // Расширяем зону клика на 1px, чтобы не было щелей
                    ctx.beginPath();
                    ctx.rect(x + zone.x - 1, 0, zone.width + 2, displayHeight);
                    ctx.clip();

                    // Рисуем цветное слово поверх
                    ctx.fillStyle = color;
                    ctx.fillText(word, x, y);

                    // Свечение для красоты
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 15;
                    ctx.fillText(word, x, y);

                    ctx.restore();
                }
            });
        }
    };

    draw();

  }, [fontLoaded, word, parts, hoveredIndex, status, target_char]);

  // --- ОБРАБОТКА МЫШИ ---
  const handleMouseMove = (e) => {
    if (!clickZones.length) return;
    const rect = canvasRef.current.getBoundingClientRect();
    // Учитываем paddingX при расчете координат мыши
    const paddingX = 20;
    const x = e.clientX - rect.left - paddingX;

    // Ищем зону (добавляем допуск +/- 5px для удобства)
    const index = clickZones.findIndex(z => x >= z.x && x <= z.x + z.width);
    setHoveredIndex(index !== -1 ? index : null);
    canvasRef.current.style.cursor = index !== -1 ? 'pointer' : 'default';
  };

  const handleClick = () => {
    if (hoveredIndex === null || status === 'success') return;
    const zone = clickZones[hoveredIndex];
    const part = zone.char;

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
      setTimeout(() => setStatus('searching'), 500);
    }
  };

  const playAudio = (file) => {
    if (!file) return;
    const path = file.startsWith('/') ? file : `/sounds/${file}`;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4">

      <div className={`mb-12 relative transition-all duration-700 ${status === 'success' ? 'scale-110' : ''}`}>
         {!fontLoaded && <div className="animate-pulse text-cyan-400">Loading Fonts...</div>}

         <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={handleClick}
            className={`transition-opacity duration-300 ${fontLoaded ? 'opacity-100' : 'opacity-0'}`}
         />

         {fontLoaded && (
            <div className="mt-4 flex justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => playAudio(word_audio)}>
                <div className="bg-white/5 border border-white/10 rounded-full p-2 hover:bg-cyan-500/20 hover:text-cyan-400">
                    <Volume2 size={24} />
                </div>
            </div>
         )}
      </div>

      <div className="text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
         {pronunciation && <p className="text-cyan-300 font-mono text-xl tracking-widest">/{pronunciation}/</p>}
         <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">{english_translation}</h3>
         <div className="pt-6 flex justify-center gap-3">
             {theme.badge}
             <span className="text-slate-400 text-xs font-bold uppercase tracking-widest bg-gray-900 px-4 py-2 rounded-xl border border-white/10">Task: {hint}</span>
         </div>
      </div>
    </div>
  );
}