import React, { useState } from 'react';
import shapedData from '../data/shaped-text.json';

// === ПОЛНЫЙ СЛОВАРЬ ЗВУКОВ ===
const AUDIO_MAP = {
  // --- Согласные ---
  "ក": "letter_ka.mp3", "ខ": "letter_kha.mp3", "គ": "letter_ko.mp3", "ឃ": "letter_kho.mp3", "ង": "letter_ngo.mp3",
  "ច": "letter_cha.mp3", "ឆ": "letter_chha.mp3", "ជ": "letter_cho.mp3", "ឈ": "letter_chho.mp3", "ញ": "letter_nyo.mp3",
  "ដ": "letter_da.mp3", "ឋ": "letter_tha_retro.mp3", "ឌ": "letter_do.mp3", "ឍ": "letter_tho_retro.mp3", "ណ": "letter_na.mp3",
  "ត": "letter_ta.mp3", "ថ": "letter_tha.mp3", "ទ": "letter_to.mp3", "ធ": "letter_tho.mp3", "ន": "letter_no.mp3",
  "ប": "letter_ba.mp3", "ផ": "letter_pha.mp3", "ព": "letter_po.mp3", "ភ": "letter_pho.mp3", "ម": "letter_mo.mp3",
  "យ": "letter_yo.mp3", "រ": "letter_ro.mp3", "ល": "letter_lo.mp3", "វ": "letter_vo.mp3",
  "ស": "letter_sa.mp3", "ហ": "letter_ha.mp3", "ឡ": "letter_la.mp3", "អ": "letter_qa.mp3",

  // --- Гласные (Sra ...) ---
  "ា": "vowel_aa.mp3", "ិ": "vowel_i.mp3", "ី": "vowel_ei.mp3", "ឹ": "vowel_oe.mp3",
  "ឺ": "vowel_oeu.mp3", "ុ": "vowel_u.mp3", "ូ": "vowel_oo.mp3", "ួ": "vowel_ua.mp3",
  "ើ": "vowel_aeu.mp3", "ឿ": "vowel_oea.mp3", "ៀ": "vowel_ie.mp3", "េ": "vowel_e.mp3",
  "ែ": "vowel_ae.mp3", "ៃ": "vowel_ai.mp3", "ោ": "vowel_ao.mp3", "ៅ": "vowel_au.mp3",
  "ុំ": "vowel_om.mp3", "ំ": "vowel_am.mp3", "ាំ": "vowel_aam.mp3", "ះ": "vowel_ah.mp3",
  "ុះ": "vowel_oh.mp3", "េះ": "vowel_eh.mp3", "ោះ": "vowel_oh_short.mp3",

  // --- Независимые гласные ---
  "ឥ": "indep_e.mp3", "ឦ": "indep_ei.mp3", "ឧ": "indep_o.mp3", "ឨ": "indep_ok.mp3",
  "ឪ": "indep_au.mp3", "ឫ": "indep_rue.mp3", "ឬ": "indep_rue_long.mp3", "ឭ": "indep_lue.mp3",
  "ឮ": "indep_lue_long.mp3", "ឯ": "indep_ae.mp3", "ឱ": "indep_ao.mp3", "ឳ": "indep_au_ra.mp3"
};

export default function VisualDecoder({ data, onLetterClick, onComplete }) {
  const text = data?.word || data?.khmerText || "កាហ្វេ";
  const glyphs = shapedData[text];
  const [selectedId, setSelectedId] = useState(null);

  if (!glyphs) return null;

  const allX = glyphs.map(g => g.bb.x2);
  const width = Math.max(...allX) + 50;

  return (
    <div className="w-full flex justify-center items-center py-8 animate-in fade-in zoom-in duration-500">
      <svg
         viewBox={`0 -80 ${width} 300`}
         className="max-h-[250px] w-full overflow-visible select-none"
         style={{ touchAction: 'manipulation' }}
      >
        {glyphs.map((glyph, i) => {
           const isSelected = selectedId === i;
           return (
            <g
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(i);

                const soundFile = AUDIO_MAP[glyph.char];

                if (onLetterClick && soundFile) {
                    onLetterClick(soundFile);
                }

                if (onComplete) onComplete();
              }}
              className="cursor-pointer group"
            >
              <path d={glyph.d} stroke="transparent" strokeWidth="20" fill="none" />
              <path
                d={glyph.d}
                fill={isSelected ? "#22d3ee" : "white"}
                className="transition-all duration-300 ease-out"
                style={{
                   filter: isSelected
                     ? "drop-shadow(0 0 15px #22d3ee) drop-shadow(0 0 30px #22d3ee)"
                     : "drop-shadow(0 4px 6px rgba(0,0,0,0.5))"
                }}
              />
            </g>
           );
        })}
      </svg>
    </div>
  );
}