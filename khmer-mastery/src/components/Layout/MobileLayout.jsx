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
    // Outer container fills the viewport
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-black to-black flex justify-center font-sans overflow-visible text-white">

      {/* Mobile frame with fixed height */}
      <div
        className={`w-full max-w-md bg-black/90 h-full flex flex-col relative border border-white/5 shadow-[0_25px_60px_-30px_rgba(0,0,0,0.8)] overflow-hidden sm:my-6 sm:rounded-[2.5rem] ${className}`}
      >

        {/* Scrollable area occupies remaining space */}
        <div className={`flex-1 overflow-y-auto overflow-x-visible custom-scrollbar scroll-smooth ${contentClassName}`}>
          {children}
        </div>

        {/* Fixed footer (buttons/quiz actions) */}
        {footer && (
          <div className="flex-shrink-0">
            {footer}
          </div>
        )}

        {/* Fixed bottom navigation */}
        {withNav && (
          <div className="flex-shrink-0">
            <BottomNav />
          </div>
        )}
      </div>
    </div>
  );
}
