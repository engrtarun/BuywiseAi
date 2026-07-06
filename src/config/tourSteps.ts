export type TourStep = {
  targetId: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  isOptional?: boolean;
};

export const tourSteps: TourStep[] = [
  {
    targetId: "tour-sidebar-toggle",
    title: "Access your history",
    content: "Click here to open the sidebar. You can view all your past shopping sessions and start new ones.",
    position: "right",
    isOptional: false,
  },
  {
    targetId: "tour-mode-toggle",
    title: "Quick Actions & Modes",
    content: "Click this plus button to switch between Explore Mode (quick visual browsing) and Deep Research (detailed, step-by-step analysis).",
    position: "bottom",
    isOptional: false,
  },
  {
    targetId: "tour-chat-input",
    title: "Let's start shopping!",
    content: "Type what you're looking for here. You can ask for recommendations, specific products, or even upload an image.",
    position: "top",
    isOptional: false,
  },
];
