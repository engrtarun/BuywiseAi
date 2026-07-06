"use client";

import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, AnimatePresence } from "framer-motion";
import { FoodItem } from "@/lib/quickBuyMockFoodData";
import { useSwipeFeedback } from "@/hooks/useSwipeFeedback";
import { Star, Check, Zap, ArrowRight, Bike, X, ShieldCheck } from "lucide-react";
import confetti from "canvas-confetti";

interface FoodSwipeCardProps {
  product: FoodItem;
  customizations?: string[];
  onSwipeLeft: (product: FoodItem) => void;
  onSwipeRight: (product: FoodItem) => void;
  isTop: boolean;
  index: number;
}

export function FoodSwipeCard({ product, customizations = [], onSwipeLeft, onSwipeRight, isTop, index }: FoodSwipeCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  const { playAccept, playReject } = useSwipeFeedback();

  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const rotateZ = useTransform(x, [-200, 200], [-8, 8]);
  
  // Custom Food Mode Gradients
  const bgGradient = useTransform(
    x,
    [-150, 0, 150],
    [
      "linear-gradient(135deg, rgba(156,163,175,0.1) 0%, rgba(26,17,10,1) 100%)", // Gray left
      "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      "linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(26,17,10,1) 100%)" // Green right
    ]
  );

  const borderColor = useTransform(
    x,
    [-150, 0, 150],
    [
      "rgba(156,163,175,0.3)",
      "rgba(255,255,255,0.1)",
      "rgba(34,197,94,0.4)"
    ]
  );

  const scale = isTop ? 1 : 1 - (index * 0.05);
  const yOffset = isTop ? 0 : index * 12;

  const [showRightSwipeAnim, setShowRightSwipeAnim] = useState(false);
  const [showLeftSwipeAnim, setShowLeftSwipeAnim] = useState(false);

  const triggerRightSwipe = async () => {
    setShowRightSwipeAnim(true);
    try {
      setShowRightSwipeAnim(true);
      playAccept();
      confetti({ 
        particleCount: 100, 
        spread: 70, 
        origin: { y: 0.6 },
        colors: ['#22c55e', '#FC8019', '#ffffff'] 
      });
      
      // Animate card off screen
      await controls.start({ x: 500, rotateZ: 15, opacity: 0, transition: { duration: 0.4, ease: "easeOut" } });
      setTimeout(() => onSwipeRight(product), 200);
    } catch (error) {
      // Ignore unmounted component animation errors
    }
  };

  const triggerLeftSwipe = async () => {
    try {
      setShowLeftSwipeAnim(true);
      playReject();
      await controls.start({ x: -500, rotateZ: -15, opacity: 0, transition: { duration: 0.4, ease: "easeOut" } });
      setTimeout(() => onSwipeLeft(product), 100);
    } catch (error) {
      // Ignore unmounted component animation errors
    }
  };

  const handleDragEnd = async (event: any, info: PanInfo) => {
    try {
      const offset = info.offset.x;
      const velocity = info.velocity.x;
      const swipeThreshold = 100;

      if (offset > swipeThreshold || velocity > 500) {
        triggerRightSwipe();
      } else if (offset < -swipeThreshold || velocity < -500) {
        triggerLeftSwipe();
      } else {
        controls.start({ x: 0, rotateZ: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
      }
    } catch (error) {
      // Ignore unmounted component animation errors
    }
  };

  return (
    <>
      {/* Global Success Overlay Animations */}
      {showRightSwipeAnim && typeof window !== "undefined" && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-green-500/10 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ scale: 0.5, opacity: 0, x: -100 }}
            animate={{ scale: [0.5, 1.2, 1.5], opacity: [0, 1, 0], x: [-100, 0, 200] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 text-green-400 drop-shadow-[0_0_30px_rgba(34,197,94,0.8)]"
          >
            <Bike className="size-32" />
            <motion.div 
              className="absolute top-1/2 -left-10 w-20 h-2 bg-green-400/50 rounded-full blur-sm"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: [0, 1, 0], scaleX: [0, 2, 0] }}
              transition={{ duration: 0.4 }}
            />
          </motion.div>
        </div>
      )}

      {showLeftSwipeAnim && typeof window !== "undefined" && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: [0.5, 1.1, 1], opacity: [0, 1, 0] }}
            transition={{ duration: 0.5 }}
            className="text-gray-400/60"
          >
            <X className="size-32" />
          </motion.div>
        </div>
      )}

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{
          x,
          rotateZ,
          scale,
          y: yOffset,
          background: bgGradient,
          borderColor: borderColor,
          touchAction: "pan-y"
        }}
        className={`
          absolute w-full max-w-[340px] h-[520px] 
          rounded-[32px] border border-white/[0.08] backdrop-blur-xl shadow-2xl
          flex flex-col overflow-hidden will-change-transform bg-bg-input
          ${!isTop ? "pointer-events-none" : "pointer-events-auto"}
        `}
      >
        {/* 60% Hero Image Area */}
        <div className="relative w-full h-[55%] shrink-0 overflow-hidden bg-white/5">
          <img 
            src={product.image} 
            alt={product.dishName}
            className="w-full h-full object-cover"
          />
          
          {/* ETA Badge */}
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg z-10 text-ink-deeper">
            <Bike className="size-4 text-brand-accent" />
            <span className="font-bold text-xs">{product.etaMinutes} MINS</span>
          </div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-bg-input to-transparent opacity-90 pointer-events-none" />
          
          {/* Customizations Badges */}
          {customizations.length > 0 && (
            <div className="absolute bottom-4 left-5 right-5 flex flex-wrap gap-1.5 z-20">
              {customizations.map((cust, i) => (
                <div key={i} className="flex items-center gap-1 bg-brand-accent/20 border border-brand-accent/40 text-brand-accent text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm">
                  <Check className="size-3" />
                  {cust}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 45% Details Area */}
        <div className="flex-1 px-6 pb-6 flex flex-col justify-between -mt-2 z-10">
          
          {/* Dish & Restaurant */}
          <div>
            <h3 className="text-2xl font-heading font-extrabold text-text-primary-light leading-tight line-clamp-2 drop-shadow-md">
              {product.dishName}
            </h3>
            <p className="text-sm font-semibold text-text-secondary mt-1">
              {product.restaurantName} • {product.location}
            </p>
          </div>

          {/* Pricing & Coupon */}
          <div className="flex flex-col gap-1 my-3 bg-white/[0.03] rounded-2xl p-3 border border-white/5">
            <div className="flex items-end gap-2">
              <span className="text-3xl font-black text-brand-accent tracking-tighter">
                ₹{product.price}
              </span>
              <span className="text-sm font-bold text-text-secondary line-through mb-1.5">
                ₹{product.originalPrice}
              </span>
            </div>
            
            {/* Auto Coupon Hook */}
            {product.couponCode && (
              <div className="flex items-center gap-1.5 text-green-400 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-md w-fit mt-1">
                <ShieldCheck className="size-3.5" />
                BuyWise applied '{product.couponCode}'
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); triggerRightSwipe(); }}
              className="flex-[2] relative overflow-hidden rounded-xl bg-brand-accent text-bg-main flex items-center justify-center py-3.5 shadow-[0_0_20px_rgba(252,128,25,0.2)] hover:shadow-[0_0_30px_rgba(252,128,25,0.4)] transition-shadow"
            >
              <span className="font-heading font-black text-lg leading-none z-10 flex items-center gap-2 uppercase tracking-wide">
                <Zap className="size-5 fill-bg-main" /> Order Now
              </span>
            </motion.button>
            
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); triggerLeftSwipe(); }}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 text-text-primary-light flex items-center justify-center gap-2 font-bold hover:bg-white/10 transition-colors shadow-inner"
            >
              Skip
            </motion.button>
          </div>
          
        </div>
      </motion.div>
    </>
  );
}
