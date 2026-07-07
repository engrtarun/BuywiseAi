"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { en, Translations } from "@/i18n/en";
import { hi } from "@/i18n/hi";

type Language = "en" | "hi";

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load persisted language on mount
    const saved = localStorage.getItem("buywise_language") as Language;
    if (saved === "en" || saved === "hi") {
      setLanguageState(saved);
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("buywise_language", lang);
  }, []);

  const t = useCallback((key: keyof Translations): string => {
    // Fallback to English if key is somehow missing in Hindi
    if (language === "hi") {
      return hi[key] || en[key] || key;
    }
    return en[key] || key;
  }, [language]);

  // To prevent hydration mismatch, render generic initial state or just wait.
  // Actually, standard text rendering might not cause major hydration issues 
  // if we don't rely heavily on SSR localized text. 
  // But wait, if SSR is "en" and local is "hi", it will mismatch.
  // We'll let it hydrate and accept the flash, or hide until mounted.
  // For text, React usually warns but recovers fine.
  
  if (!mounted) {
    // We can return children directly. React might warn about text differences on hydration,
    // but it will immediately self-correct on the client.
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
