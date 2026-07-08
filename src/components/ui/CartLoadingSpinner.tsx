import React from "react";

export const CartLoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0C10]">
      <div className="relative flex flex-col items-center justify-center w-48 h-48">
        
        {/* Ambient Depth Background Glow */}
        <div className="absolute w-28 h-28 bg-[#D4AF37] opacity-10 rounded-full blur-3xl animate-pulse" />

        {/* Shaking Animation Group Container */}
        <div className="relative flex flex-col items-center justify-center w-full animate-cart-shake">
          
          {/* Falling Items Spawner Layer */}
          <div className="absolute -top-8 w-12 h-16 overflow-visible pointer-events-none z-20">
            {/* Item 1: Marigold Square */}
            <div className="absolute left-[25%] w-3 h-3 bg-[#D4AF37] rounded-sm shadow-sm animate-drop-merge-1 mix-blend-screen" />
            {/* Item 2: Simple White Circle */}
            <div className="absolute left-[55%] w-2.5 h-2.5 bg-white opacity-90 rounded-full shadow-sm animate-drop-merge-2" />
          </div>

          {/* Cart Icon Container with Dynamic Fill Overlay Mask */}
          <div className="relative w-16 h-16 flex items-center justify-center overflow-hidden">
            
            {/* Cart Wireframe Mask Vector Graphic */}
            <svg
              className="absolute inset-0 w-full h-full text-white opacity-90 z-10 filter drop-shadow-[0_2px_8px_rgba(212,175,55,0.1)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
              />
            </svg>

            {/* Solid Filling Dynamic Layer (Clips cleanly into the base bounds) */}
            <div className="absolute bottom-3 left-4 right-2 h-8 bg-gradient-to-t from-[#D4AF37]/40 to-[#D4AF37]/10 origin-bottom scale-y-0 animate-fill z-0 rounded-b-sm" />
          </div>
          
        </div>
      </div>

      {/* Scannable Minimalism Micro-Typography */}
      <h2 className="text-xs font-light tracking-[0.3em] text-[#D4AF37] uppercase animate-pulse select-none">
        Gathering Smart Deals
      </h2>
      <p className="mt-2 text-[10px] font-mono tracking-widest text-neutral-500 lowercase select-none">
        structuring optimized layout modules...
      </p>
    </div>
  );
};
