import React from "react";
import AudioGuessSlide from "../components/LessonSlides/AudioGuessSlide";

const sampleSlide = {
  title: "Who is this?",
  subtitle: "Listen and tap the glyph.",
  mode: "letter",
  audio: "letter_ka.mp3",
  prompt_repeat: true,
  correct: {
    glyph: "ក",
    label: "ka",
    ipa: "kɑː",
    roman: "ka"
  },
  choices: [
    { glyph: "ក", label: "ka" },
    { glyph: "ខ", label: "kha" },
    { glyph: "គ", label: "ko" },
    { glyph: "ង", label: "ng" }
  ],
  attempts: 2,
  reveal_on_fail: true,
  auto_play_on_enter: false,
  min_choices: 2,
  max_choices: 4
};

export default function AudioGuessDebug() {
  const playLocalAudio = (audioFile) => {
    if (!audioFile) return;
    const fileName = String(audioFile).trim().replace(/(\\.mp3)+$/i, "");
    const audioPath = `/sounds/${fileName}.mp3`;
    const audio = new Audio(audioPath);
    audio.play().catch((e) => console.error(`Audio failed: ${audioPath}`, e));
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <AudioGuessSlide data={sampleSlide} onPlayAudio={playLocalAudio} />
    </div>
  );
}
