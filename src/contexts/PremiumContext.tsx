"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface PremiumContextValue {
  isOpen: boolean;
  openPremium: () => void;
  closePremium: () => void;
}

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPremium = useCallback(() => setIsOpen(true), []);
  const closePremium = useCallback(() => setIsOpen(false), []);

  return (
    <PremiumContext.Provider value={{ isOpen, openPremium, closePremium }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error("usePremium must be used within a PremiumProvider");
  }
  return ctx;
}
