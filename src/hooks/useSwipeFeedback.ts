"use client";

import { useEffect, useRef, useCallback } from "react";

// Replace these placeholder files with final designed sound assets at
// /public/sounds/accept.wav and /public/sounds/reject.wav
const ACCEPT_SOUND_PATH = "/sounds/accept.wav";
const REJECT_SOUND_PATH = "/sounds/reject.wav";

export function useSwipeFeedback() {
  const acceptAudioRef = useRef<HTMLAudioElement | null>(null);
  const rejectAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Preload audio objects on mount
    if (typeof window !== "undefined") {
      const acceptAudio = new Audio(ACCEPT_SOUND_PATH);
      acceptAudio.volume = 0.5;
      acceptAudioRef.current = acceptAudio;

      const rejectAudio = new Audio(REJECT_SOUND_PATH);
      rejectAudio.volume = 0.5;
      rejectAudioRef.current = rejectAudio;
    }
  }, []);

  const playAccept = useCallback(() => {
    // Check if muted in localStorage
    const isMuted = localStorage.getItem("buywise_muted") === "true";
    if (isMuted) return;

    // Haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch (e) {
        // Silently fail if unsupported
      }
    }

    // Audio playback
    if (acceptAudioRef.current) {
      try {
        acceptAudioRef.current.currentTime = 0;
        const playPromise = acceptAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Silently fail if browser blocks autoplay
          });
        }
      } catch (e) {
        // Silently fail
      }
    }
  }, []);

  const playReject = useCallback(() => {
    // Check if muted in localStorage
    const isMuted = localStorage.getItem("buywise_muted") === "true";
    if (isMuted) return;

    // Haptic feedback
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(10);
      } catch (e) {
        // Silently fail if unsupported
      }
    }

    // Audio playback
    if (rejectAudioRef.current) {
      try {
        rejectAudioRef.current.currentTime = 0;
        const playPromise = rejectAudioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Silently fail if browser blocks autoplay
          });
        }
      } catch (e) {
        // Silently fail
      }
    }
  }, []);

  return { playAccept, playReject };
}
