import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { Sora } from "next/font/google";
import { Quicksand } from "next/font/google";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { CanvasOnboardingTour } from "@/components/onboarding/CanvasOnboardingTour";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BuyWise AI",
  description: "AI-powered smart shopping assistant",
};

import { ThemeProvider } from "@/hooks/useTheme";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${sora.variable} ${ibmPlexMono.variable} ${quicksand.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeInitializer />
      </head>
      <body className="bg-ink-deeper">
        <ThemeProvider>
          <OnboardingProvider>
            <AppModeProvider>
              {children}
              <CanvasOnboardingTour />
            </AppModeProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


