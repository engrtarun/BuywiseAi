"use client";

import React, { useState } from "react";
import { useQuickBuy } from "@/hooks/useQuickBuy";
import { X, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { CheckoutFlow } from "../checkout/CheckoutFlow";
import { ProductImageModal } from "../chat/ProductImageModal";

interface QuickBuyScreenProps {
  onClose: () => void;
}

export function QuickBuyScreen({ onClose }: QuickBuyScreenProps) {
  const { savedProducts, removeSavedItem, clearCart } = useQuickBuy();
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<any[]>([]);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; name: string } | null>(null);

  const parsePrice = (priceStr: string | number): number => {
    if (typeof priceStr === "number") return priceStr;
    const numeric = parseFloat(priceStr.replace(/[^0-9.]/g, ""));
    return isNaN(numeric) ? 0 : numeric;
  };

  const totalPrice = savedProducts.reduce((sum, item) => {
    return sum + parsePrice(item.price);
  }, 0);

  const handleBuyClick = (item: any) => {
    setCheckoutItems([{
      id: item.id,
      name: item.name,
      price: parsePrice(item.price),
      image: item.image,
      quantity: 1
    }]);
    setIsCheckoutOpen(true);
  };

  const handleCheckoutAll = () => {
    if (savedProducts.length === 0) return;
    setCheckoutItems(savedProducts.map(item => ({
      id: item.id,
      name: item.name,
      price: parsePrice(item.price),
      image: item.image,
      quantity: 1
    })));
    setIsCheckoutOpen(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[150] flex justify-end">
        {/* Backdrop (Dark overlay with blur) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-bg-main border-l border-white/10 h-full flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10"
        >
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-white/5 bg-black/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-brand-accent">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-lg text-text-ondark">Your Cart</h2>
                <p className="text-xs text-text-dim-ondark mt-0.5">
                  {savedProducts.length} {savedProducts.length === 1 ? "item" : "items"} selected
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95 cursor-pointer"
              aria-label="Close cart"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 scrollbar-hide">
            {savedProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="size-16 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center text-text-dim-ondark mb-5">
                  <ShoppingBag className="size-8 stroke-[1.5]" />
                </div>
                <h3 className="font-heading font-bold text-lg text-text-ondark mb-2">Your cart is empty</h3>
                <p className="text-sm text-text-secondary max-w-xs leading-relaxed">
                  Browse products and click the add-to-cart button to see recommendations and items listed here.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-brand-accent text-bg-main font-bold text-sm hover:brightness-110 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              savedProducts.map((item) => (
                <div
                  key={item.id}
                  className="group flex gap-4 p-4 bg-zinc-900/40 hover:bg-zinc-900/60 border border-white/5 rounded-2xl transition-all duration-300 relative overflow-hidden"
                >
                  {/* Product Image */}
                  <div 
                    onClick={() => setZoomedImage({ url: item.image, name: item.name })}
                    className="size-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0 cursor-zoom-in relative"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h4 className="font-sans font-bold text-sm text-text-ondark leading-tight truncate group-hover:text-brand-accent transition-colors" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-text-dim-ondark uppercase tracking-wider font-mono bg-white/5 border border-white/5 px-1.5 py-0.5 rounded">
                          {item.platform}
                        </span>
                      </div>
                    </div>

                    <div className="text-base font-mono font-black text-brand-accent">
                      {String(item.price).startsWith("₹")
                        ? String(item.price)
                        : `₹${Number(item.price).toLocaleString()}`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end justify-between ml-2 shrink-0">
                    <button
                      onClick={() => removeSavedItem(item.id)}
                      className="p-1.5 rounded-lg text-text-secondary hover:text-chili hover:bg-chili/10 transition-colors cursor-pointer"
                      title="Remove from cart"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    <button
                      onClick={() => handleBuyClick(item)}
                      className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-brand-accent hover:text-bg-main hover:border-brand-accent transition-all duration-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer / Summary */}
          {savedProducts.length > 0 && (
            <div className="shrink-0 p-6 border-t border-white/5 bg-black/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary font-medium">Subtotal</span>
                <span className="text-xl font-mono font-black text-brand-accent">
                  ₹{totalPrice.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={clearCart}
                  className="w-1/3 py-4 rounded-xl border border-white/10 font-bold text-xs text-text-secondary hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center cursor-pointer"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleCheckoutAll}
                  className="w-2/3 py-4 rounded-xl bg-brand-accent text-bg-main font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,176,103,0.3)] cursor-pointer"
                >
                  Checkout All
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Checkout Modal Flow */}
      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={checkoutItems}
        onSuccess={() => {
          setIsCheckoutOpen(false);
          clearCart();
        }}
      />

      {/* Zoom Image Modal */}
      {zoomedImage && (
        <ProductImageModal
          isOpen={!!zoomedImage}
          onClose={() => setZoomedImage(null)}
          imageUrl={zoomedImage.url}
          productName={zoomedImage.name}
        />
      )}
    </>
  );
}
