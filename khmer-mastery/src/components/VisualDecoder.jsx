import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { Sun, Moon, Volume2, Loader2 } from 'lucide-react';

// === ВНУТРЕННИЙ КОМПОНЕНТ (чтобы не путаться с файлами) ===
const COLORS = {
  CONSONANT: '#ffb020', // Оранжевый
  VOWEL: '#ff4081',     // Розовый
  SUBSCRIPT: '#6b5cff', // Синий
  OTHER: '#34d399'      // Зеленый
};

function getCharColor(char) {
  if (!char) return COLORS.OTHER;
  const code = char.codePointAt(0);
  if (code >= 0x1780 && code <= 0x17a2) return COLORS.CONSONANT;
  if (code >= 0x17a3 && code <= 0x17b5) return COLORS.VOWEL;
  if (code >= 0x17b6 && code <= 0x17c5) return COLORS.VOWEL;
  if (char.length > 1 || code === 0x17d2) return COLORS.SUBSCRIPT;
  return COLORS.OTHER;
}

function InteractiveWordOverlay({ word, parts, onPartClick, fontSize }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [zones, setZones] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Функция пересчета координат
  const calculateZones = () => {
    if (!textRef.current || !containerRef.current) return;

    const textNode = textRef.current.firstChild;
    if (!textNode) return;

    const range = document.createRange();
    const newZones = [];
    let currentIndex = 0;

    // Получаем координаты контейнера один раз
    const containerRect = containerRef.current.getBoundingClientRect();

    parts.forEach((part, index) => {
        const len = part.length;
        try {
            range.setStart(textNode, currentIndex);
            range.setEnd(textNode, currentIndex + len);
            const rects = range.getClientRects();

            // Объединяем rects в одну зону для буквы
            for (const r of rects) {
                newZones.push({
                    index,
                    char: part,
                    color: getCharColor(part),
                    // Важнейшая математика: координаты относительно родителя
                    left: r.left - containerRect.left,
                    top: r.top - containerRect.top,
                    width: r.width,
                    height: r.height
                });
            }
        } catch (e) {
             // Игнорируем ошибки Range (если текст меняется на лету)
        }
        currentIndex += len;
    });
    setZones(newZones);
  };

  // Ждем загрузки шрифта, чтобы координаты были точными
  useLayoutEffect(() => {
    document.fonts.ready.then(() => {
        calculateZones();
        // На всякий случай пересчитываем еще раз через мгновение,
        // если шрифт применился с задержкой
        setTimeout(calculateZones, 100);
        setTimeout(calculateZones, 500);
    });

    // Пересчет при ресайзе окна
    window.addEventListener('resize', calculateZones);
    return () => window.removeEventListener('resize', calculateZones);
  }, [word, parts, fontSize]);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Ищем зону под мышкой
    const hit = zones.find(z =>
        x >= z.left && x <= z.left + z.width &&
        y >= z.top && y <= z.top + z.height
    );
    setHoveredIndex(hit ? hit.index : null);
  };

  // Вырезка (Mask)
  const getClipPath = () => {
    if (hoveredIndex === null) return 'inset(100%)'; // Скрыть всё

    const activeZones = zones.filter(z => z.index === hoveredIndex);
    if (!activeZones.length) return 'inset(100%)';

    // Берем первую зону (обычно буква цельная)
    const z = activeZones[0];

    // Формула inset: top right bottom left
    const top = z.top;
    const right = (containerRef.current?.offsetWidth || 0) - (z.left + z.width);
    const bottom = (containerRef.current?.offsetHeight || 0) - (z.top + z.height);
    const left = z.left;

    return `inset(${top}px ${right}px ${bottom}px ${left}px)`;
  };

  const activePart = hoveredIndex !== null ? parts[hoveredIndex] : null;
  const activeColor = activePart ? getCharColor(activePart) : 'transparent';

  return (
    <div
      ref={containerRef}
      className="relative inline-block cursor-pointer select-none"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredIndex(null)}
      onClick={() => hoveredIndex !== null && onPartClick(parts[hoveredIndex], hoveredIndex)}
      style={{ isolation: 'isolate' }} // Создает новый контекст наложения
    >
        {/* СЛОЙ 1: Белый текст (База) */}
        <div
            ref={textRef}
            className="text-white relative z-10"
            style={{
                fontFamily: '"Noto Sans Khmer", serif',
                fontSize: `${fontSize}px`,
                lineHeight: 1.5,
                whiteSpace: 'nowrap' // ЗАПРЕЩАЕМ РАЗРЫВ СТРОК
            }}
        >
            {word}
        </div>

        {/* СЛОЙ 2: Цветной текст (Подсветка) */}
        <div
            className="absolute inset-0 z-20 pointer-events-none transition-all duration-150"
            style={{
                fontFamily: '"Noto Sans Khmer", serif',
                fontSize: `${fontSize}px`,
                lineHeight: 1.5,
                whiteSpace: 'nowrap',
                color: activeColor,
                clipPath: getClipPath(),
                filter: activePart ? `drop-shadow(0 0 15px ${activeColor})` : 'none',
                // Небольшой сдвиг для эффекта 3D при наведении
                transform: activePart ? 'scale(1.02)' : 'scale(1)'
            }}
        >
            {word}
        </div>
    </div>
  );
}

