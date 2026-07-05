"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => Promise<void>;
  mode: string;
  setMode: (mode: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<string>("default");
  const [mode, setModeState] = useState<string>("light");

  const applyThemeAndMode = (newTheme: string, newMode: string) => {
    const root = document.documentElement;
    root.setAttribute("data-theme", newTheme);
    root.setAttribute("data-mode", newMode);
    
    if (newMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  useEffect(() => {
    // 1. Load initial values from localStorage
    const savedTheme = localStorage.getItem("buywise-theme") || "default";
    const savedMode = localStorage.getItem("buywise-mode") || "light";

    setThemeState(savedTheme);
    setModeState(savedMode);
    applyThemeAndMode(savedTheme, savedMode);

    // 2. Fetch from Supabase profile to sync
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

  const setTheme = async (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem("buywise-theme", newTheme);
    applyThemeAndMode(newTheme, mode);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("profiles")
          .update({ theme_preference: newTheme })
          .eq("id", user.id);
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
        await supabase
          .from("profiles")
          .update({ mode_preference: newMode })
          .eq("id", user.id);
      }
    } catch (err) {
      console.error("Failed to save mode preference:", err);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return fallback state if used outside provider
    return {
      theme: "default",
      setTheme: async () => {},
      mode: "light",
      setMode: async () => {},
    };
  }
  return context;
}
