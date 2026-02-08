import { useCallback, useRef } from 'react';

const DEFAULT_SOUNDS_BASE = '/sounds';
const DEFAULT_SEQUENCE_GAP_MS = 0;
const FEEDBACK_VOLUME = 0.5;

const resolveAudioSource = (audioFile, baseUrl = DEFAULT_SOUNDS_BASE) => {
  if (!audioFile) return null;
  const raw = String(audioFile).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/')) return raw;

  if (/\.mp3$/i.test(raw)) {
    return `${baseUrl}/${raw.replace(/^\//, '')}`;
  }

  const trimmed = raw.replace(/(\.mp3)+$/i, '');
  return `${baseUrl}/${trimmed}.mp3`;
};

export default function useAudioPlayer(baseUrl = DEFAULT_SOUNDS_BASE) {
  const audioRef = useRef(null);
  const timeoutRef = useRef(null);

  const stop = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  const play = useCallback(
    (audioFile) => {
      const src = resolveAudioSource(audioFile, baseUrl);
      if (!src) return null;
      stop();
      const audio = new Audio(src);
      if (/\/(success|error)\.mp3$/i.test(src)) {
        audio.volume = FEEDBACK_VOLUME;
      }
      audioRef.current = audio;
      audio.play().catch((error) => {
        console.error(`Audio failed: ${src}`, error);
      });
      return audio;
    },
    [baseUrl, stop]
  );

  const playSequence = useCallback(
    (audioFiles, { gapMs = DEFAULT_SEQUENCE_GAP_MS, onComplete } = {}) => {
      const files = Array.isArray(audioFiles) ? audioFiles.filter(Boolean) : [];
      if (files.length === 0) return;
      stop();
      let index = 0;

      const playNext = () => {
        const src = resolveAudioSource(files[index], baseUrl);
        if (!src) {
          index += 1;
          if (index < files.length) playNext();
          if (index >= files.length && onComplete) onComplete();
          return;
        }
        const audio = new Audio(src);
        if (/\/(success|error)\.mp3$/i.test(src)) {
          audio.volume = FEEDBACK_VOLUME;
        }
        audioRef.current = audio;
        audio.onended = () => {
          index += 1;
          if (index < files.length) {
            if (gapMs > 0) {
              timeoutRef.current = setTimeout(playNext, gapMs);
            } else {
              playNext();
            }
          } else if (onComplete) {
            onComplete();
          }
        };
        audio.play().catch((error) => {
          console.error(`Audio failed: ${src}`, error);
        });
      };

      playNext();
    },
    [baseUrl, stop]
  );

  return {
    play,
    playSequence,
    stop,
    resolveAudioSource: (audioFile) => resolveAudioSource(audioFile, baseUrl)
  };
}
