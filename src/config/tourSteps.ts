// ============================================================================
// BuyWise AI — Tour Step Definitions (Consolidated V3.0)
// ============================================================================
// Central configuration for the "Full Introduction" flow.
// Each step maps to a `data-tour-id` attribute on a DOM element.
// ============================================================================

import { TourStep } from "@/types/onboarding";

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetId: null, // No target — renders as a centered modal
    title: "Welcome to BuyWise AI!",
    content:
      "Your ultimate, all-in-one smart shopping assistant. Let's take a quick 30-second tour to show you how to get the best out of your shopping experience.",
    placement: "bottom",
  },
  {
    id: "tour-sidebar-toggle",
    targetId: "tour-sidebar-toggle",
    title: "Access your history",
    content: "Click here to open the sidebar. You can view all your past shopping sessions and start new ones.",
    placement: "right",
  },
  {
    id: "chat-input",
    targetId: "chat-input",
    title: "Talk to BuyWise",
    content:
      "Type anything here. Ask for product recommendations, compare laptops, or even order groceries.",
    placement: "top",
  },
  {
    id: "mode-selector",
    targetId: "mode-selector",
    title: "Switch Shopping Modes",
    content:
      "Use Explore for fast discovery, Deep Research for detailed tech specs, and Quick Mode for a TikTok-style endless product feed.",
    placement: "top",
  },
  {
    id: "quick-cart",
    targetId: "quick-cart",
    title: "Your Shopping Cart",
    content:
      "Manage your quantities, save items for later, and checkout seamlessly right here.",
    placement: "bottom",
  },
  {
    id: "theme-picker",
    targetId: "theme-picker",
    title: "Make It Yours",
    content:
      "Switch between Dark mode, Light mode, or create your very own Custom shopping theme.",
    placement: "right",
    skipOnMobile: true, // Theme picker may be inside a hamburger menu on mobile
  },
];
