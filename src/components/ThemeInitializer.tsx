"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("buywise-theme") || "default";
      const savedMode = window.localStorage.getItem("buywise-mode") || "light";

      const root = document.documentElement;
      root.setAttribute("data-theme", savedTheme);
      root.setAttribute("data-mode", savedMode);
      
      if (savedMode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    } catch {
      document.documentElement.setAttribute("data-theme", "default");
      document.documentElement.setAttribute("data-mode", "light");
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return null;
}
