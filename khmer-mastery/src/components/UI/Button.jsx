import React from "react";
import { Loader } from "lucide-react";

export default function Button({
  children,
  onClick,
  disabled,
  loading,
  variant = "primary",
  className = "",
}) {
  const baseStyle =
    "w-full py-6 rounded-2xl font-black uppercase tracking-widest " +
    "flex items-center justify-center gap-3 " +
    "transition-all duration-200 " +
    "active:scale-[0.985] active:translate-y-[1px] " +
    "disabled:opacity-50 disabled:cursor-not-allowed " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

  // Материальность: border + “подошва” + мягкая тень вместо неона
  const variants = {
    primary:
      "bg-cyan-500 text-black " +
      "border border-white/10 " +
      "shadow-[0_12px_30px_-18px_rgba(0,0,0,0.85)] " +
      "hover:bg-cyan-400 " +
      "hover:shadow-[0_16px_38px_-22px_rgba(0,0,0,0.9)] " +
      "active:shadow-[0_8px_18px_-14px_rgba(0,0,0,0.9)]",

    secondary:
      "bg-white text-black border border-black/10 " +
      "shadow-[0_10px_24px_-18px_rgba(0,0,0,0.6)] " +
      "hover:bg-gray-200",

    outline:
      "bg-transparent border border-white/20 text-white " +
      "hover:bg-white/5 " +
      "shadow-[0_10px_22px_-18px_rgba(0,0,0,0.65)]",

    danger:
      "bg-red-500/10 text-red-300 border border-red-500/25 " +
      "hover:bg-red-500 hover:text-white " +
      "shadow-[0_10px_22px_-18px_rgba(0,0,0,0.65)]",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant] || variants.primary} ${className}`}
    >
      {loading ? <Loader className="animate-spin" /> : children}
    </button>
  );
}
