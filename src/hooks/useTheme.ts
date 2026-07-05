"use client";

import { useState, useEffect } from "react";

export function useTheme() {
  const [theme, setThemeState] = useState<string>("buywise-green");

  useEffect(() => {
    // Read from localStorage or HTML attribute on mount
    const savedTheme = localStorage.getItem("buywise-theme");
    const currentTheme = savedTheme || document.documentElement.getAttribute("data-theme") || "buywise-green";
    const t = setTimeout(() => setThemeState(currentTheme), 0);
    
    // Sync the attribute just in case
    if (document.documentElement.getAttribute("data-theme") !== currentTheme) {
      document.documentElement.setAttribute("data-theme", currentTheme);
    }

    return () => clearTimeout(t);
  }, []);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem("buywise-theme", newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
  };

  return { theme, setTheme };
}
