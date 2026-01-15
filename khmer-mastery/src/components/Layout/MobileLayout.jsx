import React from 'react';
import BottomNav from './BottomNav';

export default function MobileLayout({
  children,
  withNav = true,
  className = "",
  contentClassName = "",
  footer = null
}) {
  return (
    // Внешний контейнер на всю высоту экрана
    <div className="h-screen bg-black flex justify-center font-sans overflow-hidden">

      {/* Мобильный фрейм с фиксированной высотой */}
      <div className={`w-full max-w-md bg-black h-full flex flex-col relative border-x border-white/5 shadow-2xl ${className}`}>

        {/* ПРОКРУЧИВАЕМАЯ ОБЛАСТЬ: flex-1 заставляет её занять всё свободное место */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${contentClassName}`}>
          {children}
        </div>

        {/* ФИКСИРОВАННЫЙ ФУТЕР (кнопки/квизы) */}
        {footer && (
          <div className="flex-shrink-0">
            {footer}
          </div>
        )}

        {/* ФИКСИРОВАННОЕ МЕНЮ: Всегда внизу фрейма */}
        {withNav && (
          <div className="flex-shrink-0">
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
