"use client";

import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function SoundMuteToggle({ showTooltip = false }: { showTooltip?: boolean }) {
  const [isMuted, setIsMuted] = useState(true);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const dismissTooltip = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("buywise_sound_tooltip_shown", "true");
    }
    setTooltipVisible(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Default to muted if not set in localStorage
      const mutedStr = localStorage.getItem("buywise_muted");
      const muted = mutedStr === null ? true : mutedStr === "true";
      setIsMuted(muted);

      if (showTooltip) {
        const tooltipShown = localStorage.getItem("buywise_sound_tooltip_shown");
        if (!tooltipShown) {
          const timer = setTimeout(() => {
            setTooltipVisible(true);
          }, 1000);
          
          const dismissTimer = setTimeout(() => {
            dismissTooltip();
          }, 6000);
          
          return () => {
            clearTimeout(timer);
            clearTimeout(dismissTimer);
          };
        }
      }
    }
  }, [showTooltip]);


  const toggleMute = () => {
    if (tooltipVisible) {
      dismissTooltip();
    }
    const newState = !isMuted;
    setIsMuted(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("buywise_muted", String(newState));
    }
  };

  useEffect(() => {
    if (tooltipVisible) {
      const handleClickOutside = () => {
        dismissTooltip();
      };
      // Add slight delay before listening to clicks so we don't catch the current event
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }, 100);
      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
  }, [tooltipVisible]);

  return (
    <div className="relative inline-flex items-center justify-center">
      <button
        onClick={toggleMute}
        className="flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-all z-10 relative"
        aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
        title={isMuted ? "Unmute sounds" : "Mute sounds"}
      >
        {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
      </button>

      {showTooltip && tooltipVisible && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-max z-50 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative bg-bg-input/95 backdrop-blur-md border border-marigold/30 shadow-lg shadow-marigold/10 rounded-full py-1.5 px-3 flex items-center justify-center">
            <span className="text-[13px] font-sans text-marigold whitespace-nowrap font-medium tracking-wide">
              🔊 You can turn on sound here
            </span>
            {/* Pointer Arrow */}
            <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-bg-input border-b border-r border-marigold/30 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}
