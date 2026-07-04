"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, X } from "lucide-react";

interface CategorySearchInputProps {
  availableCategories: string[];
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
}

export function CategorySearchInput({
  availableCategories,
  selectedCategories,
  onChange,
}: CategorySearchInputProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return availableCategories;
    const lowerSearch = search.toLowerCase();
    return availableCategories.filter(
      (c) => c.toLowerCase().includes(lowerSearch) && !selectedCategories.includes(c)
    );
  }, [search, availableCategories, selectedCategories]);

  // If search is empty, we only show categories not yet selected.
  const displayCategories = search.trim() 
    ? filteredCategories 
    : availableCategories.filter(c => !selectedCategories.includes(c));

  const handleSelect = (category: string) => {
    if (!selectedCategories.includes(category)) {
      onChange([...selectedCategories, category]);
    }
    setSearch("");
    setIsOpen(false);
  };

  const handleRemove = (categoryToRemove: string) => {
    onChange(selectedCategories.filter((c) => c !== categoryToRemove));
  };

  return (
    <div className="w-full relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-text-primary-light mb-3">
        Search Product Categories
      </label>
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-secondary" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="e.g., Laptops, Sneakers, Shirts..."
          className="w-full bg-bg-input border border-border-light rounded-xl pl-10 pr-4 py-3 text-sm text-text-primary-light font-sans focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/50 transition-all"
        />
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-[200px] overflow-y-auto custom-scrollbar">
          {displayCategories.length === 0 ? (
            <div className="p-4 text-center text-sm text-text-secondary">
              No matching category found
            </div>
          ) : (
            <ul className="py-1">
              {displayCategories.map((category) => (
                <li
                  key={category}
                  onClick={() => handleSelect(category)}
                  className="px-4 py-2.5 text-sm text-text-primary-light hover:bg-amber-500/10 hover:text-amber-400 cursor-pointer transition-colors"
                >
                  {category}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Selected Chips */}
      {selectedCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedCategories.map((category) => (
            <div
              key={category}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-brand-accent text-[13px] font-medium animate-in zoom-in-95 duration-200"
            >
              <span>{category}</span>
              <button
                onClick={() => handleRemove(category)}
                className="hover:bg-brand-accent/20 rounded-full p-0.5 transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
