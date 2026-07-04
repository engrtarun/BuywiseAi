"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type AppMode = "retail" | "food";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>("retail");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-app-mode", mode);
    }
  }, [mode]);

  return (
    <AppModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AppModeContext.Provider>
  );
}

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error("useAppMode must be used within an AppModeProvider");
  }
  return context;
}
