"use client";

import React from "react";
import { Product } from "@/types/product";
import { Star, ExternalLink } from "lucide-react";

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
  
  return (
    <div className="
      group flex flex-col w-full h-full
      bg-ink-deep border border-line-ondark rounded-2xl overflow-hidden
      transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-marigold/40 hover:shadow-marigold/10
    ">
      {/* Image container */}
      <div className="relative aspect-square w-full bg-white/5 overflow-hidden border-b border-line-ondark">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

        {/* Description */}
        <p className="text-text-dim-ondark text-[12px] sm:text-[13px] line-clamp-2 leading-relaxed mb-3">
          {product.description}
        </p>

        <div className="mt-auto pt-2 flex items-end justify-between">
          <div className="flex flex-col">
            {/* Original price & discount */}
            {(product.originalPrice || product.discountBadge) && (
              <div className="flex items-center gap-1.5 mb-0.5">
                {product.originalPrice && (
                  <span className="text-text-dim-ondark text-[11px] sm:text-[12px] line-through">
                    {product.originalPrice}
                  </span>
                )}
                {product.discountBadge && (
                  <span className="text-chili text-[10px] sm:text-[11px] font-bold bg-chili/10 px-1 rounded">
                    {product.discountBadge}
                  </span>
                )}
              </div>
            )}
            {/* Final price */}
            <span className="font-heading font-bold text-marigold text-lg sm:text-xl leading-none">
              {product.price}
            </span>
          </div>

          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center size-8 sm:size-9 rounded-full bg-white/5 border border-white/10 hover:bg-marigold hover:text-ink-deeper hover:border-marigold transition-colors text-text-ondark"
            aria-label="View Product"
          >
            <ExternalLink className="size-3.5 sm:size-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
