const KHMER_OR_CONTROL_PATTERN = /[\u1780-\u17FF\u25CC\u200C\u200D\uFEFF]/;
const CONTROL_CHARS_TO_STRIP = /[\u25CC\u200C\u200D\uFEFF]/g;

export const normalizeKhmerText = (value) => {
  if (value == null) return "";

  return String(value)
    .replace(CONTROL_CHARS_TO_STRIP, "")
    .normalize("NFC")
    .trim();
};

export const normalizeKhmerInStructure = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeKhmerInStructure);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeKhmerInStructure(nestedValue)])
    );
  }

  if (typeof value === "string") {
    return KHMER_OR_CONTROL_PATTERN.test(value) ? normalizeKhmerText(value) : value;
  }

  return value;
};
