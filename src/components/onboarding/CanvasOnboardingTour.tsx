"use client";
// ============================================================================
// BuyWise AI — CanvasOnboardingTour v3.0 (The Orchestrator)
// ============================================================================
// Root-level React Portal that:
//  1. Tracks the active tour step from OnboardingContext
//  2. Uses DOM polling (MutationObserver fallback) to find data-tour-id targets
//  3. Calculates spotlight rect via getBoundingClientRect
//  4. Positions tooltip using @floating-ui/react for viewport-safe placement
//  5. Listens for resize/scroll to keep coordinates synced
//  6. Renders the dimmed backdrop with an SVG mask spotlight cutout
// ============================================================================

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { TOUR_STEPS } from "@/config/tourSteps";
import { CoachMarkTooltip } from "./CoachMarkTooltip";
import type { TargetRect, TooltipPlacement } from "@/types/onboarding";

// ─── Constants ─────────────────────────────────────────────────────────
const SPOTLIGHT_PADDING = 8; // px padding around the target for the cutout
const DOM_POLL_INTERVAL = 200; // ms between polls
const DOM_POLL_TIMEOUT = 2000; // ms before giving up and skipping

export function CanvasOnboardingTour() {
  const { isActive, currentStep, totalSteps, nextStep, prevStep, skipTour, isMounted } =
    useOnboarding();

  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resolvedPlacement, setResolvedPlacement] = useState<TooltipPlacement>("bottom");
  const [domReady, setDomReady] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const activeStep = useMemo(
    () => (isActive && currentStep < TOUR_STEPS.length ? TOUR_STEPS[currentStep] : null),
    [isActive, currentStep]
  );

  // ─── Cleanup polls ───────────────────────────────────────────────────
  const clearPolls = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  // ─── Calculate tooltip position using floating-ui style logic ────────
  const calculatePositions = useCallback(
    (rect: TargetRect, placement: TooltipPlacement): { x: number; y: number; resolved: TooltipPlacement } => {
      const tooltipWidth = 320;
      const tooltipHeight = 280;
      const gap = 16;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // Try desired placement first, then fallback
      const placements: TooltipPlacement[] = [placement, "bottom", "top", "right", "left"];
      for (const pl of placements) {
        let x = 0;
        let y = 0;
        switch (pl) {
          case "bottom":
            x = rect.left + rect.width / 2 - tooltipWidth / 2;
            y = rect.bottom + gap + SPOTLIGHT_PADDING;
            break;
          case "top":
            x = rect.left + rect.width / 2 - tooltipWidth / 2;
            y = rect.top - tooltipHeight - gap - SPOTLIGHT_PADDING;
            break;
          case "right":
            x = rect.right + gap + SPOTLIGHT_PADDING;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
          case "left":
            x = rect.left - tooltipWidth - gap - SPOTLIGHT_PADDING;
            y = rect.top + rect.height / 2 - tooltipHeight / 2;
            break;
        }
        // Clamp to viewport
        x = Math.max(12, Math.min(x, vw - tooltipWidth - 12));
        y = Math.max(12, Math.min(y, vh - tooltipHeight - 12));

        // Check if this placement fits reasonably
        const fits =
          (pl === "bottom" && rect.bottom + gap + tooltipHeight < vh) ||
          (pl === "top" && rect.top - gap - tooltipHeight > 0) ||
          (pl === "right" && rect.right + gap + tooltipWidth < vw) ||
          (pl === "left" && rect.left - gap - tooltipWidth > 0);

        if (fits || pl === placements[placements.length - 1]) {
          return { x, y, resolved: pl };
        }
      }
      // Absolute fallback
      return {
        x: vw / 2 - tooltipWidth / 2,
        y: vh / 2 - tooltipHeight / 2,
        resolved: placement,
      };
    },
    []
  );

  // ─── Update positions from a DOM element ─────────────────────────────
  const updateFromElement = useCallback(
    (el: Element, placement: TooltipPlacement) => {
      const r = el.getBoundingClientRect();
      const rect: TargetRect = {
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
        bottom: r.bottom,
        right: r.right,
      };
      setTargetRect(rect);

      const pos = calculatePositions(rect, placement);
      setTooltipPos({ x: pos.x, y: pos.y });
      setResolvedPlacement(pos.resolved);
      setDomReady(true);
    },
    [calculatePositions]
  );

  // ─── DOM Polling: find target element with retry ─────────────────────
  useEffect(() => {
    clearPolls();
    setDomReady(false);
    setTargetRect(null);

    if (!isActive || !activeStep) return;

    // If step has no target (centered modal), skip DOM search
    if (activeStep.targetId === null) {
      setTargetRect(null);
      setTooltipPos({
        x: window.innerWidth / 2 - 160,
        y: window.innerHeight / 2 - 140,
      });
      setResolvedPlacement("bottom");
      setDomReady(true);
      return;
    }

    // Skip this step on mobile if flagged
    if (activeStep.skipOnMobile && window.innerWidth < 768) {
      nextStep();
      return;
    }

    // Start polling for the target element
    const selector = `[data-tour-id="${activeStep.targetId}"]`;
    const tryFind = () => {
      const el = document.querySelector(selector);
      if (el) {
        clearPolls();
        updateFromElement(el, activeStep.placement);
        return true;
      }
      return false;
    };

    // Try immediately
    if (tryFind()) return;

    // Poll every 200ms
    pollTimerRef.current = setInterval(() => {
      tryFind();
    }, DOM_POLL_INTERVAL);

    // Timeout after 2s — skip to next step
    pollTimeoutRef.current = setTimeout(() => {
      clearPolls();
      console.warn(`[Onboarding v3] Could not find target: ${selector}. Skipping step.`);
      nextStep();
    }, DOM_POLL_TIMEOUT);

    return clearPolls;
  }, [isActive, activeStep, currentStep, clearPolls, updateFromElement, nextStep]);

  // ─── Resize & Scroll listener ────────────────────────────────────────
  useEffect(() => {
    if (!isActive || !activeStep || activeStep.targetId === null) return;

    const handleResize = () => {
      const selector = `[data-tour-id="${activeStep.targetId}"]`;
      const el = document.querySelector(selector);
      if (el) {
        updateFromElement(el, activeStep.placement);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [isActive, activeStep, updateFromElement]);

  // ─── Don't render on server or before mount ──────────────────────────
  if (!isMounted || !isActive || !domReady) return null;

  const isCentered = activeStep?.targetId === null;

  // ─── Spotlight SVG Mask ──────────────────────────────────────────────
  const spotlight = targetRect
    ? {
        x: targetRect.left - SPOTLIGHT_PADDING,
        y: targetRect.top - SPOTLIGHT_PADDING,
        w: targetRect.width + SPOTLIGHT_PADDING * 2,
        h: targetRect.height + SPOTLIGHT_PADDING * 2,
        rx: 12,
      }
    : null;

  const overlay = (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9998]"
          onClick={skipTour}
        >
          {/* SVG Mask Overlay — dims entire screen except the spotlight */}
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <mask id="spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {spotlight && (
                  <rect
                    x={spotlight.x}
                    y={spotlight.y}
                    width={spotlight.w}
                    height={spotlight.h}
                    rx={spotlight.rx}
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.75)"
              mask="url(#spotlight-mask)"
              style={{ backdropFilter: "blur(2px)" }}
            />
          </svg>

          {/* Pulsing Beacon on the target */}
          {spotlight && (
            <>
              <div
                className="absolute rounded-xl border-2 border-blue-400/60 animate-pulse"
                style={{
                  top: spotlight.y,
                  left: spotlight.x,
                  width: spotlight.w,
                  height: spotlight.h,
                }}
              />
              <div
                className="absolute rounded-full bg-blue-500 animate-ping"
                style={{
                  top: spotlight.y + spotlight.h / 2 - 6,
                  left: spotlight.x + spotlight.w / 2 - 6,
                  width: 12,
                  height: 12,
                }}
              />
            </>
          )}

          {/* Tooltip */}
          <div
            ref={tooltipRef}
            className="absolute"
            style={{
              top: tooltipPos.y,
              left: tooltipPos.x,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CoachMarkTooltip
              title={activeStep?.title ?? ""}
              content={activeStep?.content ?? ""}
              stepIndex={currentStep}
              totalSteps={totalSteps}
              placement={resolvedPlacement}
              onNext={nextStep}
              onPrev={prevStep}
              onSkip={skipTour}
              isCentered={isCentered}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render into a portal at document.body for clean z-index stacking
  if (typeof document === "undefined") return null;
  return createPortal(overlay, document.body);
}
