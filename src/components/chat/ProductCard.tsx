import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Star, ExternalLink, ShoppingCart, Loader2, ChevronRight, Check } from "lucide-react";
import { CheckoutFlow } from "../checkout/CheckoutFlow";
import { ProductBottomSheet } from "./ProductBottomSheet";

interface ProductCardProps {
  product: Product;
  onAddToCartToggle?: (productId: string, inCart: boolean) => void;
  onBuyCallback?: (product: Product) => void;
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

export function ProductCard({ product, onAddToCartToggle, onBuyCallback }: ProductCardProps) {
  const isAmazon = product.platform === "Amazon";
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [inCart, setInCart] = useState(false);
  
  // Hydrate local state from local storage persistence
  useEffect(() => {
    try {
      const storedSaved = localStorage.getItem("buywise_quickbuy_saved");
      if (storedSaved) {
        const parsed = JSON.parse(storedSaved);
        if (Array.isArray(parsed) && parsed.includes(product.id)) {
          setInCart(true);
        }
      }
    } catch (e) {
      // LocalStorage access block fallback
    }
  }, [product.id]);

  // Clean price string for calculation
  const numericPrice = parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0;
  
  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is on an interactive element, let it handle itself
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    setIsBottomSheetOpen(true);
  };

  const handleCartToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextInCart = !inCart;
    setInCart(nextInCart);

    // Call external handler if provided
    if (onAddToCartToggle) {
      onAddToCartToggle(product.id, nextInCart);
    }

    // Call backend API to toggle it in user_saved_products (mock cart persistence)
    try {
      await fetch("/api/quick-buy/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          price: numericPrice,
          image_url: product.image,
          is_cart: nextInCart,
        }),
      });
      
      // Update local storage to persist state across reloads
      const storedSaved = localStorage.getItem("buywise_quickbuy_saved");
      let savedIds: string[] = [];
      if (storedSaved) {
        try {
          savedIds = JSON.parse(storedSaved);
        } catch {
          savedIds = [];
        }
      }
      
      if (nextInCart) {
        if (!savedIds.includes(product.id)) {
          savedIds.push(product.id);
        }
      } else {
        savedIds = savedIds.filter(id => id !== product.id);
      }
      localStorage.setItem("buywise_quickbuy_saved", JSON.stringify(savedIds));
    } catch (err) {
      console.error("Failed to sync cart state to database:", err);
    }
  };
  
  return (
    <div 
      onClick={handleCardClick}
      className={`
        group flex flex-col w-full h-full cursor-pointer
        bg-zinc-900/85 border rounded-2xl overflow-hidden backdrop-blur-md
        transition-all duration-200 hover:scale-[1.02]
        ${inCart 
          ? "border-marigold/45 shadow-[0_0_20px_rgba(232,163,61,0.06)]" 
          : "border-white/5 hover:border-zinc-800 shadow-xl"
        }
      `}
    >
      {/* Image container */}
      <div className="relative aspect-square w-full bg-white/5 overflow-hidden border-b border-white/5">
        
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

        {/* Add to Cart Checkbox overlay top-right */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <button
            type="button"
            onClick={handleCartToggle}
            className={`
              size-8 rounded-lg flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer
              ${inCart 
                ? "bg-marigold text-zinc-950 shadow-[0_0_12px_rgba(232,163,61,0.4)]" 
                : "bg-black/50 border border-white/10 text-white/80 hover:text-white hover:bg-black/75 hover:scale-105"
              }
            `}
            aria-label={inCart ? "Remove from cart" : "Add to cart"}
          >
            {inCart ? (
              <Check className="size-4 stroke-[3]" />
            ) : (
              <ShoppingCart className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 bg-gradient-to-b from-transparent to-black/20">
        <h3 className="font-heading font-medium text-zinc-100 text-[14px] sm:text-[15px] leading-tight line-clamp-2 mb-2 group-hover:text-marigold transition-colors">
          {product.name}
        </h3>

        {/* Rating and price metadata at the bottom */}
        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-heading font-bold text-marigold text-[17px] sm:text-[19px] leading-none">
              {product.price}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-marigold text-[11px] tracking-widest leading-none">{renderStars(product.rating)}</span>
              <span className="text-zinc-500 text-[10px] font-mono leading-none">
                ({product.rating.toFixed(1)})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center size-8 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-zinc-300"
              aria-label="View Product"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3.5" />
            </a>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBuyCallback) onBuyCallback(product);
                setIsCheckoutOpen(true);
              }}
              className="flex items-center justify-center h-8 px-3 rounded-lg bg-marigold hover:bg-marigold/95 transition-colors text-zinc-950 font-bold text-xs gap-1"
            >
              Buy
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
          if (onBuyCallback) onBuyCallback(prod);
          setIsCheckoutOpen(true);
        }}
      />
    </div>
  );
}
