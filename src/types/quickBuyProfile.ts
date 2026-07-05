export interface QuickBuyProfile {
  id: string;
  name: string;
  avatarLabel: string;
  sizes: string[];
  preferredCategories: string[];
  maxBudget: number | null;
  isDefault: boolean;
  createdAt: string;
}