// === ОСНОВНОЙ КОМПОНЕНТ ===

const DEFAULT_KHMER_FONT_URL = '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';

export default function VisualDecoder({ data, onComplete }) {
  const {
    word, target_char, hint, english_translation,
    pronunciation, letter_series, word_audio,
    char_audio_map, char_split
  } = data;

  const [status, setStatus] = useState('searching');
  const [fontLoaded, setFontLoaded] = useState(false);
  const audioRef = useRef(null);

  // ГАРАНТИЯ: Parts используется только для логики, не для рендера
  const parts = char_split && char_split.length > 0 ? char_split : (word ? word.split('') : []);

  useEffect(() => {
    const font = new FontFace('Noto Sans Khmer', `url(${DEFAULT_KHMER_FONT_URL})`);
    font.load().then(f => {
      document.fonts.add(f);
      setFontLoaded(true);
    }).catch(() => {
        // Даже если ошибка, разрешаем рендер (системный шрифт)
        setFontLoaded(true);
    });
  }, []);

  const getTheme = () => {
    if (letter_series === 1) return { badge: <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Sun size={12}/> A-Series</div> };
    if (letter_series === 2) return { badge: <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase"><Moon size={12}/> O-Series</div> };
    return { badge: null };
  };
  const theme = getTheme();

  const playAudio = (file) => {
    if (!file) return;
    const path = file.startsWith('/') ? file : `/sounds/${file}`;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(path);
    audioRef.current = audio;
    audio.play().catch(() => {});
  };

  const handlePartClick = (part) => {
    if (status === 'success') return;
    const sound = char_audio_map?.[part] || char_audio_map?.[target_char];
    if (sound) playAudio(sound);

    if (part.includes(target_char.trim())) {
      setStatus('success');
      playAudio('success.mp3');
      if (word_audio) setTimeout(() => playAudio(word_audio), 1000);
      onComplete();
    } else {
      playAudio('error.mp3');
    }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh] py-4 relative">

      {/* Дебаг версия, чтобы ты видела обновление */}
      <div className="absolute top-0 right-0 text-[9px] text-gray-600 opacity-30">
        v3.0-monolith
      </div>

      <div className={`mb-12 relative transition-all duration-700 ${status === 'success' ? 'scale-110' : ''}`}>
         {status === 'success' && <div className="absolute inset-0 bg-emerald-500/20 blur-3xl animate-pulse rounded-full"/>}

         {!fontLoaded && <div className="text-cyan-400 animate-pulse">Loading Font...</div>}

         {fontLoaded && (
            <InteractiveWordOverlay
                word={word}
                parts={parts}
                onPartClick={handlePartClick}
                fontSize={130}
            />
         )}

         <div className="mt-6 flex justify-center opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => playAudio(word_audio)}>
            <div className="bg-white/5 border border-white/10 rounded-full p-2 hover:bg-cyan-500/20 hover:text-cyan-400">
                <Volume2 size={24} />
            </div>
         </div>
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