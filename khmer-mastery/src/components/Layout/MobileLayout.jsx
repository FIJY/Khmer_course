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
    <div className="h-screen bg-[radial-gradient(900px_600px_at_50%_-200px,rgba(56,189,248,0.22),transparent),radial-gradient(700px_500px_at_50%_120%,rgba(14,116,144,0.18),transparent),linear-gradient(to_bottom,#020617,#000)] flex justify-center font-sans overflow-visible text-white">

      {/* Mobile frame with fixed height */}
      <div
        className={`w-full max-w-md bg-black/80 h-full flex flex-col relative border border-white/10 ring-1 ring-white/5 shadow-[0_30px_80px_-35px_rgba(8,145,178,0.4)] overflow-hidden sm:my-6 sm:rounded-[2.75rem] ${className}`}
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
