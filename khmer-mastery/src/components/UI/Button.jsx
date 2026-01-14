import React from 'react';
import { Loader } from 'lucide-react';

export default function Button({ children, onClick, disabled, loading, variant = 'primary', className = "" }) {

  const baseStyle = "w-full py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.3)]",
    secondary: "bg-white text-black hover:bg-gray-200",
    outline: "bg-transparent border border-white/20 text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {loading ? <Loader className="animate-spin" /> : children}
    </button>
  );
}