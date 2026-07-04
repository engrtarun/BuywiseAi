"use client";

import React, { useState } from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { ArrowLeft, Trash2, ShoppingBag, Zap, Plus, Minus, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SavedItemsListProps {
  items: QuickBuyProduct[];
  itemQuantities: Record<string, number>;
  onBack: () => void;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

type CheckoutStep = "CART" | "SUMMARY" | "SUCCESS";

export function SavedItemsList({ items, itemQuantities, onBack, onRemove, onUpdateQuantity }: SavedItemsListProps) {
  const [step, setStep] = useState<CheckoutStep>("CART");

  const totalPrice = items.reduce((sum, item) => sum + item.price * (itemQuantities[item.id] || 1), 0);
  const totalItems = items.reduce((sum, item) => sum + (itemQuantities[item.id] || 1), 0);
  const tax = Math.round(totalPrice * 0.18); // 18% mock tax
  const shipping = totalPrice > 5000 ? 0 : 250;
  const finalTotal = totalPrice + tax + shipping;

  const handleCheckout = () => {
    setStep("SUMMARY");
  };

  const handleConfirm = () => {
    setStep("SUCCESS");
  };

  // --- Success State ---
  if (step === "SUCCESS") {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-bg-main relative z-50 p-6 animate-in fade-in duration-500">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="size-24 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.3)]"
        >
          <CheckCircle className="size-12 text-green-500" />
        </motion.div>
        
        <h2 className="text-3xl font-heading font-black text-text-primary-light mb-3 text-center">
          Order Placed!
        </h2>
        <p className="text-text-secondary text-center mb-10 max-w-sm">
          Your stylized fits are secured. We'll send you an email with tracking details shortly.
        </p>

        <button 
          onClick={onBack}
          className="w-full max-w-[280px] py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 active:scale-95 transition-all"
        >
          Back to Chat
        </button>
      </div>
    );
  }

  // --- Summary State ---
  if (step === "SUMMARY") {
    return (
      <div className="flex flex-col h-full w-full bg-bg-main relative z-50 animate-in slide-in-from-right-8 duration-300">
        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-border-light bg-bg-main/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => setStep("CART")} className="p-2 -ml-2 rounded-full hover:bg-white/5 text-text-primary-light transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <h2 className="text-lg font-heading font-bold text-text-primary-light ml-2">Order Summary</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className="w-full max-w-md bg-white/[0.03] border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xl font-black text-text-primary-light mb-6">Price Details</h3>
            
            <div className="space-y-4 text-[15px]">
              <div className="flex justify-between text-text-secondary">
                <span>Items ({totalItems})</span>
                <span className="text-text-primary-light font-medium">₹{totalPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>GST (18%)</span>
                <span className="text-text-primary-light font-medium">₹{tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping</span>
                <span className="text-text-primary-light font-medium">
                  {shipping === 0 ? <span className="text-green-400">FREE</span> : `₹${shipping}`}
                </span>
              </div>
              
              <div className="h-px bg-white/10 w-full my-2" />
              
              <div className="flex justify-between text-lg font-black text-text-primary-light">
                <span>Total Amount</span>
                <span className="text-brand-accent">₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Note about real payment integration */}
            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <p className="text-[13px] text-amber-500/80 leading-relaxed text-center">
                * Note: This is a mock checkout flow. Real payment gateway integration (Stripe/Razorpay) will be implemented here.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-bg-main/90 backdrop-blur-md border-t border-border-light flex justify-center">
          <button 
            onClick={handleConfirm}
            className="w-full max-w-md py-4 rounded-2xl bg-brand-accent text-bg-main font-bold text-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,176,103,0.3)] flex items-center justify-center gap-2"
          >
            Confirm & Pay ₹{finalTotal.toLocaleString('en-IN')}
            <ArrowRightIcon className="size-5" />
          </button>
        </div>
      </div>
    );
  }

  // --- Cart State (Grid Layout) ---
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
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/5 text-text-primary-light transition-colors"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h2 className="text-lg font-heading font-bold text-text-primary-light">
          My Deck Cart
        </h2>
        <div className="text-sm font-bold text-brand-accent pr-2">{totalItems} items</div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary animate-in fade-in zoom-in duration-500">
            <div className="size-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
              <ShoppingBag className="size-10 opacity-50" />
            </div>
            <p className="text-lg font-medium text-text-primary-light mb-2">Your cart is empty.</p>
            <p className="text-sm opacity-60 text-center max-w-[250px] mb-8">
              Your saved fits will appear here. Start swiping to build your collection!
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
            >
              Go Back to Swipe
            </button>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {items.map((item) => {
                const quantity = itemQuantities[item.id] || 1;
                return (
                  <motion.div 
                    key={item.id} 
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="flex flex-col p-3 rounded-2xl bg-bg-input border border-border-light shadow-sm group hover:border-white/10 transition-colors"
                  >
                    {/* Image Area */}
                    <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-white/5 mb-3 relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      
                      {/* Remove Button (Absolute top right) */}
                      <button
                        onClick={() => onRemove(item.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-red-400 hover:bg-black/60 transition-all"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-[13px] font-medium text-text-secondary leading-tight line-clamp-2 mb-1">
                        {item.name}
                      </h3>
                      <div className="text-brand-accent font-black text-lg mt-auto tracking-tight">
                        ₹{item.price.toLocaleString('en-IN')}
                      </div>
                      
                      {/* Quantity Control */}
                      <div className="flex items-center justify-between mt-3 bg-black/20 rounded-lg border border-white/5 p-1">
                        <button onClick={() => quantity > 1 ? onUpdateQuantity(item.id, quantity - 1) : onRemove(item.id)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-text-primary-light">
                          <Minus className="size-3" />
                        </button>
                        <span className="text-[13px] font-bold text-text-primary-light">{quantity}</span>
                        <button onClick={() => onUpdateQuantity(item.id, quantity + 1)} className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-text-primary-light">
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Footer / Buy All */}
      {items.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-bg-main/90 backdrop-blur-md border-t border-border-light flex justify-center">
          <button 
            onClick={handleCheckout}
            className="w-full max-w-md py-4 rounded-2xl bg-brand-accent text-bg-main font-black text-lg hover:brightness-110 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,176,103,0.3)] flex items-center justify-center gap-2"
          >
            <Zap className="size-5 fill-bg-main" />
            Checkout • ₹{totalPrice.toLocaleString('en-IN')}
          </button>
        </div>
      )}

    </div>
  );
}

// Inline component for arrow
function ArrowRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
