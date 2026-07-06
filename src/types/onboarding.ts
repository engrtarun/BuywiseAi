// ============================================================================
// BuyWise AI — Onboarding Type Definitions (v3.0)
// ============================================================================

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export interface TourStep {
  /** Unique identifier for this step */
  id: string;
  /** The data-tour-id attribute on the target DOM element. null = centered modal */
  targetId: string | null;
  /** Step title */
  title: string;
  /** Step description/content */
  content: string;
  /** Preferred tooltip placement relative to target */
  placement: TooltipPlacement;
  /** Optional: if true, skip this step on mobile viewports (< 768px) */
  skipOnMobile?: boolean;
}

export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export interface OnboardingState {
  /** Whether the tour is currently active */
  isActive: boolean;
  /** Current step index */
  currentStep: number;
  /** Whether the tour has been completed or skipped (persisted) */
  isDone: boolean;
  /** Whether the component has mounted on the client (hydration safety) */
  isMounted: boolean;
}
