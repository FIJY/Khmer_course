import React from 'react';
import KhmerColoredText from '../components/KhmerColoredText';
import { khmerGlyphDefaults } from '../lib/khmerGlyphRenderer';

const DEFAULT_TEXT = 'ខ្មែរ';

export default function KhmerGlyphLab() {
  const [text, setText] = React.useState(DEFAULT_TEXT);
  const [fontUrl, setFontUrl] = React.useState('');
  const [fontSize, setFontSize] = React.useState(96);
  const [harfbuzzUrl, setHarfbuzzUrl] = React.useState(khmerGlyphDefaults.DEFAULT_MODULE_URLS.harfbuzz);
  const [opentypeUrl, setOpentypeUrl] = React.useState(khmerGlyphDefaults.DEFAULT_MODULE_URLS.opentype);

  const moduleUrls = React.useMemo(
    () => ({ harfbuzz: harfbuzzUrl.trim(), opentype: opentypeUrl.trim() }),
    [harfbuzzUrl, opentypeUrl],
  );

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-black">Khmer Glyph Lab</h1>
          <p className="text-gray-400 text-sm max-w-2xl">
            Test Khmer glyph shaping and per-category coloring using HarfBuzz + OpenType outlines.
            Provide a font URL (local or remote) and optional module URLs if you host harfbuzzjs/opentype
            yourself. The preview renders glyphs as SVG paths.
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
                  <li>• HarfBuzz module URL must allow dynamic import.</li>
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
              />
            </label>

            <label className="block text-sm font-bold uppercase tracking-widest text-cyan-400">
              OpenType module URL
              <input
                value={opentypeUrl}
                onChange={(event) => setOpentypeUrl(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-gray-900 p-3 text-sm"
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
                />
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
      </div>
    </div>
  );
}
