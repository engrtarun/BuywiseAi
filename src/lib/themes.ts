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
    id: "buywise-green",
    name: "BuyWise Green",
    colors: {
      primary: "#E8A33D",
      background: "#123832",
      sidebar: "#0C2823",
      text: "#F6EFDD",
    },
  },
  {
    id: "buywise-dark",
    name: "BuyWise Dark",
    colors: {
      primary: "#C96442",
      background: "#212121",
      sidebar: "#171717",
      text: "#F5F4EE",
    },
  },
];
