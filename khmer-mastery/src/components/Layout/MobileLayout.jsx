import React from 'react';
import BottomNav from './BottomNav'; // Импортируем только соседа по папке

export default function MobileLayout({ children, withNav = true, className = "" }) {
  return (
    <div className="min-h-screen bg-black flex justify-center font-sans overflow-hidden">
      <div className={`w-full max-w-md bg-black min-h-screen flex flex-col relative border-x border-white/5 shadow-2xl ${className}`}>

        {/* Контент с отступом снизу под меню */}
        <div className={`flex-1 flex flex-col ${withNav ? 'pb-24' : ''}`}>
          {children}
        </div>

        {/* Навигация */}
        {withNav && <BottomNav />}
      </div>
    </div>
  );
}