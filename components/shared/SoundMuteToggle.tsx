"use client";

import React, { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

export function SoundMuteToggle() {
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Default to unmuted, or read from localStorage
      const muted = localStorage.getItem("buywise_muted") === "true";
      setIsMuted(muted);
    }
  }, []);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("buywise_muted", String(newState));
    }
  };

  return (
    <button
      onClick={toggleMute}
      className="flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 text-text-secondary hover:text-text-primary-light hover:bg-white/10 transition-all"
      aria-label={isMuted ? "Unmute sounds" : "Mute sounds"}
      title={isMuted ? "Unmute sounds" : "Mute sounds"}
    >
      {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
    </button>
  );
}
