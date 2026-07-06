export type AppFeatureMode = "explore" | "deep_research" | "quick_buy" | "food";

export interface ModeConfig {
  requiresAuth: boolean;
}

export const MODES_CONFIG: Record<AppFeatureMode, ModeConfig> = {
  explore: {
    requiresAuth: false,
  },
  deep_research: {
    requiresAuth: true,
  },
  quick_buy: {
    requiresAuth: true,
  },
  food: {
    requiresAuth: true,
  },
};
