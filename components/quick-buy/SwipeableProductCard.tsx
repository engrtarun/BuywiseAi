"use client";

import React, { useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo } from "framer-motion";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { Star, Check, ShoppingCart, Zap, Heart, ArrowRight } from "lucide-react";

interface SwipeableProductCardProps {
  product: QuickBuyProduct;
  onSwipeLeft: (id: string) => void;
  onSwipeRight: (id: string) => void;
  isTop: boolean;
  index: number;
}

export function SwipeableProductCard({ product, onSwipeLeft, onSwipeRight, isTop, index }: SwipeableProductCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Responsive layout state
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3D Tilt State (Mouse)
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useTransform(tiltY, [-100, 100], [10, -10]); // Inverse Y for realistic tilt
  const rotateYBase = useTransform(tiltX, [-100, 100], [-10, 10]);

  // Swipe Animations (Drag)
  // Standard Tinder rotation
  const rotateZ = useTransform(x, [-200, 200], [-8, 8]);
  // 3D Flip effect as it swipes off
  const rotateYSwipe = useTransform(x, [-300, 300], [25, -25]);
  
  // Combine hover tilt with drag swipe rotation
  const rotateY = useTransform(() => rotateYBase.get() + rotateYSwipe.get());

  // Visual Overlays (LIKE / SKIP)
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const skipOpacity = useTransform(x, [-50, -150], [0, 1]);

  // Card Background Color shift
  const bgGradient = useTransform(
    x,
    [-150, 0, 150],
    [
      "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(20,20,22,1) 100%)",
      "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(20,20,22,1) 100%)"
    ]
  );

  // Border Color shift
  const borderColor = useTransform(
    x,
    [-150, 0, 150],
    [
      "rgba(239,68,68,0.3)",
      "rgba(255,255,255,0.1)",
      "rgba(34,197,94,0.3)"
    ]
  );

  // Z-Index calculations for stacked deck
  const scale = isTop ? 1 : 1 - (index * 0.05);
  const yOffset = isTop ? 0 : index * 12;

  // Local state for actions
  const [inCart, setInCart] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const swipeThreshold = 100;

    if (offset > swipeThreshold || velocity > 500) {
      await controls.start({ x: 500, rotateZ: 15, rotateY: -30, opacity: 0, transition: { duration: 0.3 } });
      onSwipeRight(product.id);
    } else if (offset < -swipeThreshold || velocity < -500) {
      await controls.start({ x: -500, rotateZ: -15, rotateY: 30, opacity: 0, transition: { duration: 0.3 } });
      onSwipeLeft(product.id);
    } else {
      // Snap back
      controls.start({ x: 0, rotateZ: 0, rotateY: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  };

  const manualSwipe = async (direction: "left" | "right") => {
    if (direction === "right") {
      await controls.start({ x: 500, rotateZ: 15, rotateY: -30, opacity: 0, transition: { duration: 0.3 } });
      onSwipeRight(product.id);
    } else {
      await controls.start({ x: -500, rotateZ: -15, rotateY: 30, opacity: 0, transition: { duration: 0.3 } });
      onSwipeLeft(product.id);
    }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowToast("Order placed!");
    setTimeout(() => setShowToast(null), 2000);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTop) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Normalize to -100 to 100
    tiltX.set(((mouseX / rect.width) - 0.5) * 200);
    tiltY.set(((mouseY / rect.height) - 0.5) * 200);
  };

  const handleMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={controls}
      style={{
        x,
        rotateZ,
        rotateX,
        rotateY,
        scale,
        y: yOffset,
        background: bgGradient,
        borderColor: borderColor,
        transformStyle: "preserve-3d", // Important for 3D children
        perspective: 1000,
        touchAction: "pan-y" // Allow vertical scrolling on mobile while locking horizontal
      }}
      className={`
        absolute w-full max-w-[340px] h-[520px] 
        rounded-[32px] border border-white/[0.08] backdrop-blur-md shadow-2xl
        flex flex-col overflow-hidden will-change-transform
        ${!isTop ? "pointer-events-none" : "pointer-events-auto"}
      `}
    >
      {/* 3D Inner Content Container */}
      <div 
        style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}
        className="w-full h-full flex flex-col pointer-events-none" // Disable pointer events so drag works on main div
      >
        
        {/* Swipe Overlays */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 z-50 pointer-events-none border-4 border-brand-accent text-brand-accent font-black text-4xl px-4 py-1 rounded-xl rotate-[-15deg] shadow-[0_0_20px_rgba(255,176,103,0.3)] bg-black/20 flex items-center gap-2">
          <Heart className="size-8 fill-brand-accent text-brand-accent" /> SAVED
        </motion.div>
        <motion.div style={{ opacity: skipOpacity }} className="absolute top-8 right-8 z-50 pointer-events-none border-4 border-white/50 text-white/50 font-black text-4xl px-4 py-1 rounded-xl rotate-[15deg] shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-black/20">
          SKIP
        </motion.div>

        {/* Product Image Area */}
        <div className="relative w-full h-[65%] shrink-0 overflow-hidden bg-white/5 p-4 pb-0 pointer-events-auto">
          <motion.img 
            src={product.image} 
            alt={product.name}
            style={{ transform: "translateZ(20px)" }}
            className="w-full h-full object-cover rounded-2xl rounded-b-none shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
          />
          
          {/* Add to Cart Checkbox (Top Right) */}
          <div className="absolute top-6 right-6 z-40 pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); setInCart(!inCart); }}
              className={`
                size-10 rounded-xl flex items-center justify-center backdrop-blur-md transition-all duration-300
                ${inCart 
                  ? "bg-brand-accent text-bg-main shadow-[0_0_15px_rgba(255,176,103,0.5)]" 
                  : "bg-black/40 border border-white/20 text-white hover:bg-black/60"
                }
              `}
            >
              {inCart ? <Check className="size-5" /> : <ShoppingCart className="size-5" />}
            </button>
          </div>
          
          {/* Toast */}
          {showToast && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-md border border-white/10 z-50 animate-in zoom-in duration-200">
              {showToast}
            </div>
          )}
        </div>

        {/* Product Details Area */}
        <div className="flex-1 px-5 pt-3 pb-4 flex flex-col justify-between pointer-events-auto" style={{ transform: "translateZ(40px)" }}>
          
          {/* Info */}
          <div>
            <h3 className="text-xl font-heading font-extrabold text-text-primary-light line-clamp-1">
              {product.name}
            </h3>
            <div className="text-2xl font-black text-brand-accent mt-0.5 tracking-tight">
              ₹{product.price}
            </div>
            
            {/* Rating Stars */}
            <div className="flex items-center gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`size-4 ${star <= Math.round(product.rating) ? "fill-brand-accent text-brand-accent" : "fill-bg-input text-border-light"}`} 
                />
              ))}
              <span className="text-sm font-sans text-text-secondary ml-1">
                {product.rating}
              </span>
            </div>
          </div>

          {/* Action Buttons (Bottom) */}
          <div className="flex gap-3 mt-4">
            
            {/* BUY ONE CLICK */}
            <motion.button
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={handleBuy}
              className="flex-1 relative overflow-hidden rounded-xl bg-brand-accent text-bg-main flex flex-col items-center justify-center py-2.5 shadow-[0_0_20px_rgba(255,176,103,0.2)] hover:shadow-[0_0_30px_rgba(255,176,103,0.4)] transition-shadow"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              <span className="font-heading font-black text-lg leading-none z-10 flex items-center gap-1.5">
                <Zap className="size-4 fill-bg-main" /> BUY
              </span>
              <span className="text-[10px] font-bold tracking-wider opacity-80 mt-0.5 z-10">ONE CLICK</span>
            </motion.button>
            
            {/* NEXT / SAVE */}
            <motion.button
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={(e) => { e.stopPropagation(); manualSwipe(isMobile ? "right" : "left"); }}
              className="flex-1 rounded-xl bg-white/5 border border-white/10 text-text-primary-light flex items-center justify-center gap-2 font-bold hover:bg-white/10 transition-colors shadow-inner"
            >
              {isMobile ? (
                <>
                  <Heart className="size-4.5 text-red-400" />
                  Save
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="size-4.5 text-text-secondary" />
                </>
              )}
            </motion.button>
            
          </div>
        </div>

      </div>
    </motion.div>
  );
}
