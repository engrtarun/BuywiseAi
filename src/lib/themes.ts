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
    id: "default",
    name: "Default",
    colors: {
      primary: "#FC8019",
      background: "#ffffff",
      sidebar: "#f4f4f5",
      text: "#09090b",
    },
  },
  {
    id: "buywise-green",
    name: "Forest",
    colors: {
      primary: "#E8A33D",
      background: "#123832",
      sidebar: "#0C2823",
      text: "#F6EFDD",
    },
  },
  {
    id: "buywise-dark",
    name: "Gray",
    colors: {
      primary: "#C96442",
      background: "#212121",
      sidebar: "#171717",
      text: "#F5F4EE",
    },
  },
];
