export const normalizeQuizOption = (option) => {
  if (option && typeof option === 'object') {
    const value = option.value ?? option.text ?? option.answer ?? option.label ?? '';
    return {
      value: String(value).trim(),
      text: option.text ?? option.label ?? option.value ?? option.answer ?? '',
      audio: option.audio ?? null,
      pronunciation: option.pronunciation ?? ''
    };
  }
  const value = option ?? '';
  return {
    value: String(value).trim(),
    text: String(value),
    audio: null,
    pronunciation: ''
  };
};

export const normalizeQuizData = (itemContent, shuffleFn) => {
  const options = Array.isArray(itemContent.options) ? itemContent.options.filter(Boolean) : [];
  const correctAnswer = itemContent.correct_answer;
  const normalizedOptions = options.map(normalizeQuizOption);
  const normalizedCorrect = correctAnswer ? normalizeQuizOption(correctAnswer) : null;
  const mergedOptions = normalizedCorrect
    ? [...normalizedOptions, normalizedCorrect]
    : normalizedOptions;
  const uniqueOptionsMap = new Map();
  mergedOptions.forEach((option) => {
    if (!uniqueOptionsMap.has(option.value)) {
      uniqueOptionsMap.set(option.value, option);
    }
  });
  const uniqueOptions = Array.from(uniqueOptionsMap.values());
  const shuffledOptions = typeof shuffleFn === 'function' ? shuffleFn(uniqueOptions) : uniqueOptions;
  return {
    options: shuffledOptions,
    correct_answer: normalizedCorrect?.value ?? normalizedCorrect?.text ?? ''
  };
};

export const resolveQuizOptionValue = (option) => {
  if (option && typeof option === 'object') {
    return option.value ?? option.text ?? option.answer ?? option.label ?? '';
  }
  return option ?? '';
};
