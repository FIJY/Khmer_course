const DEFAULT_SHAPE_API_BASE = "https://khmer-course.onrender.com";

export const SHAPE_API_BASE =
  import.meta.env.VITE_SHAPE_API_URL || DEFAULT_SHAPE_API_BASE;

export const buildShapeApiUrl = (path = "") => {
  const normalizedBase = SHAPE_API_BASE.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
};
