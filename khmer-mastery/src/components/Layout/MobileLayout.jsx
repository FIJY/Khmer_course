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
    <div className="h-screen bg-black flex justify-center font-sans overflow-hidden">

      {/* Mobile frame with fixed height */}
      <div className={`w-full max-w-md bg-black h-full flex flex-col relative border-x border-white/5 shadow-2xl ${className}`}>

        {/* Scrollable area occupies remaining space */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${contentClassName}`}>
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
