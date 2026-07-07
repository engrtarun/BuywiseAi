"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, useAnimation, PanInfo, AnimatePresence } from "framer-motion";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { useSwipeFeedback } from "@/hooks/useSwipeFeedback";
import { Star, Check, ShoppingCart, Zap, Heart, ArrowRight, Package, PartyPopper } from "lucide-react";
import { CheckoutFlow, CheckoutItem } from "../checkout/CheckoutFlow";
import Image from "next/image";

interface SwipeableProductCardProps {
  product: QuickBuyProduct;
  onSwipeLeft: (product: QuickBuyProduct) => void;
  onSwipeRight: (product: QuickBuyProduct) => void;
  onBuy?: (product: QuickBuyProduct) => void;
  isTop: boolean;
  index: number;
}

export function SwipeableProductCard({ product, onSwipeLeft, onSwipeRight, onBuy, isTop, index }: SwipeableProductCardProps) {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  const { playAccept, playReject } = useSwipeFeedback();

  // Responsive layout state
  const [isMobile, setIsMobile] = useState(true);
  const cardRectRef = useRef<DOMRect | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      cardRectRef.current = null;
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
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

  // Z-Index calculations for stacked deck
  const scale = isTop ? 1 : 1 - (index * 0.05);
  const yOffset = isTop ? 0 : index * 12;

  // Local state for actions
  const [showToast, setShowToast] = useState<string | null>(null);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const swipeThreshold = 100;

    try {
      if (offset > swipeThreshold || velocity > 500) {
        await controls.start({ x: 500, rotateZ: 15, rotateY: -30, opacity: 0, transition: { duration: 0.3 } });
        playAccept();
        onSwipeRight(product);
      } else if (offset < -swipeThreshold || velocity < -500) {
        await controls.start({ x: -500, rotateZ: -15, rotateY: 30, opacity: 0, transition: { duration: 0.3 } });
        playReject();
        onSwipeLeft(product);
      } else {
        // Snap back
        controls.start({ x: 0, rotateZ: 0, rotateY: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
      }
    } catch (error) {
      // Ignore unmounted component animation errors
    }
  };

  const manualSwipe = async (direction: "left" | "right") => {
    try {
      if (direction === "right") {
        await controls.start({ x: 500, rotateZ: 15, rotateY: -30, opacity: 0, transition: { duration: 0.3 } });
        playAccept();
        onSwipeRight(product);
      } else {
        await controls.start({ x: -500, rotateZ: -15, rotateY: 30, opacity: 0, transition: { duration: 0.3 } });
        playReject();
        onSwipeLeft(product);
      }
    } catch (error) {
      // Ignore unmounted component animation errors
    }
  };

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showFlyingBox, setShowFlyingBox] = useState(false);

  const handleBuy = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsCheckoutOpen(true);
  };

  const handleCheckoutSuccess = () => {
    setIsCheckoutOpen(false);
    if (onBuy) onBuy(product);
    
    // Show toast & auto-swipe
    setShowToast(`Order Placed! ₹${product.price}`);
    setShowFlyingBox(true);
    
    setTimeout(() => {
      setShowToast(null);
      setShowFlyingBox(false);
      manualSwipe("right");
    }, 1200);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTop) return;
    cardRectRef.current = e.currentTarget.getBoundingClientRect();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isTop) return;
    
    if (!cardRectRef.current) {
      cardRectRef.current = e.currentTarget.getBoundingClientRect();
    }
    
    const rect = cardRectRef.current;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const nextTiltX = ((mouseX / rect.width) - 0.5) * 200;
    const nextTiltY = ((mouseY / rect.height) - 0.5) * 200;
    
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      tiltX.set(nextTiltX);
      tiltY.set(nextTiltY);
    });
  };

  const handleMouseLeave = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    tiltX.set(0);
    tiltY.set(0);
  };

  const cardStyle = {
    x,
    rotateZ,
    scale,
    y: yOffset,
    background: "rgba(20,20,22,0.9)",
    borderColor: "rgba(255,255,255,0.08)",
    touchAction: "pan-y"
  } as any;

  if (isTop) {
    cardStyle.rotateX = rotateX;
    cardStyle.rotateY = rotateY;
    cardStyle.background = "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)";
    cardStyle.borderColor = "rgba(255,255,255,0.1)";
    cardStyle.transformStyle = "preserve-3d";
    cardStyle.perspective = 1000;
  }

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={controls}
      style={cardStyle}
      className={`
        absolute w-full max-w-[340px] h-[520px] 
        rounded-[32px] border border-white/[0.08] shadow-2xl
        flex flex-col overflow-hidden will-change-transform bg-bg-main
        ${isTop ? "backdrop-blur-xl pointer-events-auto" : "pointer-events-none"}
      `}
    >
      {/* Accept Tint Overlay */}
      {isTop && (
        <motion.div
          style={{
            opacity: likeOpacity,
            background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(20,20,22,1) 100%)",
            borderColor: "rgba(34,197,94,0.3)",
            borderStyle: "solid",
            borderWidth: "1px"
          }}
          className="absolute inset-0 pointer-events-none rounded-[32px]"
        />
      )}
      {/* Reject Tint Overlay */}
      {isTop && (
        <motion.div
          style={{
            opacity: skipOpacity,
            background: "linear-gradient(135deg, rgba(239,68,68,0.1) 0%, rgba(20,20,22,1) 100%)",
            borderColor: "rgba(239,68,68,0.3)",
            borderStyle: "solid",
            borderWidth: "1px"
          }}
          className="absolute inset-0 pointer-events-none rounded-[32px]"
        />
      )}

      {/* 3D Inner Content Container */}
      <div 
        style={{ transform: isTop ? "translateZ(30px)" : undefined, transformStyle: isTop ? "preserve-3d" : undefined }}
        className="w-full h-full flex flex-col pointer-events-none" // Disable pointer events so drag works on main div
      >
        
        {/* Swipe Overlays */}
        {isTop && (
          <>
            <motion.div style={{ opacity: likeOpacity }} className="absolute top-8 left-8 z-50 pointer-events-none border-4 border-brand-accent text-brand-accent font-black text-4xl px-4 py-1 rounded-xl rotate-[-15deg] shadow-[0_0_20px_rgba(255,176,103,0.3)] bg-black/20 flex items-center gap-2">
              <ShoppingCart className="size-8 fill-brand-accent text-brand-accent" /> CART
            </motion.div>
            <motion.div style={{ opacity: skipOpacity }} className="absolute top-8 right-8 z-50 pointer-events-none border-4 border-white/50 text-white/50 font-black text-4xl px-4 py-1 rounded-xl rotate-[15deg] shadow-[0_0_20px_rgba(255,255,255,0.1)] bg-black/20">
              SKIP
            </motion.div>
          </>
        )}

        {/* Product Image Area */}
        <div className="relative w-full h-[55%] shrink-0 overflow-hidden bg-white/5 pointer-events-auto">
          <motion.div
            style={{ 
              transform: isTop ? "translateZ(20px)" : undefined,
              width: '100%',
              height: '100%',
              position: 'absolute',
              inset: 0
            }}
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 340px"
              priority={isTop || index === 1}
              className="object-cover"
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkqPwfAAIAAsK6xP7CAAAAAElFTkSuQmCC"
            />
          </motion.div>
          
          <div className="absolute inset-0 bg-gradient-to-t from-bg-main to-transparent opacity-90 pointer-events-none" />
          
          {/* Add to Cart Checkbox (Top Right) */}
          <div className="absolute top-6 right-6 z-40 pointer-events-auto">
            <button
              onClick={(e) => { e.stopPropagation(); manualSwipe("right"); }}
              className="size-10 rounded-xl flex items-center justify-center backdrop-blur-md transition-all duration-300 bg-black/40 border border-white/20 text-white hover:bg-brand-accent hover:text-bg-main shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              <ShoppingCart className="size-5" />
            </button>
          </div>
          
          {/* Toast */}
          <AnimatePresence>
            {showToast && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-5 py-3 rounded-2xl font-black text-base backdrop-blur-md border border-white/20 z-50 shadow-2xl flex items-center justify-center whitespace-nowrap gap-2"
              >
                <PartyPopper className="size-5 text-brand-accent" />
                {showToast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Flying Box Micro-animation */}
          <AnimatePresence>
            {showFlyingBox && (
              <motion.div
                initial={{ opacity: 1, x: "-50%", y: "-50%", scale: 1 }}
                animate={{ 
                  opacity: 0, 
                  x: "150%", 
                  y: "-250%", 
                  scale: 0.5,
                  rotate: 45
                }}
                transition={{ duration: 0.8, ease: "anticipate" }}
                className="absolute top-1/2 left-1/2 z-40 bg-brand-accent p-3 rounded-xl shadow-lg"
              >
                <Package className="size-6 text-bg-main" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Product Details Area */}
        <div className="flex-1 px-6 pb-6 flex flex-col justify-between -mt-2 z-10 pointer-events-auto" style={{ transform: isTop ? "translateZ(40px)" : undefined }}>
          
          {/* Info */}
          <div className="relative">
            {product.dealBadge && (
              <div className="absolute -top-7 left-0 bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                {product.dealBadge}
              </div>
            )}
            <h3 className="text-xl font-heading font-extrabold text-text-primary-light line-clamp-1">
              {product.name}
            </h3>
            <div className="flex items-end gap-2 mt-0.5">
              <div className="text-2xl font-black text-brand-accent tracking-tight">
                ₹{product.price}
              </div>
              {product.originalPrice && (
                <>
                  <div className="text-sm font-bold text-text-secondary line-through mb-1">
                    ₹{product.originalPrice}
                  </div>
                  <div className="text-xs font-bold text-green-400 mb-1.5">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off
                  </div>
                </>
              )}
            </div>
            
            {/* Rating Stars & Reviews */}
            <div className="flex items-center gap-1 mt-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`size-4 ${star <= Math.round(product.rating) ? "fill-brand-accent text-brand-accent" : "fill-bg-input text-border-light"}`} 
                  />
              ))}
              <span className="text-sm font-sans text-text-secondary ml-1 font-bold">
                {product.rating}
              </span>
              {product.reviewsCount && (
                <span className="text-xs font-sans text-text-secondary/60 ml-1">
                  ({product.reviewsCount.toLocaleString()})
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons (Bottom) */}
          <div className="flex gap-2 mt-4">
            
            {/* SKIP */}
            <motion.button
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={(e) => { e.stopPropagation(); manualSwipe("left"); }}
              className="flex-[0.8] rounded-xl bg-white/5 border border-white/10 text-text-secondary flex flex-col items-center justify-center py-2 shadow-inner hover:bg-white/10 transition-colors"
            >
               <span className="font-bold text-sm tracking-wide">SKIP</span>
            </motion.button>

            {/* ADD TO CART */}
            <motion.button
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={(e) => { e.stopPropagation(); manualSwipe("right"); }}
              className="flex-1 rounded-xl bg-brand-accent/10 border border-brand-accent/30 text-brand-accent flex flex-col items-center justify-center py-2 shadow-inner hover:bg-brand-accent/20 transition-colors"
            >
               <ShoppingCart className="size-4 mb-0.5" />
               <span className="text-[10px] font-bold uppercase tracking-wider">Add to Cart</span>
            </motion.button>
            
            {/* BUY ONE CLICK */}
            <motion.button
              whileTap={{ scale: 0.95, y: 2 }}
              onClick={handleBuy}
              className="flex-[1.2] relative overflow-hidden rounded-xl bg-brand-accent text-bg-main flex flex-col items-center justify-center py-2 shadow-[0_0_20px_rgba(255,176,103,0.2)] hover:shadow-[0_0_30px_rgba(255,176,103,0.4)] transition-shadow"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
              <span className="font-heading font-black text-lg leading-none z-10 flex items-center gap-1.5">
                <Zap className="size-4 fill-bg-main" /> BUY
              </span>
              <span className="text-[10px] font-bold tracking-wider opacity-80 mt-0.5 z-10">ONE CLICK</span>
            </motion.button>
            
          </div>
        </div>

      </div>

      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={[{
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          quantity: 1
        }]}
        onSuccess={handleCheckoutSuccess}
      />
    </motion.div>
  );
}
