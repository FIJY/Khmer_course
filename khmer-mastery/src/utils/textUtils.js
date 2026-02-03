export const KHMER_PATTERN = /[\u1780-\u17FF]/;

export const containsKhmer = (text) => KHMER_PATTERN.test(text ?? '');

export const getCardSides = (front, back) => {
  const frontText = front ?? '';
  const backText = back ?? '';
  const frontHasKhmer = containsKhmer(frontText);
  const backHasKhmer = containsKhmer(backText);
  const englishText = frontHasKhmer && !backHasKhmer ? backText : frontText;
  const khmerText = frontHasKhmer && !backHasKhmer ? frontText : backText;
  return { englishText, khmerText };
};
