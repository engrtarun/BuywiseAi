import React from "react";

const scriptCode = `
  (function() {
    try {
      var savedTheme = window.localStorage.getItem("buywise-theme") || "default";
      var savedMode = window.localStorage.getItem("buywise-mode") || "light";
      var root = document.documentElement;

      root.setAttribute("data-theme", savedTheme);
      root.setAttribute("data-mode", savedMode);
      
      if (savedMode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }

      if (savedTheme === "custom") {
        var seedHex = window.localStorage.getItem("buywise_custom_seed_color") || "#FC8019";
        
        // Inline Color Theory Utilities
        function hexToHSL(hex) {
          var r = 0, g = 0, b = 0;
          if (hex.length === 4) {
            r = parseInt("0x" + hex[1] + hex[1]);
            g = parseInt("0x" + hex[2] + hex[2]);
            b = parseInt("0x" + hex[3] + hex[3]);
          } else if (hex.length === 7) {
            r = parseInt("0x" + hex[1] + hex[2]);
            g = parseInt("0x" + hex[3] + hex[4]);
            b = parseInt("0x" + hex[5] + hex[6]);
          }
          r /= 255; g /= 255; b /= 255;
          var max = Math.max(r, g, b), min = Math.min(r, g, b);
          var h = 0, s = 0, l = (max + min) / 2;
          if (max !== min) {
            var d = max - min;
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
        
        function HSLToHex(h, s, l) {
          s /= 100; l /= 100;
          var c = (1 - Math.abs(2 * l - 1)) * s,
              x = c * (1 - Math.abs((h / 60) % 2 - 1)),
              m = l - c / 2;
          var r = 0, g = 0, b = 0;
          if (0 <= h && h < 60) { r = c; g = x; b = 0; }
          else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
          else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
          else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
          else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
          else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
          var rStr = Math.round((r + m) * 255).toString(16);
          var gStr = Math.round((g + m) * 255).toString(16);
          var bStr = Math.round((b + m) * 255).toString(16);
          if (rStr.length === 1) rStr = "0" + rStr;
          if (gStr.length === 1) gStr = "0" + gStr;
          if (bStr.length === 1) bStr = "0" + bStr;
          return "#" + rStr + gStr + bStr;
        }

        var hsl = hexToHSL(seedHex);
        var bgL = Math.max(5, Math.min(hsl.l, 12));
        var bgS = Math.min(hsl.s, 15);
        var cardL = Math.max(12, Math.min(hsl.l, 18));
        
        function toShadcn(h, s, l) {
          return h.toFixed(1) + " " + s.toFixed(1) + "% " + l.toFixed(1) + "%";
        }
        
        var bgShadcn = toShadcn(hsl.h, bgS, bgL);
        var cardShadcn = toShadcn(hsl.h, bgS, cardL);
        var seedShadcn = toShadcn(hsl.h, hsl.s, hsl.l);
        var textContrast = hsl.l > 60 ? "0 0% 0%" : "0 0% 100%";
        
        var customStyle = document.getElementById("custom-theme-vars");
        if (!customStyle) {
          customStyle = document.createElement("style");
          customStyle.id = "custom-theme-vars";
          document.head.appendChild(customStyle);
        }
        customStyle.innerHTML = \`
          :root[data-theme="custom"] {
            --ink-deep: \${bgShadcn};
            --ink-deeper: \${bgShadcn};
            --bg-main: \${bgShadcn};
            --background: \${bgShadcn};
            
            --sidebar-bg: \${cardShadcn};
            --bg-sidebar: \${cardShadcn};
            --sidebar: \${cardShadcn};
            
            --bg-input: \${cardShadcn};
            --card: \${cardShadcn};
            --dropdown-bg: \${cardShadcn};
            --popover: \${cardShadcn};
            
            --marigold: \${seedShadcn};
            --brand-accent: \${seedShadcn};
            --primary: \${seedShadcn};
            --sidebar-primary: \${seedShadcn};
            --sidebar-ring: \${seedShadcn};
            
            --primary-foreground: \${textContrast};
            --sidebar-primary-foreground: \${textContrast};
          }
        \`;
      } else {
        var existingStyle = document.getElementById("custom-theme-vars");
        if (existingStyle) existingStyle.remove();
      }
    } catch(e) {
      document.documentElement.setAttribute("data-theme", "default");
      document.documentElement.setAttribute("data-mode", "light");
      document.documentElement.classList.remove("dark");
    }
  })();
`;

export function ThemeInitializer() {
  return (
    <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: scriptCode }} />
  );
}
