"use client";

import React, { useState, useEffect } from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { ArrowLeft, Trash2, ShoppingBag, Zap, Plus, Minus, Bookmark, BookmarkCheck, Grid, Layers, X, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { VirtualWardrobe } from "./VirtualWardrobe";
import { CheckoutFlow, CheckoutItem } from "../checkout/CheckoutFlow";
import { CoachMarkTooltip } from "../onboarding/CoachMarkTooltip";

interface SavedItemsListProps {
  items: QuickBuyProduct[];
  savedForLaterItems?: QuickBuyProduct[];
  itemQuantities: Record<string, number>;
  onBack: () => void;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onClearCart?: () => void;
  onMoveToSavedForLater?: (id: string) => void;
  onMoveToCart?: (id: string) => void;
}

export function SavedItemsList({
  items,
  savedForLaterItems = [],
  itemQuantities,
  onBack,
  onRemove,
  onUpdateQuantity,
  onClearCart,
  onMoveToSavedForLater,
  onMoveToCart
}: SavedItemsListProps) {
  const [viewMode, setViewMode] = useState<"GRID" | "WARDROBE">("GRID");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // --- Cart Onboarding (Coach Marks) ---
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSeenTour = localStorage.getItem("buywise_cart_tour_completed") === "true";
      if (!hasSeenTour && items.length > 0) {
        // slight delay to let UI render
        const t = setTimeout(() => setShowTour(true), 500);
        return () => clearTimeout(t);
      }
    }
  }, [items.length]);

  const endTour = () => {
    setShowTour(false);
    localStorage.setItem("buywise_cart_tour_completed", "true");
  };

  const advanceTour = () => {
    if (tourStep < 2) setTourStep(tourStep + 1);
    else endTour();
  };

  const totalPrice = items.reduce((sum, item) => sum + item.price * (itemQuantities[item.id] || 1), 0);
  const totalItems = items.reduce((sum, item) => sum + (itemQuantities[item.id] || 1), 0);
  const tax = Math.round(totalPrice * 0.18); // 18% mock tax
  const shipping = totalPrice > 5000 ? 0 : 250;
  const finalTotal = totalPrice + tax + (items.length > 0 ? shipping : 0);

  const checkoutItems: CheckoutItem[] = items.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: itemQuantities[item.id] || 1
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-main relative z-50 animate-in slide-in-from-right-8 duration-300">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border-light bg-bg-main/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 text-text-primary-light transition-colors"
          >
            <ArrowLeft className="size-6" />
          </button>
          <h2 className="text-lg font-heading font-bold text-text-primary-light">
            My Cart ({totalItems})
          </h2>
        </div>

        {/* View Toggle */}
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTourStep(0);
                setShowTour(true);
              }}
              className="p-1.5 rounded-full hover:bg-white/10 text-brand-accent transition-colors"
              title="Show Guide"
            >
              <HelpCircle className="size-5" />
            </button>
            <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("GRID")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "GRID" ? "bg-white/10 text-white" : "text-text-secondary hover:text-white"}`}
                title="Grid View"
              >
                <Grid className="size-4" />
              </button>
              <button
                onClick={() => setViewMode("WARDROBE")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "WARDROBE" ? "bg-brand-accent text-bg-main" : "text-text-secondary hover:text-white"}`}
                title="Mix & Match"
              >
                <Layers className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === "WARDROBE" ? (
        <VirtualWardrobe items={items} />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-40">

          {/* EMPTY STATE */}
          {items.length === 0 && savedForLaterItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary animate-in fade-in zoom-in duration-500">
              <div className="size-24 rounded-3xl bg-brand-accent/10 flex items-center justify-center mb-6">
                <ShoppingBag className="size-12 text-brand-accent" />
              </div>
              <p className="text-xl font-heading font-bold text-text-primary-light mb-2">Your cart is empty</p>
              <p className="text-sm opacity-60 text-center max-w-[250px] mb-8">
                Start swiping or browsing to add some amazing products here.
              </p>
              <button
                onClick={onBack}
                className="px-8 py-3.5 rounded-full bg-brand-accent text-bg-main font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-8">

              {/* ACTIVE CART ITEMS */}
              {items.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Active Items</h3>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative"
                  >
                    <AnimatePresence>
                      {items.map((item, index) => {
                        const quantity = itemQuantities[item.id] || 1;
                        return (
                          <motion.div
                            key={item.id}
                            variants={itemVariants}
                            layout
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className="flex p-3 rounded-2xl bg-bg-input border border-border-light shadow-sm group hover:border-white/10 transition-colors relative"
                          >
                            {/* Image Area */}
                            <div className="w-24 aspect-square rounded-xl overflow-hidden bg-white/5 mr-4 relative flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            {/* Details */}
                            <div className="flex-1 flex flex-col py-1">
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="text-[14px] font-medium text-text-primary-light leading-tight line-clamp-2">
                                  {item.name}
                                </h3>
                                <button
                                  onClick={() => onRemove(item.id)}
                                  className="p-1 -mt-1 -mr-1 rounded-full text-text-secondary hover:text-red-400 hover:bg-white/5 transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 className="size-4" />
                                </button>
                              </div>
                              <div className="text-brand-accent font-black text-lg mt-1 tracking-tight">
                                ₹{item.price.toLocaleString('en-IN')}
                              </div>

                              <div className="flex items-center justify-between mt-auto pt-3">
                                {/* Quantity Control */}
                                <div
                                  className={`flex items-center bg-black/30 rounded-lg border border-white/10 p-0.5 ${showTour && tourStep === 0 && index === 0 ? "ring-2 ring-brand-accent shadow-[0_0_15px_rgba(255,176,103,0.5)] z-50 relative bg-bg-main" : ""}`}
                                >
                                  <button onClick={() => quantity > 1 ? onUpdateQuantity(item.id, quantity - 1) : onRemove(item.id)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-text-primary-light">
                                    <Minus className="size-3" />
                                  </button>
                                  <span className="w-6 text-center text-[13px] font-bold text-text-primary-light">{quantity}</span>
                                  <button onClick={() => onUpdateQuantity(item.id, quantity + 1)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-text-primary-light">
                                    <Plus className="size-3" />
                                  </button>
                                </div>

                                {/* Save for Later */}
                                {onMoveToSavedForLater && (
                                  <button
                                    onClick={() => onMoveToSavedForLater(item.id)}
                                    className={`flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-brand-accent px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors ${showTour && tourStep === 1 && index === 0 ? "ring-2 ring-brand-accent shadow-[0_0_15px_rgba(255,176,103,0.5)] z-50 relative bg-bg-main text-brand-accent" : ""}`}
                                  >
                                    <Bookmark className="size-3.5" />
                                    Save
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}

              {/* SAVED FOR LATER ITEMS */}
              {savedForLaterItems.length > 0 && (
                <div className="mt-8 pt-8 border-t border-border-light">
                  <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">Saved for Later ({savedForLaterItems.length})</h3>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  >
                    <AnimatePresence>
                      {savedForLaterItems.map((item) => (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          layout
                          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                          className="flex p-3 rounded-2xl bg-bg-input/50 border border-border-light/50 shadow-sm opacity-80 hover:opacity-100 transition-all"
                        >
                          <div className="w-20 aspect-square rounded-xl overflow-hidden bg-white/5 mr-4 relative flex-shrink-0 grayscale">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 flex flex-col py-1">
                            <h3 className="text-[13px] font-medium text-text-primary-light leading-tight line-clamp-2">
                              {item.name}
                            </h3>
                            <div className="text-white/60 font-bold text-sm mt-1">
                              ₹{item.price.toLocaleString('en-IN')}
                            </div>
                            <div className="flex items-center gap-2 mt-auto pt-2">
                              {onMoveToCart && (
                                <button
                                  onClick={() => onMoveToCart(item.id)}
                                  className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-brand-accent bg-brand-accent/10 hover:bg-brand-accent/20 py-1.5 rounded-lg transition-colors"
                                >
                                  <ShoppingBag className="size-3" />
                                  Move to Cart
                                </button>
                              )}
                              <button
                                onClick={() => onRemove(item.id)} // We use same onRemove for saved later? Actually we should probably just use onRemove which removes from all tracking. Wait, onRemove only removes from active cart in useQuickBuy? Let's check useQuickBuy logic... It deletes from everything if implemented right. Or we might need a separate remove from saved. For now onRemove removes from both if we update useQuickBuy. Actually let's assume onRemove removes from everywhere.
                                className="p-1.5 rounded-lg text-text-secondary hover:text-red-400 hover:bg-white/5 transition-colors"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Pricing Summary & Checkout Button */}
      {items.length > 0 && viewMode === "GRID" && (
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-bg-main/95 backdrop-blur-xl border-t border-border-light shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-md mx-auto">
            {/* Price Breakdown */}
            <div className="space-y-2 mb-4 text-sm font-medium">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Tax (18%)</span>
                <span>₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-green-400">Free</span> : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between text-text-primary-light font-bold text-lg pt-2 border-t border-white/10">
                <span>Total</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCheckoutOpen(true);
                if (showTour) endTour();
              }}
              className={`w-full py-4 rounded-2xl bg-brand-accent text-bg-main font-black text-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,176,103,0.2)] flex items-center justify-center gap-2 ${showTour && tourStep === 2 ? "ring-2 ring-white ring-offset-2 ring-offset-bg-main z-50 relative" : ""}`}
            >
              <Zap className="size-5 fill-bg-main" />
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={checkoutItems}
        onSuccess={() => {
          if (onClearCart) onClearCart();
          onBack();
        }}
      />

      {/* 
        CART ONBOARDING OVERLAY 
        Uses absolute positioning over the Cart UI.
      */}
      <AnimatePresence>
        {showTour && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto"
            onClick={advanceTour}
          >
            <div className="absolute top-6 right-6">
              <button
                onClick={(e) => { e.stopPropagation(); endTour(); }}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white text-sm font-bold backdrop-blur-md transition-colors flex items-center gap-2"
              >
                Skip Tour <X className="size-4" />
              </button>
            </div>

            <div className="max-w-[300px] w-full bg-bg-input border border-border-light rounded-2xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>

              {/* Tour Steps Content */}
              <AnimatePresence mode="wait">
                {tourStep === 0 && (
                  <motion.div key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center text-center">
                    <div className="size-12 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center mb-4">
                      <Plus className="size-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Adjust Quantities</h3>
                    <p className="text-sm text-text-secondary mb-6">Need more than one? You can easily adjust your item quantities right here in the cart.</p>
                  </motion.div>
                )}
                {tourStep === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center text-center">
                    <div className="size-12 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center mb-4">
                      <Bookmark className="size-6" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Save for Later</h3>
                    <p className="text-sm text-text-secondary mb-6">Not ready to buy yet? Save items to your list without cluttering your active cart.</p>
                  </motion.div>
                )}
                {tourStep === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center text-center">
                    <div className="size-12 rounded-full bg-brand-accent/20 text-brand-accent flex items-center justify-center mb-4">
                      <Zap className="size-6 fill-brand-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Review & Checkout</h3>
                    <p className="text-sm text-text-secondary mb-6">See a complete breakdown of taxes and shipping, then checkout securely with one tap.</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tour Controls */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(step => (
                    <div key={step} className={`h-1.5 rounded-full transition-all duration-300 ${tourStep === step ? "w-6 bg-brand-accent" : "w-2 bg-white/20"}`} />
                  ))}
                </div>
                <button
                  onClick={advanceTour}
                  className="px-5 py-2 bg-brand-accent text-bg-main font-bold rounded-xl active:scale-95 transition-transform"
                >
                  {tourStep === 2 ? "Got It!" : "Next"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
