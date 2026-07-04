export interface ThemePreset {
  id: string;
  name: string;
  colors: {
    primary: string;
    background: string;
    sidebar: string;
    text: string;
  };
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "buywise-dark",
    name: "BuyWise Dark",
    colors: {
      primary: "#E8A33D",
      background: "#0C2823",
      sidebar: "#091e1a",
      text: "#F6EFDD",
    },
  },
];
