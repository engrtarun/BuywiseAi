import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "full";
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md" }) => {
  // Setup sizing map that fits perfectly into tiny inline indicators or full viewports
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-16 h-16",
    lg: "w-28 h-28",
    full: "w-32 h-32"
  };

  const containerContent = (
    <div className={`relative ${sizeClasses[size]} perspective-500 flex items-center justify-center`}>
      {/* Background 3D Ambient Blur Glow Element matching our marigold accent theme */}
      <div className="absolute inset-0 bg-[#D4AF37] opacity-30 rounded-full blur-xl animate-depth-glow mix-blend-screen" />
      
      {/* Outer morphing mesh ring */}
      <div className="absolute inset-0 border border-[#D4AF37]/40 animate-morph mix-blend-screen scale-110" />
      
      {/* Core Fluid 3D Core Layer */}
      <div className="absolute inset-1 bg-gradient-to-tr from-[#1A1A1A] via-[#2C2212] to-[#D4AF37]/80 animate-morph shadow-[inset_0_0_20px_rgba(212,175,55,0.3)] backdrop-blur-md" 
           style={{ animationDirection: "reverse", animationDuration: "5s" }} />
      
      {/* Innermost pulsing particle core */}
      <div className="absolute w-1/3 h-1/3 bg-[#D4AF37] rounded-full blur-[2px] animate-ping opacity-60" 
           style={{ animationDuration: "3s" }} />
    </div>
  );

  // If size parameters equal 'full', render as a beautifully centered fullscreen layout
  if (size === "full") {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0B0C10]">
        {containerContent}
        <span className="mt-6 text-sm tracking-[0.2em] font-medium text-[#D4AF37]/70 uppercase animate-pulse">
          Analyzing Options...
        </span>
      </div>
    );
  }

  return containerContent;
};
