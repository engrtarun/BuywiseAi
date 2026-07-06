"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductCarouselProps {
  products: Product[];
  onAddToCartToggle?: (productId: string, inCart: boolean) => void;
  onBuyCallback?: (product: Product) => void;
}

export function ProductCarousel({ products, onAddToCartToggle, onBuyCallback }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  
  // Drag to scroll state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasDragged = useRef(false);

  const checkArrows = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    // 1px threshold to account for fractional pixel rounding errors
    setShowRightArrow(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
  }, []);

  useEffect(() => {
    checkArrows();
    window.addEventListener("resize", checkArrows);
    return () => window.removeEventListener("resize", checkArrows);
  }, [checkArrows]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === "left" ? -280 : 280;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // Mouse drag handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    scrollLeft.current = scrollContainerRef.current?.scrollLeft || 0;
  };

  const handleMouseLeave = () => {
    isDragging.current = false;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Scroll-fast multiplier
    
    // Check threshold to distinguish click vs drag
    if (Math.abs(walk) > 5) {
      hasDragged.current = true;
    }
    
    scrollContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.stopPropagation();
      hasDragged.current = false;
    }
  };

  return (
    <div className="relative w-full group/carousel">
      {/* Left Arrow - hidden on mobile (touch devices scroll naturally) */}
      <button
        onClick={() => scroll("left")}
        className={`
          absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 
          hidden md:flex items-center justify-center size-9 rounded-full 
          bg-ink-deep border border-line-ondark text-text-ondark
          hover:bg-marigold hover:text-ink-deeper hover:border-marigold hover:scale-110
          shadow-lg shadow-black/40 transition-all duration-200 cursor-pointer
          ${showLeftArrow ? "opacity-0 group-hover/carousel:opacity-100" : "opacity-0 pointer-events-none"}
        `}
        aria-label="Scroll left"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bg-main to-transparent z-[5] pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-bg-main to-transparent z-[5] pointer-events-none opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300" />

      {/* Scroll Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkArrows}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onClickCapture={handleClickCapture}
        className="
          flex gap-4 overflow-x-auto snap-x snap-mandatory 
          scrollbar-none select-none cursor-grab active:cursor-grabbing
          py-4 px-2 -mx-2 relative z-0
        "
        style={{
          // Hide scrollbar cross-browser
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          scrollPaddingLeft: "0.5rem",
          scrollPaddingRight: "0.5rem",
        }}
      >
        {products.map((product) => (
          <div
            key={product.id}
            className="snap-start shrink-0 w-[240px] sm:w-[260px] md:w-[280px]"
          >
            <ProductCard product={product} onAddToCartToggle={onAddToCartToggle} onBuyCallback={onBuyCallback} />
          </div>
        ))}
      </div>

      {/* Right Arrow - hidden on mobile */}
      <button
        onClick={() => scroll("right")}
        className={`
          absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 
          hidden md:flex items-center justify-center size-9 rounded-full 
          bg-ink-deep border border-line-ondark text-text-ondark
          hover:bg-marigold hover:text-ink-deeper hover:border-marigold hover:scale-110
          shadow-lg shadow-black/40 transition-all duration-200 cursor-pointer
          ${showRightArrow ? "opacity-0 group-hover/carousel:opacity-100" : "opacity-0 pointer-events-none"}
        `}
        aria-label="Scroll right"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
