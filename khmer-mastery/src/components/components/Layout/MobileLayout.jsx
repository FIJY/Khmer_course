import React from 'react';
import BottomNav from './BottomNav'; // Создадим ниже

export default function MobileLayout({ children, withNav = true, className = "" }) {
  return (
    // Внешняя обертка (центрирование на десктопе)
    <div className="min-h-screen bg-black flex justify-center font-sans overflow-hidden">

      {/* Внутренний "мобильный" контейнер */}
      <div className={`w-full max-w-md bg-black min-h-screen flex flex-col relative border-x border-white/5 shadow-2xl ${className}`}>

        {/* Основной контент (растягивается) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Навигация (показываем только если нужно) */}
        {withNav && <BottomNav />}
      </div>
    </div>
  );
}