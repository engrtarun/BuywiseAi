"use client";

import React, { useState } from "react";
import { Product } from "@/types/product";
import { Star, ExternalLink, ShoppingCart, Loader2, ChevronRight } from "lucide-react";
import { CheckoutFlow } from "../checkout/CheckoutFlow";
import { ProductBottomSheet } from "./ProductBottomSheet";

interface ProductCardProps {
  product: Product;
}

/**
 * A helper to render stars visually based on rating (e.g. 4.3)
 */
function renderStars(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const stars = [];

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push("★");
    } else if (i === fullStars && hasHalfStar) {
      stars.push("⯨"); // Not perfect half star, but adequate for text. Alternatively, we use full/empty
    } else {
      stars.push("☆");
    }
  }
  return stars.join("");
}

export function ProductCard({ product }: ProductCardProps) {
  const isAmazon = product.platform === "Amazon";
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Clean price string for calculation
  const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
  
  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on an interactive element, let it handle itself
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    setIsBottomSheetOpen(true);
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className="
        group flex flex-col w-full h-full cursor-pointer
        bg-ink-deep border border-line-ondark rounded-2xl overflow-hidden
        transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:border-marigold/40 hover:shadow-marigold/10
      "
    >
      {/* Image container */}
      <div className="relative aspect-square w-full bg-white/5 overflow-hidden border-b border-line-ondark">
        
        {/* Shimmer skeleton */}
        <div className={`absolute inset-0 bg-white/5 animate-pulse transition-opacity duration-500 ${imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} />
        
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0 scale-95'}`}
          loading="lazy"
        />
        {/* Platform badge */}
        <div className={`
          absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm
          ${isAmazon ? "bg-amber-400/90 text-amber-950" : "bg-blue-500/90 text-white"}
        `}>
          {product.platform}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4">
        <h3 className="font-heading font-semibold text-text-ondark text-[14px] sm:text-[15px] leading-tight line-clamp-2 mb-1.5 group-hover:text-marigold transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-marigold text-[13px] tracking-widest">{renderStars(product.rating)}</span>
          <span className="text-text-dim-ondark text-[11px] sm:text-[12px] font-mono mt-0.5">
            ({product.reviewCount})
          </span>
        </div>

        <div className="mt-auto pt-2 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="font-heading font-bold text-marigold text-lg sm:text-xl leading-none mb-1">
              {product.price}
            </span>
            <div className="flex items-center text-brand-accent/80 text-[11px] font-bold tracking-wide uppercase group-hover:text-brand-accent transition-colors">
              View Details <ChevronRight className="size-3 ml-0.5" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center size-8 sm:size-9 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-text-ondark"
              aria-label="View Product"
            >
              <ExternalLink className="size-3.5 sm:size-4" />
            </a>
            
            <button
              onClick={() => setIsCheckoutOpen(true)}
              className="flex items-center justify-center h-8 sm:h-9 px-3 rounded-full bg-brand-accent border border-brand-accent hover:bg-transparent hover:text-brand-accent transition-colors text-bg-main font-bold text-xs gap-1.5"
            >
              <ShoppingCart className="size-3.5" /> Buy
            </button>
          </div>
        </div>
      </div>
      
      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={[{
          id: product.id,
          name: product.name,
          price: numericPrice,
          image: product.image,
          quantity: 1
        }]}
        onSuccess={() => setIsCheckoutOpen(false)}
      />

      <ProductBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        product={product}
        onBuy={(prod) => {
          setIsBottomSheetOpen(false);
          setIsCheckoutOpen(true);
        }}
      />
    </div>
  );
}
