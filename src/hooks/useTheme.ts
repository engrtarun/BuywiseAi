"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const isBrowser = typeof window !== "undefined";

import { generateCustomTheme } from "@/lib/themes";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => Promise<void>;
  mode: string;
  setMode: (mode: string) => Promise<void>;
  customSeedColor: string;
  setCustomSeedColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [theme, setThemeState] = useState<string>("default");
  const [mode, setModeState] = useState<string>("light");
  const [customSeedColor, setCustomSeedColorState] = useState<string>("#FC8019");

  const applyThemeAndMode = (newTheme: string, newMode: string, newSeed?: string) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);
    root.setAttribute("data-mode", newMode);

    if (newMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (newTheme === "custom") {
      const activeSeed = newSeed || customSeedColor;
      const themeVars = generateCustomTheme(activeSeed);
      
      let customStyle = document.getElementById("custom-theme-vars");
      if (!customStyle) {
        customStyle = document.createElement("style");
        customStyle.id = "custom-theme-vars";
        document.head.appendChild(customStyle);
      }
      
      customStyle.innerHTML = `
        :root[data-theme="custom"] {
          --ink-deep: ${themeVars.background};
          --ink-deeper: ${themeVars.background};
          --bg-main: ${themeVars.background};
          --background: ${themeVars.background};
          
          --sidebar-bg: ${themeVars.sidebar};
          --bg-sidebar: ${themeVars.sidebar};
          --sidebar: ${themeVars.sidebar};
          
          --bg-input: ${themeVars.sidebar};
          --card: ${themeVars.sidebar};
          --dropdown-bg: ${themeVars.sidebar};
          --popover: ${themeVars.sidebar};
          
          --marigold: ${themeVars.primary};
          --brand-accent: ${themeVars.primary};
          --primary: ${themeVars.primary};
          --sidebar-primary: ${themeVars.primary};
          --sidebar-ring: ${themeVars.primary};
          
          --primary-foreground: ${themeVars.primaryForeground};
          --sidebar-primary-foreground: ${themeVars.primaryForeground};
        }
      `;
    } else {
      const customStyle = document.getElementById("custom-theme-vars");
      if (customStyle) {
        customStyle.remove();
      }
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("buywise-theme") || "default";
    const savedMode = localStorage.getItem("buywise-mode") || "light";
    const savedSeed = localStorage.getItem("buywise_custom_seed_color") || "#FC8019";

    setThemeState(savedTheme);
    setModeState(savedMode);
    setCustomSeedColorState(savedSeed);
    applyThemeAndMode(savedTheme, savedMode, savedSeed);

    const syncWithProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("theme_preference, mode_preference")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          let updatedTheme = savedTheme;
          let updatedMode = savedMode;
          let needsUpdateLocal = false;

          if (profile.theme_preference && profile.theme_preference !== savedTheme) {
            updatedTheme = profile.theme_preference;
            needsUpdateLocal = true;
          }
          if (profile.mode_preference && profile.mode_preference !== savedMode) {
            updatedMode = profile.mode_preference;
            needsUpdateLocal = true;
          }

          if (needsUpdateLocal) {
            setThemeState(updatedTheme);
            setModeState(updatedMode);
            applyThemeAndMode(updatedTheme, updatedMode);
            localStorage.setItem("buywise-theme", updatedTheme);
            localStorage.setItem("buywise-mode", updatedMode);
          }
        }
      } catch (err) {
        console.error("Failed to sync theme with profile:", err);
      }
    };

    syncWithProfile();
  }, []);

  const setCustomSeedColor = (newColor: string) => {
    setCustomSeedColorState(newColor);
    localStorage.setItem("buywise_custom_seed_color", newColor);
    if (theme === "custom") {
      applyThemeAndMode("custom", mode, newColor);
    }
  };

  const setTheme = async (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem("buywise-theme", newTheme);
    applyThemeAndMode(newTheme, mode);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ theme_preference: newTheme }).eq("id", user.id);
      }
    } catch (err) {
      console.error("Failed to save theme preference:", err);
    }
  };

  const setMode = async (newMode: string) => {
    setModeState(newMode);
    localStorage.setItem("buywise-mode", newMode);
    applyThemeAndMode(theme, newMode);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ mode_preference: newMode }).eq("id", user.id);
      }
    } catch (err) {
      console.error("Failed to save mode preference:", err);
    }
  };

  return React.createElement(
    ThemeContext.Provider,
    { value: { theme, setTheme, mode, setMode, customSeedColor, setCustomSeedColor } },
    children
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return {
      theme: "default",
      setTheme: async () => {},
      mode: "light",
      setMode: async () => {},
      customSeedColor: "#FC8019",
      setCustomSeedColor: () => {},
    };
  }
  return context;
}
