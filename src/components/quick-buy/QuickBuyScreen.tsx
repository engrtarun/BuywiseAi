"use client";

import React, { useState, useEffect } from "react";
import { useQuickBuy } from "@/hooks/useQuickBuy";
import { SizeBudgetForm } from "./SizeBudgetForm";
import { SwipeCardDeck } from "./SwipeCardDeck";
import { SavedItemsList } from "./SavedItemsList";
import { FoodSwipeCardDeck } from "./FoodSwipeCardDeck";
import { X, Settings2, Heart, Mic, ShoppingCart } from "lucide-react";
import { useAppMode } from "@/contexts/AppModeContext";
import { useVoiceCustomizationExtraction } from "@/hooks/useVoiceCustomizationExtraction";
import { ProfileSwitcher } from "./ProfileSwitcher";
import { QuickBuyLockedState } from "./QuickBuyLockedState";

interface QuickBuyScreenProps {
  onClose: () => void;
}

export function QuickBuyScreen({ onClose }: QuickBuyScreenProps) {
  const { 
    isInitializing, 
    isLoadingProducts,
    preferences, 
    savePreferences,
    savedItemIds, 
    savedProducts, 
    savedForLaterIds,
    savedForLaterProducts,
    cartItemCount,
    itemQuantities,
    saveItem, 
    removeSavedItem, 
    updateQuantity,
    clearCart,
    moveToSavedForLater,
    moveToCart,
    getFilteredProducts,
    hasMore,
    fetchNextPage,
    totalSpent,
    addExpense,
    profiles,
    activeProfile,
    createProfile,
    switchProfile,
    updateProfile,
    deleteProfile
  } = useQuickBuy();

  const { mode } = useAppMode();
  const { extractCustomizations } = useVoiceCustomizationExtraction();
  
  const [showSettings, setShowSettings] = useState(false);
  const previousGhostRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    previousGhostRef.current = root.getAttribute('data-ghost');
    root.setAttribute('data-ghost', 'true');

    return () => {
      if (previousGhostRef.current === null) {
        root.removeAttribute('data-ghost');
      } else {
        root.setAttribute('data-ghost', previousGhostRef.current);
      }
    };
  }, []);
  const [showAddProfileForm, setShowAddProfileForm] = useState(false);
  const [showOnboardingForm, setShowOnboardingForm] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasSeenOnboarding(localStorage.getItem("buywise_quickbuy_has_seen_onboarding") === "true");
    }
  }, []);

  const customizations = extractCustomizations(voiceInput);

  // Still loading profiles or local storage
  if (isInitializing) {
    return (
      <div className="absolute inset-0 z-[100] bg-bg-main flex items-center justify-center">
        <div className="size-8 rounded-full border-4 border-brand-accent/20 border-t-brand-accent animate-spin" />
      </div>
    );
  }

  const isFirstTime = profiles.length === 0 && !hasSeenOnboarding;
  const isEditingOrAdding = showSettings || showAddProfileForm || showOnboardingForm;

  // Onboarding, Add or Edit Profile Form State
  if (isFirstTime || isEditingOrAdding) {
    const isAdding = showAddProfileForm;
    const isEditing = showSettings;
    const isCreatingFromLocked = showOnboardingForm;

    let initialPrefs = null;
    let initialName = "";
    let requireName = false;
    let onSkipProp = undefined;

    if (isEditing && activeProfile) {
      initialPrefs = preferences;
      initialName = activeProfile.name;
      requireName = !activeProfile.isDefault;
    } else if (isAdding) {
      requireName = true;
    } else if (isFirstTime) {
      onSkipProp = () => {
        localStorage.setItem("buywise_quickbuy_has_seen_onboarding", "true");
        setHasSeenOnboarding(true);
      };
    }

    const handleFormSave = async (prefs: any, profileName?: string) => {
      if (isEditing && activeProfile) {
        await updateProfile(activeProfile.id, {
          sizes: prefs.sizes,
          preferredCategories: prefs.preferredCategories,
          maxBudget: prefs.maxBudget,
          name: profileName
        });
        setShowSettings(false);
      } else if (isAdding) {
        await createProfile({
          name: profileName || "Shopper",
          sizes: prefs.sizes,
          preferredCategories: prefs.preferredCategories,
          maxBudget: prefs.maxBudget
        });
        setShowAddProfileForm(false);
      } else if (isCreatingFromLocked) {
        await createProfile({
          name: "You",
          sizes: prefs.sizes,
          preferredCategories: prefs.preferredCategories,
          maxBudget: prefs.maxBudget
        });
        setShowOnboardingForm(false);
      } else if (isFirstTime) {
        localStorage.setItem("buywise_quickbuy_has_seen_onboarding", "true");
        setHasSeenOnboarding(true);
        await createProfile({
          name: "You",
          sizes: prefs.sizes,
          preferredCategories: prefs.preferredCategories,
          maxBudget: prefs.maxBudget
        });
      }
    };

    return (
      <div className="absolute inset-0 z-[100] bg-bg-main flex flex-col">
        {/* Simple header for settings/add profile */}
        {(profiles.length > 0 || hasSeenOnboarding) && (
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-light bg-bg-main/80 backdrop-blur-md shrink-0">
            <button 
              onClick={() => {
                setShowSettings(false);
                setShowAddProfileForm(false);
                setShowOnboardingForm(false);
              }} 
              className="p-2 -ml-2 rounded-full hover:bg-white/5 text-text-primary-light transition-colors cursor-pointer"
            >
              <X className="size-6" />
            </button>
            <div className="font-bold text-text-primary-light">
              {isEditing ? "Quick Buy Settings" : "Create Shopper Profile"}
            </div>
            <div className="w-10" />
          </div>
        )}
        
        <SizeBudgetForm 
          initialPreferences={initialPrefs} 
          requireName={requireName}
          initialName={initialName}
          onSkip={onSkipProp}
          onSave={handleFormSave} 
        />
        
        {/* Allow closing the entire screen if they don't want to set preferences or back out */}
        {profiles.length === 0 && !hasSeenOnboarding && (
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white z-50 transition-all active:scale-95 cursor-pointer"
          >
            <X className="size-6" />
          </button>
        )}
      </div>
    );
  }

  // Locked state if user skipped onboarding and has zero profiles
  if (profiles.length === 0 && hasSeenOnboarding) {
    return (
      <QuickBuyLockedState
        onCreateProfile={() => setShowOnboardingForm(true)}
        onClose={onClose}
      />
    );
  }

  if (showSaved) {
    return (
      <div className="absolute inset-0 z-[100] bg-bg-main">
        <SavedItemsList 
          items={savedProducts} 
          savedForLaterItems={savedForLaterProducts}
          itemQuantities={itemQuantities}
          onBack={() => setShowSaved(false)} 
          onRemove={removeSavedItem} 
          onUpdateQuantity={updateQuantity}
          onClearCart={clearCart}
          onMoveToSavedForLater={moveToSavedForLater}
          onMoveToCart={moveToCart}
        />
      </div>
    );
  }

  const filteredProducts = getFilteredProducts();

  return (
    <div className="absolute inset-0 z-[100] bg-bg-main flex flex-col overflow-hidden animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 sm:py-4 border-b border-border-light bg-bg-main/80 backdrop-blur-md relative z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-2 -ml-3 rounded-full hover:bg-white/5 text-text-primary-light transition-colors font-medium"
        >
          <X className="size-5" />
          <span className="hidden sm:inline">Back to Chat</span>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3">
          {profiles.length >= 1 && activeProfile && (
            <ProfileSwitcher
              profiles={profiles}
              activeProfile={activeProfile}
              switchProfile={switchProfile}
              deleteProfile={deleteProfile}
              onAddProfile={() => setShowAddProfileForm(true)}
              onEditProfile={() => setShowSettings(true)}
            />
          )}

          <div className="flex flex-col gap-1 relative group" title="Change Budget & Sizes">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
            >
              <span className="text-xs font-medium text-text-secondary hidden sm:inline">Budget:</span>
              <span className="text-sm font-bold text-brand-accent">
                {preferences?.maxBudget ? `₹${preferences.maxBudget}` : "Any"}
              </span>
              <Settings2 className="size-3.5 text-text-secondary group-hover:text-text-primary-light" />
            </button>
            
            {/* Dynamic Budget Progress Bar */}
            {preferences?.maxBudget ? (
              <div className="w-full bg-black/40 h-[4px] rounded-full overflow-hidden absolute -bottom-1 left-0 shadow-inner">
                {(() => {
                  const max = preferences.maxBudget;
                  const spent = totalSpent;
                  const percentage = Math.min((spent / max) * 100, 100);
                  let colorClass = "bg-green-500";
                  if (percentage >= 80) colorClass = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse";
                  else if (percentage >= 50) colorClass = "bg-brand-accent";
                  
                  return (
                    <div 
                      className={`h-full transition-all duration-500 ease-out ${colorClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  );
                })()}
              </div>
            ) : null}
          </div>
          <button
            onClick={() => setShowSaved(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-text-primary-light transition-colors relative"
          >
            <ShoppingCart className="size-4.5 text-brand-accent" />
            {cartItemCount > 0 && (
              <span className="font-bold text-[13px]">{cartItemCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Mock Voice Input (Food Mode Only) */}
      {mode === "food" && (
        <div className="absolute top-16 left-4 right-4 z-50">
          <div className="relative">
            <Mic className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-brand-accent animate-pulse" />
            <input 
              type="text" 
              placeholder="e.g. 'Make it spicy with extra raita'"
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-brand-accent/50 shadow-lg"
            />
          </div>
        </div>
      )}

      {/* Swipe Deck */}
      {mode === "food" ? (
        <div className="flex-1 mt-6 z-10 relative">
          <FoodSwipeCardDeck customizations={customizations} />
        </div>
      ) : isLoadingProducts ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="size-8 rounded-full border-4 border-brand-accent/20 border-t-brand-accent animate-spin mb-4" />
          <p className="text-text-secondary font-medium animate-pulse">Loading live collection...</p>
        </div>
      ) : (
        <SwipeCardDeck 
          products={filteredProducts} 
          onSave={saveItem} 
          onOpenSettings={() => setShowSettings(true)}
          hasMore={hasMore}
          onPrefetch={fetchNextPage}
          onBuy={addExpense}
        />
      )}

    </div>
  );
}
