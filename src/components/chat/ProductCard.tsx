import React, { useState, useEffect } from "react";
import { Product } from "@/types/product";
import { Star, ExternalLink, ShoppingCart, Loader2, ChevronRight, Check } from "lucide-react";
import { CheckoutFlow } from "../checkout/CheckoutFlow";
import { ProductBottomSheet } from "./ProductBottomSheet";
import { getCuratedProductImage } from "@/utils/productImage";

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

function getBadgeStyle(platform: string) {
  if (!platform) return "bg-zinc-700/80 text-white border-zinc-600/50";
  const p = platform.toLowerCase();
  
  if (p.includes("amazon")) return "bg-amber-400/90 text-amber-950 border-amber-400/50";
  if (p.includes("flipkart")) return "bg-blue-600/90 text-white border-blue-400/50";
  if (p.includes("meesho")) return "bg-pink-600/90 text-white border-pink-400/50";
  if (p.includes("myntra")) return "bg-fuchsia-600/90 text-white border-fuchsia-400/50";
  if (p.includes("ajio")) return "bg-teal-600/90 text-white border-teal-400/50";
  if (p.includes("nykaa")) return "bg-rose-500/90 text-white border-rose-400/50";
  if (p.includes("shopify")) return "bg-emerald-600/90 text-white border-emerald-400/50";
  
  if (p.includes("zomato")) return "bg-red-600/90 text-white border-red-400/50";
  if (p.includes("swiggy")) return "bg-orange-500/90 text-white border-orange-400/50";
  if (p.includes("blinkit")) return "bg-yellow-400/90 text-yellow-950 border-yellow-400/50";
  if (p.includes("zepto")) return "bg-indigo-600/90 text-white border-indigo-400/50";
  if (p.includes("dunzo")) return "bg-green-500/90 text-white border-green-400/50";
  if (p.includes("bigbasket")) return "bg-lime-600/90 text-white border-lime-400/50";
  
  if (p.includes("tataneu")) return "bg-purple-600/90 text-white border-purple-400/50";
  if (p.includes("croma")) return "bg-cyan-600/90 text-white border-cyan-400/50";
  if (p.includes("reliancedigital")) return "bg-blue-700/90 text-white border-blue-500/50";
  if (p.includes("jiomart")) return "bg-sky-500/90 text-white border-sky-400/50";
  
  if (p.includes("lenskart")) return "bg-teal-500/90 text-white border-teal-400/50";
  if (p.includes("purplle")) return "bg-fuchsia-500/90 text-white border-fuchsia-400/50";
  if (p.includes("snapdeal")) return "bg-red-500/90 text-white border-red-400/50";

  return "bg-zinc-700/80 text-white border-zinc-600/50";
}

export function ProductCard({ product, onAddToCartToggle, onBuyCallback }: ProductCardProps) {
  const isAmazon = product.platform === "Amazon";
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [inCart, setInCart] = useState(false);
  
  const [imageSrc, setImageSrc] = useState<string>(() => {
    const rawImg = product.image || "";
    if (!rawImg || rawImg.includes("placeholder.png")) {
      return getCuratedProductImage(product.name);
    }
    return rawImg;
  });

  const handleImageError = () => {
    const fallbackImg = getCuratedProductImage(product.name);
    if (imageSrc !== fallbackImg) {
      setImageSrc(fallbackImg);
    } else {
      setImageLoaded(true);
    }
  };

  useEffect(() => {
    const rawImg = product.image || "";
    if (!rawImg || rawImg.includes("placeholder.png")) {
      setImageSrc(getCuratedProductImage(product.name));
    } else {
      setImageSrc(rawImg);
    }
  }, [product.image, product.name]);
  
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

  const numericPrice = typeof product.price === 'string' 
    ? parseFloat(product.price.replace(/[^0-9.]/g, '')) || 0
    : typeof product.price === 'number' ? product.price : 0;
  
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
        bg-zinc-900/90 border rounded-[20px] overflow-hidden backdrop-blur-xl
        transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl
        ${inCart 
          ? "border-marigold/60 shadow-[0_0_24px_rgba(232,163,61,0.15)]" 
          : "border-white/10 hover:border-white/20 shadow-lg"
        }
      `}
    >
      {/* --- Image Panel (Top) --- */}
      <div className="relative w-full pb-[100%] bg-black/40 overflow-hidden border-b border-white/5">
        
        {/* Shimmer skeleton */}
        <div className={`absolute inset-0 bg-white/5 animate-pulse transition-opacity duration-500 ${imageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} />
        
        {/* Image */}
        <img
          src={imageSrc}
          alt={product.name}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={handleImageError}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
        />
        
        {/* Inner shadow for premium feel */}
        <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] pointer-events-none" />
        
        {/* Retailer Badge */}
        <div className={`
          absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.15em] 
          backdrop-blur-md shadow-md border
          ${getBadgeStyle(product.platform || "")}
        `}>
          {product.platform || "STORE"}
        </div>

        {/* Add to Cart Checkbox overlay top-right */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            onClick={handleCartToggle}
            className={`
              size-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 cursor-pointer border
              ${inCart 
                ? "bg-marigold text-zinc-950 border-marigold shadow-[0_0_12px_rgba(232,163,61,0.5)] scale-105" 
                : "bg-black/40 border-white/20 text-white/90 hover:text-white hover:bg-black/60 hover:scale-110"
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

      {/* --- Details Segment (Middle) --- */}
      <div className="flex flex-col flex-1 px-4 py-3 bg-gradient-to-b from-white/[0.02] to-transparent">
        <h3 className="font-heading font-semibold text-zinc-100 text-[14px] sm:text-[15px] leading-[1.3] line-clamp-2 group-hover:text-marigold transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1.5 mt-2 opacity-90">
          <span className="text-marigold text-[12px] tracking-widest leading-none drop-shadow-[0_0_2px_rgba(232,163,61,0.3)]">{renderStars(product.rating || 4.5)}</span>
          <span className="text-zinc-400 text-[11px] font-medium leading-none">
            {(product.rating || 4.5).toFixed(1)}
            {product.reviewCount && <span className="ml-1 opacity-75">({product.reviewCount} ratings)</span>}
          </span>
        </div>
      </div>
      
      {/* --- Results / Action Module (Bottom) --- */}
      <div className="mt-auto px-4 py-3 bg-black/40 border-t border-white/5 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-zinc-400 text-[10px] font-semibold uppercase tracking-wider mb-0.5">Price</span>
          <span className="font-heading font-black text-marigold text-[18px] sm:text-[20px] leading-none tracking-tight">
            {product.price}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center size-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 transition-all text-zinc-300 hover:text-white hover:scale-105"
            aria-label="View Product"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="size-4" />
          </a>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onBuyCallback) onBuyCallback(product);
              setIsCheckoutOpen(true);
            }}
            className="flex items-center justify-center h-9 px-4 rounded-xl bg-marigold hover:bg-[#ffb700] hover:scale-105 transition-all text-zinc-950 font-bold text-[13px] tracking-wide shadow-[0_4px_12px_rgba(232,163,61,0.25)]"
          >
            BUY
          </button>
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
