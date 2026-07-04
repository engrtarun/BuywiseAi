"use client";

import { useEffect } from "react";

export function ThemeInitializer() {
  useEffect(() => {
    try {
      const savedTheme = window.localStorage.getItem("buywise-theme");
      const currentTheme =
        savedTheme || document.documentElement.getAttribute("data-theme") || "buywise-green";

      document.documentElement.setAttribute("data-theme", currentTheme);
    } catch {
      document.documentElement.setAttribute("data-theme", "buywise-green");
    }
  }, []);

  return null;
}
