"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ModeToggle() {
  const { mode, setMode } = useTheme();

  return (
    <button
      onClick={() => setMode(mode === "light" ? "dark" : "light")}
      className="p-2 rounded-lg text-text-dim-ondark hover:text-text-ondark hover:bg-white/[0.08] transition-all cursor-pointer flex items-center justify-center"
      aria-label="Toggle Light/Dark Mode"
    >
      {mode === "light" ? (
        <Moon className="size-5 transition-transform duration-300 hover:rotate-12" />
      ) : (
        <Sun className="size-5 transition-transform duration-300 hover:rotate-45" />
      )}
    </button>
  );
}
