"use client";

import React from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { ArrowLeft, Trash2, ShoppingBag } from "lucide-react";

interface SavedItemsListProps {
  items: QuickBuyProduct[];
  onBack: () => void;
  onRemove: (id: string) => void;
}

export function SavedItemsList({ items, onBack, onRemove }: SavedItemsListProps) {
  return (
    <div className="flex flex-col h-full w-full bg-bg-main relative z-50 animate-in slide-in-from-right-8 duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border-light bg-bg-main/80 backdrop-blur-md sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-white/5 text-text-primary-light transition-colors"
        >
          <ArrowLeft className="size-6" />
        </button>
        <h2 className="text-lg font-heading font-bold text-text-primary-light">
          Saved Items
        </h2>
        <div className="w-10" /> {/* Balance */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <ShoppingBag className="size-8 opacity-50" />
            </div>
            <p className="text-[15px]">No saved items yet.</p>
            <p className="text-sm opacity-60">Swipe right to save items here.</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-bg-input border border-border-light shadow-sm">
              <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-white/5">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-[15px] font-bold text-text-primary-light leading-tight line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="text-brand-accent font-bold mt-1">₹{item.price}</div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <button className="px-4 py-1.5 rounded-lg bg-brand-accent text-bg-main text-[13px] font-bold hover:brightness-110 active:scale-95 transition-all">
                    Buy Now
                  </button>
                  <button
                    onClick={() => onRemove(item.id)}
                    className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
