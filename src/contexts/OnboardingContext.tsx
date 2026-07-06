"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useOnboardingStatus } from "@/hooks/useOnboardingStatus";
import { tourSteps } from "@/config/tourSteps";

interface OnboardingContextType {
  isActive: boolean;
  currentStepIndex: number;
  startTour: () => void;
  nextStep: () => void;
  skipTour: () => void;
  hasCompletedTour: boolean;
  resetTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { hasCompletedTour, markTourCompleted, isInitialized, resetTour } = useOnboardingStatus();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Auto-start tour for new users once initialized
  useEffect(() => {
    if (isInitialized && !hasCompletedTour) {
      // Small delay to let the app finish rendering before starting the tour
      const timer = setTimeout(() => {
        setIsActive(true);
        setCurrentStepIndex(0);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isInitialized, hasCompletedTour]);

  const startTour = () => {
    setIsActive(true);
    setCurrentStepIndex(0);
  };

  const nextStep = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      skipTour(); // Finish tour if on last step
    }
  };

  const skipTour = () => {
    setIsActive(false);
    markTourCompleted();
  };

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStepIndex,
        startTour,
        nextStep,
        skipTour,
        hasCompletedTour,
        resetTour
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
