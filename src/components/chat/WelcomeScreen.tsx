"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Brain, Compass, ShoppingBag, Utensils, Shirt, ChevronRight, User } from "lucide-react";
import { LoginRequiredScreen } from "./LoginRequiredScreen";
import { DailyLimitReachedCard } from "./DailyLimitReachedCard";
import Logo from "@/components/ui/logo";
import { ChatMode } from "@/types/chat";
import { useI18n } from "@/contexts/I18nContext";

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
  isGuest?: boolean;
  guestMessagesRemaining?: number;
  guestLimitReached?: boolean;
  dailyLimitReached?: boolean;
  dailyLimitMessage?: string;
  onLoginClick?: () => void;
  selectedMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onOpenQuickBuy?: () => void;
  onOpenFoodQuickBuy?: () => void;
  dynamicPrompts?: string[];
}

type ActiveCycleMode = 'explore' | 'deep_research' | 'quick_buy' | 'quick_food' | 'virtual_wardrobe';

const MODE_CYCLE_SEQUENCE: ActiveCycleMode[] = [
  'explore',
  'deep_research',
  'quick_buy',
  'quick_food',
  'virtual_wardrobe'
];

const SHOWCASE_PRODUCTS = [
  {
    name: "MacBook Pro M3 Max",
    category: "Computing",
    price: "₹2,49,900",
    desc: "Unmatched performance with M3 Max silicon architecture."
  },
  {
    name: "Sony WH-1000XM5",
    category: "Audio",
    price: "₹29,990",
    desc: "Industry-leading active noise canceling wireless headphones."
  },
  {
    name: "Air Jordan 1 Retro",
    category: "Apparel",
    price: "₹16,995",
    desc: "Iconic streetwear styling with timeless full-grain leather."
  },
  {
    name: "Steelcase Gesture Chair",
    category: "Furniture",
    price: "₹95,000",
    desc: "Premium ergonomic adjustment mechanics for extreme comfort."
  }
];

const MODE_METADATA: Record<ActiveCycleMode, {
  titleKey: string;
  icon: any;
  descKey: string;
  benefits: string[];
  themeColor: string;
}> = {
  explore: {
    titleKey: "Explore Mode",
    icon: Compass,
    descKey: "Lightweight, visual, browse-first experience for quick discoveries.",
    benefits: [
      "Discoverability metrics integration",
      "Automated food/apparel intent triggers",
      "Instant responsive micro-layouts"
    ],
    themeColor: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30"
  },
  deep_research: {
    titleKey: "Deep Research Mode",
    icon: Brain,
    descKey: "Guided, interactive hardware specification and performance comparisons.",
    benefits: [
      "Dual-agent Critic review loop",
      "Multi-source factual validation check",
      "Semantic cache search optimization"
    ],
    themeColor: "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/30"
  },
  quick_buy: {
    titleKey: "Quick Buy Mode",
    icon: ShoppingBag,
    descKey: "Express checkout parameter mapper for zero-friction acquisition.",
    benefits: [
      "Live crawler price scraping links",
      "Automated target parameter filtration",
      "Shopper speed profile integration"
    ],
    themeColor: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
  },
  quick_food: {
    titleKey: "Quick Food Mode",
    icon: Utensils,
    descKey: "Real-time localized dataset mapper for instant dining recommendations.",
    benefits: [
      "Live local restaurant catalogs",
      "Delivery times & schema validation",
      "Menu composition analysis"
    ],
    themeColor: "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
  },
  virtual_wardrobe: {
    titleKey: "Virtual Wardrobe Mode",
    icon: Shirt,
    descKey: "Interactive visual overlays and fit catalog parameter profilings.",
    benefits: [
      "Apparel fit metadata mapping",
      "Clean UI visual overlay modules",
      "Persistent sizing metrics database"
    ],
    themeColor: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
  }
};

