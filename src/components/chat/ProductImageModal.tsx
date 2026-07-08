"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  productName: string;
}

export function ProductImageModal({ isOpen, onClose, imageUrl, productName }: ProductImageModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          {/* Backdrop (Dark overlay with blur) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer"
          />

          {/* Image Container (Perfect Square Modal) */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full max-w-[450px] aspect-square bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center p-4"
          >
            {/* Close Button (Cross) */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 border border-white/10 backdrop-blur-md transition-all z-10 shadow-lg cursor-pointer"
              aria-label="Close image modal"
            >
              <X className="size-4 stroke-[2.5]" />
            </button>

            {/* Product Image */}
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-contain select-none"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
