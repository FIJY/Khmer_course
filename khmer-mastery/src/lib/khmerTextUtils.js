export const normalizeKhmerText = (value) => {
  if (value == null) return "";

  return String(value)
    .replace(/\u25CC/g, "")
    .normalize("NFC")
    .trim();
};

