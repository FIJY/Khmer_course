import React from 'react';
import { fetchAlphabetMeta } from '../data/alphabet';
import { tokenizeKhmerWord } from '../lib/khmerTokenizer';
import { useFontFace } from '../hooks/useFontFace';

const TOKEN_COLORS = {
  CONSONANT_A: '#ffb020',
  CONSONANT_O: '#6b5cff',
  SUBSCRIPT: '#6a7b9c',
  VOWEL_DEP: '#ff4081',
  VOWEL_IND: '#ffd54a',
  DIACRITIC: '#ffffff',
  NUMERAL: '#38d6d6',
  PUNCT: '#6a7b9c',
  OTHER: '#ffffff',
  LATIN: '#ffffff',
};

function getTokenColor(token, meta) {
  if (token.type === 'CONSONANT') {
    if (meta?.series === 1) return TOKEN_COLORS.CONSONANT_A;
    if (meta?.series === 2) return TOKEN_COLORS.CONSONANT_O;
    return TOKEN_COLORS.CONSONANT_O;
  }
  if (token.type === 'SUBSCRIPT') return TOKEN_COLORS.SUBSCRIPT;
  if (token.type === 'VOWEL_DEP') return TOKEN_COLORS.VOWEL_DEP;
  if (token.type === 'VOWEL_IND') return TOKEN_COLORS.VOWEL_IND;
  if (token.type === 'DIACRITIC') return TOKEN_COLORS.DIACRITIC;
  if (token.type === 'NUMERAL') return TOKEN_COLORS.NUMERAL;
  if (token.type === 'PUNCT') return TOKEN_COLORS.PUNCT;
  return TOKEN_COLORS.OTHER;
}

export default function KhmerWordAnalyzer({ word, fontUrl }) {
  const [tokens, setTokens] = React.useState([]);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [metaMap, setMetaMap] = React.useState({});
  const fallbackFontFamily = useFontFace(fontUrl);

  React.useEffect(() => {
    const nextTokens = word ? tokenizeKhmerWord(word) : [];
    setTokens(nextTokens);
    setSelectedIndex(0);
  }, [word]);

  React.useEffect(() => {
    let active = true;
    const consonants = Array.from(
      new Set(
        tokens
          .filter((token) => token.type === 'CONSONANT' || token.type === 'SUBSCRIPT')
          .map((token) => token.base ?? token.text),
      ),
    );

    if (!consonants.length) {
      setMetaMap({});
      return () => {
        active = false;
      };
    }

    fetchAlphabetMeta(consonants)
      .then((data) => {
        if (!active) return;
        const map = {};
        data.forEach((entry) => {
          map[entry.id] = entry;
        });
        setMetaMap(map);
      })
      .catch(() => {
        if (!active) return;
        setMetaMap({});
      });

    return () => {
      active = false;
    };
  }, [tokens]);

  if (!word) {
    return (
      <div className="text-xs text-gray-500">
        Click a word in the reader to analyze its glyph groups.
      </div>
    );
  }

  const selectedToken = tokens[selectedIndex];
  const selectedMeta = selectedToken?.base ? metaMap[selectedToken.base] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tokens.map((token, index) => {
          const meta = token.base ? metaMap[token.base] : null;
          const color = getTokenColor(token, meta);
          const isActive = index === selectedIndex;
          return (
            <button
              type="button"
              key={`${token.text}-${index}`}
              onClick={() => setSelectedIndex(index)}
              className={`px-3 py-2 rounded-full border text-lg font-semibold transition ${
                isActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/10 bg-black/30'
              }`}
              style={{
                color,
                fontFamily: fallbackFontFamily ? `"${fallbackFontFamily}", sans-serif` : undefined,
              }}
            >
              {token.text}
            </button>
          );
        })}
      </div>

      {selectedToken ? (
        <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs text-gray-300 space-y-2">
          <div>
            <span className="text-gray-500 uppercase tracking-widest text-[10px]">Token</span>
            <div className="text-sm text-white font-semibold">{selectedToken.text}</div>
          </div>
          <div>
            <span className="text-gray-500 uppercase tracking-widest text-[10px]">Type</span>
            <div className="text-sm text-white font-semibold">{selectedToken.type}</div>
          </div>
          {selectedMeta && (
            <>
              <div>
                <span className="text-gray-500 uppercase tracking-widest text-[10px]">Name</span>
                <div className="text-sm text-white font-semibold">{selectedMeta.name_en ?? '—'}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-gray-500 uppercase tracking-widest text-[10px]">Series</span>
                  <div className="text-sm text-white font-semibold">{selectedMeta.series ?? '—'}</div>
                </div>
                <div>
                  <span className="text-gray-500 uppercase tracking-widest text-[10px]">Shape group</span>
                  <div className="text-sm text-white font-semibold">{selectedMeta.shape_group ?? '—'}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 uppercase tracking-widest text-[10px]">Subscript form</span>
                  <div className="text-sm text-white font-semibold">{selectedMeta.subscript_form ?? '—'}</div>
                </div>
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
