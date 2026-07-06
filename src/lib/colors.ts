/**
 * Converts a HEX color string to a Shadcn-compatible HSL string (e.g. "222.2 47.4% 11.2%")
 */
export function hexToShadcnHsl(hex: string): string {
  // Remove hash if present
  let cleanHex = hex.replace("#", "");

  // Handle 3-character hex
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split("").map((char) => char + char).join("");
  }

  // Parse RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
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

  // Convert to Shadcn format
  const hFinal = (h * 360).toFixed(1);
  const sFinal = (s * 100).toFixed(1) + "%";
  const lFinal = (l * 100).toFixed(1) + "%";

  return `${hFinal} ${sFinal} ${lFinal}`;
}
