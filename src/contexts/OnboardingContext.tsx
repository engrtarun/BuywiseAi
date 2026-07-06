"use client";
// ============================================================================
// BuyWise AI — Onboarding Context (v3.0)
// ============================================================================
// Global React Context providing tour state and control methods.
// Hydration-safe: reads localStorage only after client mount via useEffect.
// ============================================================================

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { TOUR_STEPS } from "@/config/tourSteps";

const STORAGE_KEY = "buywise_v3_tour_done";

interface OnboardingContextValue {
  /** Is the tour overlay currently showing? */
  isActive: boolean;
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Has the tour been completed or skipped? */
  isDone: boolean;
  /** Has the client mounted (hydration safety gate)? */
  isMounted: boolean;
  /** Begin the tour from step 0 */
  startTour: () => void;
  /** Permanently skip/dismiss the tour */
  skipTour: () => void;
  /** Advance to the next step, or finish if on the last */
  nextStep: () => void;
  /** Go back to the previous step */
  prevStep: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const autoStartFired = useRef(false);

  // ─── Hydration Safety Gate ───────────────────────────────────────────
  // Only read localStorage AFTER the client mounts to avoid SSR mismatch.
  useEffect(() => {
    setIsMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIsDone(true);
      }
    } catch {
      // localStorage may be unavailable (e.g. incognito in some browsers)
    }
  }, []);

  // ─── Auto-start tour for first-time users ────────────────────────────
  // Wait 1.5s after mount to let the UI settle (lazy components, etc.)
  useEffect(() => {
    if (!isMounted || isDone || autoStartFired.current) return;
    autoStartFired.current = true;
    const timer = setTimeout(() => {
      setIsActive(true);
      setCurrentStep(0);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isMounted, isDone]);

  // ─── Persistence helper ──────────────────────────────────────────────
  const markDone = useCallback(() => {
    setIsDone(true);
    setIsActive(false);
    setCurrentStep(0);
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // silent fail
    }
  }, []);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
  }, []);

  const skipTour = useCallback(() => {
    markDone();
  }, [markDone]);

  const nextStep = useCallback(() => {
    const next = currentStep + 1;
    if (next >= TOUR_STEPS.length) {
      // Finished all steps
      markDone();
    } else {
      setCurrentStep(next);
    }
  }, [currentStep, markDone]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        isDone,
        isMounted,
        startTour,
        skipTour,
        nextStep,
        prevStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}
