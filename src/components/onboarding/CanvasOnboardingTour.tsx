"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { tourSteps } from "@/config/tourSteps";
import { CoachMarkTooltip } from "./CoachMarkTooltip";

export function CanvasOnboardingTour() {
  const { isActive, currentStepIndex, nextStep, skipTour } = useOnboarding();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting for Portals
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updateTargetRect = useCallback(() => {
    if (!isActive) return;

    const currentStep = tourSteps[currentStepIndex];
    if (!currentStep) {
      setTargetRect(null);
      skipTour(); // fail-safe
      return;
    }

    const targetElement = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
    
    if (targetElement) {
      // Small delay to ensure any CSS transitions on the target have completed
      setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
      }, 50);
    } else {
      setTargetRect(null);
      // If the target element isn't found and it's optional, skip it.
      if (currentStep.isOptional) {
        nextStep();
      } else {
        // If it's required but missing, retry a few times before failing
        let retries = 0;
        const interval = setInterval(() => {
          const retryTarget = document.querySelector(`[data-tour-id="${currentStep.targetId}"]`);
          if (retryTarget) {
            setTargetRect(retryTarget.getBoundingClientRect());
            clearInterval(interval);
          } else if (retries >= 5) {
            clearInterval(interval);
            // Skip the step if it never appears
            nextStep();
          }
          retries++;
        }, 200);
      }
    }
  }, [isActive, currentStepIndex, nextStep, skipTour]);

  useEffect(() => {
    updateTargetRect();
    
    // Update positioning on resize or scroll
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);

    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [updateTargetRect]);

  if (!mounted || !isActive || !targetRect) return null;

  const currentStep = tourSteps[currentStepIndex];
  const isLastStep = currentStepIndex === tourSteps.length - 1;

  // Render using portal to ensure it stays above everything else
  return createPortal(
    <CoachMarkTooltip
      step={currentStep}
      targetRect={targetRect}
      onNext={nextStep}
      onSkip={skipTour}
      isLastStep={isLastStep}
      stepIndex={currentStepIndex}
      totalSteps={tourSteps.length}
    />,
    document.body
  );
}
