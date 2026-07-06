"use client";

import { useState, useEffect } from "react";

const ONBOARDING_KEY = "buywise_tour_completed";

export function useOnboardingStatus() {
  const [hasCompletedTour, setHasCompletedTour] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ONBOARDING_KEY);
      if (stored === "true") {
        setHasCompletedTour(true);
      } else {
        setHasCompletedTour(false);
      }
    } catch (e) {
      console.warn("Failed to access localStorage for onboarding status", e);
      setHasCompletedTour(true); // default to true if localStorage fails to avoid annoying users
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const markTourCompleted = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, "true");
      setHasCompletedTour(true);
    } catch (e) {
      console.warn("Failed to set localStorage for onboarding status", e);
    }
  };

  const resetTour = () => {
    try {
      localStorage.removeItem(ONBOARDING_KEY);
      setHasCompletedTour(false);
    } catch (e) {
      console.warn("Failed to clear localStorage for onboarding status", e);
    }
  }

  return { hasCompletedTour, markTourCompleted, isInitialized, resetTour };
}