export function WelcomeScreen({
  onSuggestionClick,
  isGuest = false,
  guestMessagesRemaining = 0,
  guestLimitReached = false,
  dailyLimitReached = false,
  dailyLimitMessage,
  onLoginClick,
  selectedMode,
  onModeChange,
  onOpenQuickBuy,
  onOpenFoodQuickBuy,
  dynamicPrompts
}: WelcomeScreenProps) {
  const router = useRouter();
  const { t } = useI18n();

  // State Management
  const [productIndex, setProductIndex] = useState(0);
  const [activeModeIndex, setActiveModeIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Find best wireless headphones under ₹5,000",
    "Compare top 3 washing machines",
    "Best budget smartphones under ₹15,000",
    "Find deals on laptops for student study"
  ]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // 50s Interval Loop: Showcase Products
  useEffect(() => {
    const productInterval = setInterval(() => {
      setProductIndex((prev) => (prev + 1) % SHOWCASE_PRODUCTS.length);
    }, 50000);
    return () => clearInterval(productInterval);
  }, []);

  // 30s Interval Loop: Dynamic Suggestions fetching
  useEffect(() => {
    if (dynamicPrompts && dynamicPrompts.length > 0) {
      setSuggestions(dynamicPrompts.slice(0, 4));
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setSuggestionsLoading(true);
        const res = await fetch("/api/suggestions");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length >= 4) {
            setSuggestions(data.slice(0, 4));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch suggestions:", err);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions(); // Initial call
    const suggestionInterval = setInterval(fetchSuggestions, 30000);
    return () => clearInterval(suggestionInterval);
  }, [dynamicPrompts]);

  // 10s Interval Loop: Mode Cycling
  useEffect(() => {
    const modeInterval = setInterval(() => {
      setActiveModeIndex((prev) => (prev + 1) % MODE_CYCLE_SEQUENCE.length);
    }, 10000);
    return () => clearInterval(modeInterval);
  }, []);

  if (guestLimitReached) {
    return <LoginRequiredScreen onLoginClick={onLoginClick} />;
  }

  if (dailyLimitReached) {
    return <DailyLimitReachedCard message={dailyLimitMessage} />;
  }

  const currentProduct = SHOWCASE_PRODUCTS[productIndex];
  const currentModeType = MODE_CYCLE_SEQUENCE[activeModeIndex];
  const currentModeInfo = MODE_METADATA[currentModeType];
  const ModeIcon = currentModeInfo.icon;

  const handleModeBlockClick = () => {
    if (currentModeType === 'explore') {
      onModeChange('explore');
    } else if (currentModeType === 'deep_research') {
      onModeChange('deep_research');
    } else if (currentModeType === 'quick_buy') {
      if (onOpenQuickBuy) onOpenQuickBuy();
      else router.push('/quick-buy');
    } else if (currentModeType === 'quick_food') {
      if (onOpenFoodQuickBuy) onOpenFoodQuickBuy();
    } else if (currentModeType === 'virtual_wardrobe') {
      router.push('/virtual-wardrobe');
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col justify-between overflow-y-auto px-6 py-8 bg-background text-foreground transition-colors duration-300">
      {/* Brand Identity / Top Header */}
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2 select-none">
        <div className="overflow-visible h-20 flex items-center justify-center">
          <Logo 
            showText={false}
            iconClassName="w-16 h-16 text-primary drop-shadow-[0_4px_12px_var(--primary)/10]"
          />
        </div>
        <h1 className="text-xl font-heading font-semibold text-foreground tracking-wide">
          BuyWise AI
        </h1>
        {isGuest && (
          <div className="inline-flex items-center gap-2 mt-2 px-3.5 py-1.5 rounded-full bg-muted/50 border border-border backdrop-blur-sm animate-in fade-in duration-500 text-xs font-mono text-muted-foreground">
            <User className="size-3.5" />
            <span>{t("welcome.guestMode")}</span>
            <span className="w-px h-3 bg-border" />
            <span className="text-primary font-medium">
              {guestMessagesRemaining} {guestMessagesRemaining === 1 ? t("welcome.freeMessageLeft") : t("welcome.freeMessagesLeft")}
            </span>
          </div>
        )}
      </div>

      {/* Center Grid Workspace */}
      <div className="w-full max-w-2xl mx-auto flex flex-col gap-6 my-auto pt-6">
        
        {/* Dynamic Product Showcase Banner (50s loop) */}
        <div className="w-full bg-card border border-border rounded-lg p-4 transition-all duration-500 ease-in-out relative overflow-hidden">
          <div className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-mono text-muted-foreground/60">
            Showcase Spotlight
          </div>
          <div key={productIndex} className="animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {currentProduct.category}
              </span>
              <h3 className="text-sm font-sans font-semibold text-foreground">{currentProduct.name}</h3>
              <p className="text-xs text-muted-foreground max-w-md">{currentProduct.desc}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-sm font-mono font-bold text-foreground">{currentProduct.price}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Prompt Suggestion Matrix (30s rotation) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((promptText, idx) => (
            <button
              key={`${idx}-${promptText}`}
              onClick={() => onSuggestionClick(promptText)}
              disabled={suggestionsLoading}
              className="w-full text-left p-3.5 rounded-lg bg-card border border-border hover:bg-muted/50 hover:border-border/80 active:scale-[0.99] transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[90px]"
            >
              <span className="text-xs font-sans text-foreground leading-relaxed font-medium">
                {promptText}
              </span>
              <div className="w-full flex justify-end">
                <ChevronRight className="size-3 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        {/* The Mode Cycling System (10s continuous rotator) */}
        <div 
          onClick={handleModeBlockClick}
          className="w-full bg-card border border-border hover:bg-muted/50 hover:border-border/80 rounded-lg p-5 cursor-pointer transition-all duration-300 group relative"
        >
          {/* Active timing progress line indicator */}
          <div key={activeModeIndex} className="absolute bottom-0 left-0 h-[2px] bg-primary/50 animate-progress-bar" style={{ animationDuration: '10s' }} />
          
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg bg-muted border border-border ${currentModeInfo.themeColor}`}>
              <ModeIcon className="size-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                  Featured Capabilities
                </span>
                <span className="text-[10px] text-muted-foreground font-mono group-hover:text-foreground transition-colors">
                  Launch Workspace →
                </span>
              </div>
              <h2 className="text-sm font-sans font-bold text-foreground">
                {currentModeType === 'explore' ? t("welcome.exploreMode") : currentModeType === 'deep_research' ? t("welcome.deepResearch") : currentModeInfo.titleKey}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentModeInfo.descKey}
              </p>
              
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2">
                {currentModeInfo.benefits.map((benefit, bIdx) => (
                  <li key={bIdx} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Padding for input window isolation */}
      <div className="h-6 shrink-0" />
    </div>
  );
}
