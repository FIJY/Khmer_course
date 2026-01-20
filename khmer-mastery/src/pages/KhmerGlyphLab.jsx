import React from 'react';
import KhmerColoredText from '../components/KhmerColoredText';
import KhmerWordAnalyzer from '../components/KhmerWordAnalyzer';
import KhmerWordReader from '../components/KhmerWordReader';
import { khmerGlyphDefaults } from '../lib/khmerGlyphRenderer';
import { supabase } from '../supabaseClient';

const DEFAULT_TEXT = 'ខ្មែរ';
const DEFAULT_FONT_URL = import.meta.env.VITE_KHMER_FONT_URL
  ?? '/fonts/NotoSansKhmer-VariableFont_wdth,wght.ttf';
const AUDIO_BASE_URL = import.meta.env.VITE_AUDIO_BASE_URL ?? '/sounds';
const KHMER_CHAR_PATTERN = /[\u1780-\u17ff]/;

export default function KhmerGlyphLab() {
  const [text, setText] = React.useState(DEFAULT_TEXT);
  const [selectedWord, setSelectedWord] = React.useState('');
  const [fontUrl, setFontUrl] = React.useState(DEFAULT_FONT_URL);
  const [fontFileName, setFontFileName] = React.useState('');
  const [fontSize, setFontSize] = React.useState(96);
  const [harfbuzzUrl, setHarfbuzzUrl] = React.useState(khmerGlyphDefaults.DEFAULT_MODULE_URLS.harfbuzz);
  const [opentypeUrl, setOpentypeUrl] = React.useState(khmerGlyphDefaults.DEFAULT_MODULE_URLS.opentype);
  const [renderStatus, setRenderStatus] = React.useState({ state: 'idle' });
  const [alphabetRows, setAlphabetRows] = React.useState([]);
  const [alphabetStatus, setAlphabetStatus] = React.useState({ state: 'idle' });
  const fontObjectUrlRef = React.useRef('');
  const audioRef = React.useRef(null);

  const moduleUrls = React.useMemo(
    () => ({ harfbuzz: harfbuzzUrl.trim(), opentype: opentypeUrl.trim() }),
    [harfbuzzUrl, opentypeUrl],
  );
  const alphabetById = React.useMemo(
    () => new Map(alphabetRows.map((row) => [row.id, row])),
    [alphabetRows],
  );
  const analyzedText = React.useMemo(
    () => Array.from(text).map((char, index) => ({
      char,
      index,
      isKhmer: KHMER_CHAR_PATTERN.test(char),
      data: alphabetById.get(char) ?? null,
    })),
    [text, alphabetById],
  );

  React.useEffect(() => {
    return () => {
      if (fontObjectUrlRef.current) {
        URL.revokeObjectURL(fontObjectUrlRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const fetchAlphabet = async () => {
      setAlphabetStatus({ state: 'loading' });
      const { data, error } = await supabase
        .from('alphabet')
        .select('id,name_en,type,series,frequency_rank,audio_url,description')
        .order('frequency_rank', { ascending: true });

      if (!isMounted) return;
      if (error) {
        setAlphabetStatus({ state: 'error', reason: error.message });
        setAlphabetRows([]);
        return;
      }

      setAlphabetRows(data ?? []);
      setAlphabetStatus({ state: 'ready' });
    };

    fetchAlphabet();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFontFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (fontObjectUrlRef.current) {
      URL.revokeObjectURL(fontObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    fontObjectUrlRef.current = objectUrl;
    setFontUrl(objectUrl);
    setFontFileName(file.name);
  };

  const handlePlayAudio = (audioUrl) => {
    if (!audioUrl) return;
    const sanitizedBase = AUDIO_BASE_URL.replace(/\/$/, '');
    const sanitizedFile = audioUrl.replace(/^\//, '');
    const resolvedUrl = `${sanitizedBase}/${sanitizedFile}`;

    if (!audioRef.current) {
      audioRef.current = new Audio(resolvedUrl);
    } else {
      audioRef.current.pause();
      audioRef.current.src = resolvedUrl;
    }

    audioRef.current.currentTime = 0;
    audioRef.current.play();
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-black">Khmer Glyph Lab</h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Test Khmer glyph shaping and per-category coloring using HarfBuzz + OpenType outlines.
            Provide a font URL (local or remote) and module URLs for harfbuzzjs/opentype. The preview
            renders glyphs as SVG paths.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          <div className="space-y-5">
            <label className="block text-sm font-bold uppercase tracking-widest text-cyan-400">
              Khmer text
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-gray-900 p-4 text-lg"
                placeholder="Type Khmer text here"
              />
            </label>

            <label className="block text-sm font-bold uppercase tracking-widest text-cyan-400">
              Font URL
              <input
                value={fontUrl}
                onChange={(event) => setFontUrl(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-gray-900 p-3 text-sm"
                placeholder="/fonts/NotoSansKhmer-Regular.ttf"
              />
            </label>

            <label className="block text-sm font-bold uppercase tracking-widest text-cyan-400">
              Upload font file
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleFontFileChange}
                className="mt-2 block w-full text-xs text-gray-300 file:mr-3 file:rounded-full file:border-0 file:bg-cyan-500 file:px-4 file:py-2 file:text-xs file:font-bold file:text-black hover:file:bg-cyan-400"
              />
              {fontFileName && (
                <span className="mt-2 block text-xs text-gray-400">
                  Using uploaded font: {fontFileName}
                </span>
              )}
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-bold uppercase tracking-widest text-cyan-400">
                Font size
                <input
                  type="range"
                  min={32}
                  max={160}
                  value={fontSize}
                  onChange={(event) => setFontSize(Number(event.target.value))}
                  className="mt-2 w-full"
                />
                <span className="mt-1 block text-xs text-gray-500">{fontSize}px</span>
              </label>

              <div className="rounded-2xl border border-white/10 bg-gray-900 p-4 text-xs text-gray-400">
                <p className="font-bold text-gray-200">Tips</p>
                <ul className="mt-2 space-y-1">
                  <li>• Host fonts locally to avoid CORS.</li>
                  <li>• Put harfbuzzjs.js + harfbuzzjs.wasm + opentype.module.js in public/vendor.</li>
                  <li>• Module URLs must allow dynamic import in the browser.</li>
                  <li>• Provide A/O series overrides in the renderer when ready.</li>
                </ul>
              </div>
            </div>

            <label className="block text-sm font-bold uppercase tracking-widest text-cyan-400">
              HarfBuzz module URL
              <input
                value={harfbuzzUrl}
                onChange={(event) => setHarfbuzzUrl(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-gray-900 p-3 text-sm"
                placeholder="/vendor/harfbuzzjs.js"
              />
            </label>

            <label className="block text-sm font-bold uppercase tracking-widest text-cyan-400">
              OpenType module URL
              <input
                value={opentypeUrl}
                onChange={(event) => setOpentypeUrl(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-gray-900 p-3 text-sm"
                placeholder="/vendor/opentype.module.js"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-gray-900 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Preview</h2>
              <div className="mt-4 min-h-[200px] rounded-2xl border border-white/5 bg-black/40 flex items-center justify-center p-6">
                <KhmerColoredText
                  text={text}
                  fontUrl={fontUrl}
                  fontSize={fontSize}
                  moduleUrls={moduleUrls}
                  className="text-3xl font-black"
                  onStatus={setRenderStatus}
                />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gray-900 p-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Text reader</h2>
              <div className="mt-4 rounded-2xl border border-white/5 bg-black/40 p-4">
                <KhmerWordReader
                  text={text}
                  selectedWord={selectedWord}
                  onSelectWord={setSelectedWord}
                />
              </div>
              <div className="mt-3 text-[10px] text-gray-500 uppercase tracking-widest">
                Click a word to analyze only that word.
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gray-900 p-6 text-xs text-gray-400">
              <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Word analyzer</h3>
              <div className="mt-4">
                <KhmerWordAnalyzer word={selectedWord} fontUrl={fontUrl} />
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gray-900 p-6 text-xs text-gray-400">
              <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Render status</h3>
              <div className="mt-2 space-y-2">
                <div>
                  <span className="font-bold text-gray-200">State:</span>{' '}
                  <span className="text-gray-300">{renderStatus.state}</span>
                </div>
                {renderStatus.reason && (
                  <div>
                    <span className="font-bold text-gray-200">Reason:</span>{' '}
                    <span className="text-gray-300 break-all">{renderStatus.reason}</span>
                  </div>
                )}
                {!fontUrl && (
                  <p className="text-amber-300">
                    Provide a font URL to enable SVG glyph rendering. Without it, the component falls back to plain text.
                  </p>
                )}
                {!fontUrl && (
                  <p className="text-gray-400">
                    Tip: upload a local font file above to test without hosting a font.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gray-900 p-6 text-xs text-gray-400">
              <h3 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Fallback behavior</h3>
              <p className="mt-2">
                If the SVG renderer fails (missing font/module or network restrictions), the component will
                fall back to plain text. Ensure the font URL is reachable and the module URLs can be imported
                in the browser.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-gray-900 p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-cyan-400">Text analyzer</h2>
              <p className="text-xs text-gray-400">
                Character breakdown for the current text input. Click play to hear the
                <code className="text-gray-200"> audio_url</code> when available.
              </p>
            </div>
            <div className="text-xs text-gray-400">
              Base URL: <span className="text-gray-200">{AUDIO_BASE_URL}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 text-xs text-gray-400">
            <div>
              <span className="font-bold text-gray-200">Status:</span>{' '}
              <span className="text-gray-300">{alphabetStatus.state}</span>
            </div>
            {alphabetStatus.reason && (
              <div>
                <span className="font-bold text-gray-200">Reason:</span>{' '}
                <span className="text-gray-300 break-all">{alphabetStatus.reason}</span>
              </div>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs text-gray-300">
              <thead className="text-[11px] uppercase tracking-widest text-gray-500">
                <tr>
                  <th className="py-2 pr-4">Char</th>
                  <th className="py-2 pr-4">Index</th>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Series</th>
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Audio</th>
                  <th className="py-2 pr-4">Description</th>
                </tr>
              </thead>
              <tbody>
                {analyzedText.map((entry) => (
                  <tr key={`${entry.char}-${entry.index}`} className="border-t border-white/5">
                    <td className="py-3 pr-4 text-lg text-white">
                      {entry.char === ' ' ? '␠' : entry.char}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{entry.index}</td>
                    <td className="py-3 pr-4">{entry.data?.name_en ?? '-'}</td>
                    <td className="py-3 pr-4">
                      {entry.data?.type ?? (entry.isKhmer ? 'unknown' : 'non-khmer')}
                    </td>
                    <td className="py-3 pr-4">{entry.data?.series ?? '-'}</td>
                    <td className="py-3 pr-4">{entry.data?.frequency_rank ?? '-'}</td>
                    <td className="py-3 pr-4">
                      {entry.data?.audio_url ? (
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(entry.data.audio_url)}
                          className="rounded-full bg-cyan-500 px-3 py-1 text-[11px] font-bold uppercase text-black hover:bg-cyan-400"
                        >
                          Play
                        </button>
                      ) : (
                        <span className="text-gray-500">No audio</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-400">{entry.data?.description ?? '-'}</td>
                  </tr>
                ))}
                {analyzedText.length === 0 && alphabetStatus.state === 'ready' && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-gray-500">
                      No text to analyze.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
