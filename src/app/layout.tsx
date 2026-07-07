import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { Sora } from "next/font/google";
import { Quicksand } from "next/font/google";
import { ThemeInitializer } from "@/components/ThemeInitializer";
import { AppModeProvider } from "@/contexts/AppModeContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { CanvasOnboardingTour } from "@/components/onboarding/CanvasOnboardingTour";
import { PremiumProvider } from "@/contexts/PremiumContext";
import { UserProvider } from "@/contexts/UserContext";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  title: "BuyWise AI – Smart AI Shopping Assistant",
  description: "Experience premium smart shopping assistant. Find, compare and make intelligent purchase decisions instantly with BuyWise AI.",
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
          <UserProvider>
            <OnboardingProvider>
              <PremiumProvider>
                <AppModeProvider>
                  <TooltipProvider delayDuration={300}>
                    {children}
                    <CanvasOnboardingTour />
                    <PremiumModal />
                  </TooltipProvider>
                </AppModeProvider>
            </PremiumProvider>
          </OnboardingProvider>
        </UserProvider>
      </ThemeProvider>
      </body>
    </html>
  );
}


