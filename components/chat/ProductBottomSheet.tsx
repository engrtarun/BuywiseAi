"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, useAnimation, PanInfo } from "framer-motion";
import { X, Star, ShoppingBag, ShieldCheck, ChevronRight } from "lucide-react";
import { Product } from "@/types/product";

interface ProductBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onBuy: (product: Product) => void;
}

export function ProductBottomSheet({ isOpen, onClose, product, onBuy }: ProductBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      controls.start({ y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } });
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, controls]);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    // If dragged down enough or fast enough, close it
    if (info.offset.y > 100 || info.velocity.y > 500) {
      await controls.start({ y: "100%", transition: { duration: 0.2 } });
      onClose();
    } else {
      // Snap back up
      controls.start({ y: 0, transition: { type: "spring", damping: 25, stiffness: 200 } });
    }
  };

  const handleBackdropClick = async () => {
    await controls.start({ y: "100%", transition: { duration: 0.2 } });
    onClose();
  };

  if (!mounted || !product) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex flex-col justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClick}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={controls}
            exit={{ y: "100%" }}
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className="relative w-full max-w-2xl mx-auto bg-bg-main rounded-t-3xl border border-line-ondark flex flex-col max-h-[90vh] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] touch-pan-y"
          >
            {/* Drag Handle */}
            <div className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Close Button */}
            <button
              onClick={handleBackdropClick}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-md transition-all z-10"
            >
              <X className="size-5" />
            </button>

            <div className="overflow-y-auto flex-1 scrollbar-hide">
              {/* Product Image Gallery (Mock single image) */}
              <div className="w-full h-[35vh] min-h-[300px] relative bg-white/5">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {/* Discount Badge */}
                {product.discountBadge && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-chili text-white text-xs font-bold font-mono tracking-wider rounded-full shadow-lg">
                    {product.discountBadge}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="p-5 md:p-8 flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-text-dim-ondark tracking-wider uppercase font-mono border border-line-ondark px-2 py-0.5 rounded-md">
                      {product.platform}
                    </span>
                    <div className="flex items-center gap-1 text-marigold text-sm font-bold ml-auto">
                      <Star className="size-4 fill-current" />
                      <span>{product.rating}</span>
                      <span className="text-text-dim-ondark font-normal">({product.reviewCount})</span>
                    </div>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-text-ondark leading-tight">
                    {product.name}
                  </h2>
                  <div className="flex items-end gap-3 mt-1">
                    <span className="text-3xl font-heading font-black text-brand-accent">
                      ₹{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-text-dim-ondark line-through mb-1.5">
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-px w-full bg-line-ondark my-2" />

                <div className="flex flex-col gap-3">
                  <h3 className="font-bold text-text-ondark text-sm uppercase tracking-wide">Product Details</h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    Elevate your wardrobe with this premium piece from {product.platform}. {product.description} Crafted with high-quality materials for ultimate comfort and durability. The perfect blend of modern aesthetics and timeless design, making it a versatile addition to any collection.
                  </p>
                  
                  <ul className="text-sm text-text-secondary space-y-2 mt-2">
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-brand-accent/50" />
                      Premium blend fabric for all-day comfort
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-brand-accent/50" />
                      Tailored fit designed for modern silhouettes
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="size-1.5 rounded-full bg-brand-accent/50" />
                      Machine washable and easy to maintain
                    </li>
                  </ul>
                </div>

                {/* Trust Badges */}
                <div className="flex gap-4 mt-4 py-4 border-y border-line-ondark">
                  <div className="flex items-center gap-2 flex-1">
                    <ShieldCheck className="size-5 text-green-400" />
                    <span className="text-xs text-text-secondary font-medium">100% Authentic</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1">
                    <Package className="size-5 text-blue-400" />
                    <span className="text-xs text-text-secondary font-medium">Free Returns</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Bar */}
            <div className="p-4 md:px-8 border-t border-line-ondark bg-bg-main backdrop-blur-xl flex gap-3 pb-8 md:pb-6">
              <button
                onClick={handleBackdropClick}
                className="w-1/3 py-4 rounded-xl border border-white/10 font-bold text-text-ondark hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onBuy(product);
                }}
                className="w-2/3 py-4 rounded-xl bg-brand-accent text-bg-main font-bold hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,176,103,0.3)]"
              >
                <ShoppingBag className="size-5" />
                Buy Now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Simple package icon for trust badge since it's not imported above
function Package(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
