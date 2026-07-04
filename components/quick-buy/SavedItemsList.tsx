"use client";

import React from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { ArrowLeft, Trash2, ShoppingBag, Zap, Plus, Minus } from "lucide-react";

interface SavedItemsListProps {
  items: QuickBuyProduct[];
  itemQuantities: Record<string, number>;
  onBack: () => void;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

export function SavedItemsList({ items, itemQuantities, onBack, onRemove, onUpdateQuantity }: SavedItemsListProps) {
  const totalPrice = items.reduce((sum, item) => sum + item.price * (itemQuantities[item.id] || 1), 0);
  const totalItems = items.reduce((sum, item) => sum + (itemQuantities[item.id] || 1), 0);

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
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <div className="size-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <ShoppingBag className="size-8 opacity-50" />
            </div>
            <p className="text-[15px]">No saved items yet.</p>
            <p className="text-sm opacity-60">Swipe right to save items here.</p>
          </div>
        ) : (
          items.map((item) => {
            const quantity = itemQuantities[item.id] || 1;
            return (
              <div key={item.id} className="flex gap-4 p-3 rounded-2xl bg-bg-input border border-border-light shadow-sm">
                <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-white/5">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-[15px] font-bold text-text-primary-light leading-tight line-clamp-2">
                      {item.name}
                    </h3>
                    <div className="text-brand-accent font-bold mt-1">₹{item.price * quantity}</div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-black/20 rounded-lg border border-white/10">
                      <button onClick={() => quantity > 1 ? onUpdateQuantity(item.id, quantity - 1) : onRemove(item.id)} className="p-1.5 hover:bg-white/10 rounded-l-lg transition-colors text-text-primary-light">
                        <Minus className="size-3.5" />
                      </button>
                      <span className="w-6 text-center text-[13px] font-bold text-text-primary-light">{quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.id, quantity + 1)} className="p-1.5 hover:bg-white/10 rounded-r-lg transition-colors text-text-primary-light">
                        <Plus className="size-3.5" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => onRemove(item.id)}
                      className="p-2 rounded-lg text-text-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Buy All */}
      {items.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-bg-main/90 backdrop-blur-md border-t border-border-light">
          <button 
            className="w-full py-3.5 rounded-xl bg-brand-accent text-bg-main font-bold hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2"
          >
            <Zap className="size-4" />
            Buy All ({totalItems}) • ₹{totalPrice}
          </button>
        </div>
      )}

    </div>
  );
}
