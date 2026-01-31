import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Map as MapIcon, BrainCircuit, BookText, User } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation(); // Узнаем текущий путь

  // Конфигурация кнопок
  const tabs = [
    { path: '/map', label: 'Map', icon: MapIcon },
    { path: '/review', label: 'Review', icon: BrainCircuit },
    { path: '/vocab', label: 'Vocab', icon: BookText },
    { path: '/profile', label: 'Me', icon: User },
  ];

  return (
    // sticky bottom-0 позволяет меню "прилипать" к низу внутри контейнера
    <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-xl border-t border-white/5 px-6 pt-3 pb-6 flex justify-between items-center z-50">
      {tabs.map((tab) => {
        // Проверяем, активна ли вкладка (например, если мы на /map)
        const isActive = location.pathname.startsWith(tab.path);

        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex flex-col items-center gap-1.5 active:scale-95 transition-transform w-1/4 group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-950
              ${isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-white'}`}
          >
            <span
              className={`absolute -top-1 h-1 w-6 rounded-full transition-all ${
                isActive ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]' : 'bg-transparent'
              }`}
            />
            <tab.icon size={24} className={`transition-all ${isActive ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
