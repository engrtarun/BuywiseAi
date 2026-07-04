"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { SpotlightOverlay } from "./SpotlightOverlay";
import { CoachMarkTooltip } from "./CoachMarkTooltip";

interface CanvasOnboardingTourProps {
  canvasItemsCount: number;
  isRating: boolean;
  matchData: any;
  onComplete: () => void;
  isActive: boolean;
}

export function CanvasOnboardingTour({
  canvasItemsCount,
  isRating,
  matchData,
  onComplete,
  isActive
}: CanvasOnboardingTourProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  useEffect(() => {
    if (!isActive) return;

    if (step === 2 && canvasItemsCount >= 1) {
      setStep(3);
    }
    
    if (step === 3 && canvasItemsCount >= 2) {
      setStep(4);
    }
    
    if (step === 4 && matchData) {
      setStep(5);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFB067', '#0A5C5A', '#FFFFFF']
      });
    }
  }, [isActive, step, canvasItemsCount, isRating, matchData]);

  if (!isActive) return null;

  const handleSkip = () => {
    onComplete();
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <>
            <SpotlightOverlay targetId="onboarding-source-panel" padding={10} />
            <CoachMarkTooltip
              targetId="onboarding-source-panel"
              step={1}
              totalSteps={totalSteps}
              text="These are your saved wardrobe items. Let's build an outfit!"
              onNext={() => setStep(2)}
              onSkip={handleSkip}
            />
          </>
        );
      case 2:
        return (
          <>
            <SpotlightOverlay targetId="onboarding-source-item-0" padding={5} showDragHint={true} />
            <CoachMarkTooltip
              targetId="onboarding-source-item-0"
              step={2}
              totalSteps={totalSteps}
              text="Try dragging this item onto the canvas."
              onSkip={handleSkip}
            />
          </>
        );
      case 3:
        return (
          <>
            {/* Index 0 again because the previous index 0 was removed from source items */}
            <SpotlightOverlay targetId="onboarding-source-item-0" padding={5} showDragHint={true} />
            <CoachMarkTooltip
              targetId="onboarding-source-item-0"
              step={3}
              totalSteps={totalSteps}
              text="Now drag a second item to complete your look."
              onSkip={handleSkip}
            />
          </>
        );
      case 4:
        // Hide during rating animation
        if (isRating) return null;
        
        return (
          <>
            <SpotlightOverlay targetId="onboarding-rate-button" padding={15} />
            <CoachMarkTooltip
              targetId="onboarding-rate-button"
              step={4}
              totalSteps={totalSteps}
              text="Ready? Tap here to see your Match Meter score!"
              onSkip={handleSkip}
            />
          </>
        );
      case 5:
        return (
          <>
            <SpotlightOverlay targetId="onboarding-match-meter" padding={20} />
            <CoachMarkTooltip
              targetId="onboarding-match-meter"
              step={5}
              totalSteps={totalSteps}
              text="Higher scores mean better style matches! Try swapping items or experimenting with different combos to boost your score."
              actionText="Got it!"
              onNext={handleSkip}
              onSkip={handleSkip}
            />
          </>
        );
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
}
