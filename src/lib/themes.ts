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

// Color Theory Utilities
export function hexToHSL(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function HSLToHex(h: number, s: number, l: number) {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }
  
  let rStr = Math.round((r + m) * 255).toString(16);
  let gStr = Math.round((g + m) * 255).toString(16);
  let bStr = Math.round((b + m) * 255).toString(16);

  if (rStr.length === 1) rStr = "0" + rStr;
  if (gStr.length === 1) gStr = "0" + gStr;
  if (bStr.length === 1) bStr = "0" + bStr;

  return "#" + rStr + gStr + bStr;
}

export function generateCustomTheme(seedHex: string) {
  const { h, s, l } = hexToHSL(seedHex);

  // Background: Clamp Lightness between 5% and 12%, Saturation max 15%
  const bgL = Math.max(5, Math.min(l, 12));
  const bgS = Math.min(s, 15);
  const backgroundHex = HSLToHex(h, bgS, bgL);

  // Card/Sidebar: Clamp Lightness between 12% and 18%, Saturation max 15%
  const cardL = Math.max(12, Math.min(l, 18));
  const cardHex = HSLToHex(h, bgS, cardL);

  // Primary text contrast guardrail: if primary lightness > 60%, use black, else white
  const primaryForeground = l > 60 ? "#000000" : "#ffffff";

  return {
    primary: seedHex,
    background: backgroundHex,
    sidebar: cardHex,
    primaryForeground: primaryForeground
  };
}
