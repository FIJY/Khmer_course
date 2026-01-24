import React from 'react';

export default function UniversalTheorySlide({ data }) {
  if (!data) return null;

  return (
    <div className="w-full bg-gray-900 border border-white/10 p-8 rounded-[3.5rem] text-center space-y-4">
      {data.icon && <div className="text-5xl">{data.icon}</div>}
      {data.title && (
        <h2 className="text-2xl font-black italic uppercase text-cyan-400">{data.title}</h2>
      )}
      {data.subtitle && (
        <p className="text-sm uppercase tracking-widest text-gray-500">{data.subtitle}</p>
      )}
      {data.text && (
        <p className="text-base text-gray-300 italic">{data.text}</p>
      )}
      {data.description && (
        <p className="text-base text-gray-300">{data.description}</p>
      )}
    </div>
  );
}
