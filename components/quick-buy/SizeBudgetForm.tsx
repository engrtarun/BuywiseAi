"use client";

import React, { useState } from "react";
import { QuickBuyPreferences } from "@/hooks/useQuickBuy";
import { ArrowRight, Settings2 } from "lucide-react";
import { CategorySearchInput } from "./CategorySearchInput";

interface SizeBudgetFormProps {
  initialPreferences: QuickBuyPreferences | null;
  onSave: (prefs: QuickBuyPreferences) => void;
}

const AVAILABLE_SIZES = ["S", "M", "L", "XL"];
const AVAILABLE_CATEGORIES = [
  "T-Shirts", "Shirts", "Jackets", "Hoodies", "Pants", "Shorts", "Jeans", 
  "Sweaters", "Coats", "Sneakers", "Formal Shoes", "Accessories", "Activewear",
  "Smartphones", "Laptops", "Headphones", "Watches", "Backpacks", "Sunglasses", "Gaming Consoles"
];

export function SizeBudgetForm({ initialPreferences, onSave }: SizeBudgetFormProps) {
  const [selectedSizes, setSelectedSizes] = useState<string[]>(initialPreferences?.sizes || []);
  const [preferredCategories, setPreferredCategories] = useState<string[]>(initialPreferences?.preferredCategories || []);
  const [maxBudget, setMaxBudget] = useState<string>(initialPreferences?.maxBudget ? String(initialPreferences.maxBudget) : "");

  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleSave = () => {
    const budgetNum = parseInt(maxBudget, 10);
    onSave({
      sizes: selectedSizes,
      preferredCategories,
      maxBudget: isNaN(budgetNum) ? null : budgetNum,
    });
  };

  const isValid = selectedSizes.length > 0 && maxBudget.trim() !== "";

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-bg-main relative z-50">
      <div className="w-full max-w-md bg-white/[0.04] border border-white/[0.08] rounded-3xl p-8 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-500">
        
        <div className="flex items-center gap-3 mb-6">
          <div className="size-10 rounded-xl bg-brand-accent/20 flex items-center justify-center shrink-0">
            <Settings2 className="size-5 text-brand-accent" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-text-primary-light">Shopping Preferences</h2>
            <p className="text-sm text-text-secondary">Set this once, swipe faster.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-text-primary-light mb-3">
              Your Sizes (Multi-select)
            </label>
            <div className="flex flex-wrap gap-3">
              {AVAILABLE_SIZES.map((size) => {
                const isActive = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`
                      flex-1 min-w-[3rem] h-11 rounded-xl text-[15px] font-bold font-sans transition-all duration-200
                      ${isActive 
                        ? "bg-brand-accent text-bg-main shadow-lg shadow-brand-accent/20 scale-105 border-transparent" 
                        : "bg-bg-input border border-border-light text-text-secondary hover:border-brand-accent/50 hover:text-text-primary-light"
                      }
                    `}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Search (Combobox) */}
          <CategorySearchInput 
            availableCategories={AVAILABLE_CATEGORIES}
            selectedCategories={preferredCategories}
            onChange={setPreferredCategories}
          />

          {/* Budget */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-text-primary-light">
                Maximum Budget
              </label>
              <div className="text-brand-accent font-bold tracking-tight">
                {maxBudget ? `₹${parseInt(maxBudget).toLocaleString('en-IN')}` : "Any"}
              </div>
            </div>
            
            <div className="space-y-4 bg-black/20 p-4 rounded-2xl border border-white/5">
              {/* Slider */}
              <input
                type="range"
                min="500"
                max="20000"
                step="100"
                value={maxBudget || 1500}
                onChange={(e) => setMaxBudget(e.target.value)}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/50 transition-all hover:bg-white/20"
                style={{ accentColor: '#ffb067' }} // Ensuring it picks up the amber accent
              />
              
              {/* Text Input */}
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₹</span>
                <input
                  type="number"
                  value={maxBudget}
                  onChange={(e) => setMaxBudget(e.target.value)}
                  placeholder="1500"
                  className="w-full bg-bg-input/50 border border-border-light rounded-xl pl-8 pr-4 py-3 text-text-primary-light font-sans text-[15px] focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`
              w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-[16px] transition-all duration-300 mt-4
              ${isValid 
                ? "bg-brand-accent text-bg-main hover:brightness-110 shadow-lg shadow-brand-accent/20 cursor-pointer active:scale-95" 
                : "bg-white/5 text-text-secondary border border-white/10 cursor-not-allowed opacity-50"
              }
            `}
          >
            Save & Start Swiping
            <ArrowRight className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
