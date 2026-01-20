import React from 'react';

function splitText(text) {
  return text.split(/(\s+)/).filter((segment) => segment.length > 0);
}

export default function KhmerWordReader({ text, selectedWord, onSelectWord }) {
  const segments = React.useMemo(() => splitText(text), [text]);

  return (
    <p className="text-base leading-relaxed text-white">
      {segments.map((segment, index) => {
        const isSpace = /^\s+$/.test(segment);
        if (isSpace) {
          return <span key={`space-${index}`}>{segment}</span>;
        }

        const isSelected = segment === selectedWord;
        return (
          <button
            type="button"
            key={`word-${index}`}
            onClick={() => onSelectWord(segment)}
            className={`px-0.5 rounded transition-colors ${
              isSelected ? 'text-cyan-400' : 'text-white hover:text-cyan-300'
            }`}
          >
            {segment}
          </button>
        );
      })}
    </p>
  );
}
