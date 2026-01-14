import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { User, Trophy, Zap, Target, Flame, Trash2, LogOut } from 'lucide-react';
// Импортируем наши новые компоненты
import MobileLayout from '../components/Layout/MobileLayout';
import Button from '../components/UI/Button';

export default function Profile() {
  const navigate = useNavigate();
  // ... (твоя логика state и fetchProfileData остается без изменений) ...

  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  return (
    // 1. Используем Layout. Он сам добавит черные поля, центрирование и Нижнее Меню!
    <MobileLayout>

      {/* HEADER */}
      <div className="p-6 pt-10 bg-gradient-to-b from-gray-900 to-black border-b border-white/5">
        <div className="flex items-center gap-5">
           {/* ... код аватара ... */}
        </div>
      </div>

      <div className="p-6 space-y-6 pb-32"> {/* pb-32 чтобы контент не залез под меню */}

        {/* STATS GRID - тут код не меняем, это уникально для профиля */}
        <div className="grid grid-cols-2 gap-3">
           {/* ... карточки статистики ... */}
        </div>

        {/* SETTINGS AREA - используем наш Button */}
        <div className="pt-4 space-y-3">
          <Button variant="danger" onClick={handleResetProgress}>
             <Trash2 size={18} /> Reset All Progress
          </Button>

          <Button variant="outline" onClick={handleLogout}>
             <LogOut size={18} /> Sign Out
          </Button>
        </div>

        <div className="pt-8 text-center pb-4">
          <p className="text-[9px] text-gray-800 font-black uppercase tracking-[0.3em]">Khmer Mastery 2026</p>
        </div>
      </div>

      {/* НИЖНЕЕ МЕНЮ БОЛЬШЕ НЕ НУЖНО ПИСАТЬ ЗДЕСЬ, ОНО В MOBILE LAYOUT! */}

    </MobileLayout>
  );
}