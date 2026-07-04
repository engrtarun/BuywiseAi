"use client";

import React, { useState } from "react";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Shuffle, LayoutDashboard } from "lucide-react";
import { OutfitCanvas } from "./OutfitCanvas";
import { useSwipeFeedback } from "@/hooks/useSwipeFeedback";

interface VirtualWardrobeProps {
  items: QuickBuyProduct[];
}

export function VirtualWardrobe({ items }: VirtualWardrobeProps) {
  const [mode, setMode] = useState<"mix" | "canvas">("mix");
  const { playAccept, playReject } = useSwipeFeedback();

  // Helper to categorize
  const { tops, bottoms } = React.useMemo(() => {
    const t: QuickBuyProduct[] = [];
    const b: QuickBuyProduct[] = [];
    
    items.forEach((item) => {
      const name = item.name.toLowerCase();
      // Simple heuristic based on title
      if (name.includes("pant") || name.includes("jean") || name.includes("short") || name.includes("trouser") || name.includes("skirt")) {
        b.push(item);
      } else {
        // Fallback to top for shirts, jackets, hoodies, etc.
        t.push(item);
      }
    });

    return { tops: t, bottoms: b };
  }, [items]);

  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);

  // Direction state for animation (1 for right, -1 for left)
  const [topDir, setTopDir] = useState(1);
  const [bottomDir, setBottomDir] = useState(1);

  const paginateTop = (newDirection: number) => {
    if (tops.length === 0) return;
    setTopDir(newDirection);
    setTopIndex((prev) => (prev + newDirection + tops.length) % tops.length);
  };

  const paginateBottom = (newDirection: number) => {
    if (bottoms.length === 0) return;
    setBottomDir(newDirection);
    setBottomIndex((prev) => (prev + newDirection + bottoms.length) % bottoms.length);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const renderHalf = (
    type: "Top" | "Bottom",
    products: QuickBuyProduct[],
    currentIndex: number,
    direction: number,
    paginate: (dir: number) => void
  ) => {
    return (
      <div className="relative flex-1 w-full h-full flex flex-col items-center justify-center overflow-hidden bg-bg-input border border-white/5 shadow-inner rounded-3xl m-2">
        {/* Label */}
        <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-text-secondary text-xs font-bold uppercase tracking-widest border border-white/10">
          {type}s ({products.length})
        </div>

        {products.length === 0 ? (
          <div className="text-text-secondary text-center max-w-[200px]">
            <p className="text-sm">No {type.toLowerCase()}s saved yet.</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex items-center justify-center">
            <AnimatePresence initial={false} custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 },
                }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={1}
                onDragEnd={(e, { offset, velocity }) => {
                  const swipe = swipePower(offset.x, velocity.x);
                  if (swipe < -swipeConfidenceThreshold) {
                    playReject();
                    paginate(1);
                  } else if (swipe > swipeConfidenceThreshold) {
                    playAccept();
                    paginate(-1);
                  }
                }}
                className="absolute w-3/4 max-w-[280px] h-[85%] bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-xl cursor-grab active:cursor-grabbing"
              >
                <img 
                  src={products[currentIndex].image} 
                  alt={products[currentIndex].name}
                  className="w-full h-full object-cover pointer-events-none" 
                  draggable={false}
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pointer-events-none">
                  <p className="text-white font-bold text-sm truncate">{products[currentIndex].name}</p>
                  <p className="text-brand-accent font-black">₹{products[currentIndex].price}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            {products.length > 1 && (
              <>
                <button
                  className="absolute left-4 z-20 size-10 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80 transition border border-white/10"
                  onClick={() => { playAccept(); paginate(-1); }}
                >
                  <ChevronLeft className="size-6" />
                </button>
                <button
                  className="absolute right-4 z-20 size-10 flex items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/80 transition border border-white/10"
                  onClick={() => { playReject(); paginate(1); }}
                >
                  <ChevronRight className="size-6" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  const handleRandomize = () => {
    playAccept();
    if (tops.length > 1) {
      setTopDir(1);
      setTopIndex(Math.floor(Math.random() * tops.length));
    }
    if (bottoms.length > 1) {
      setBottomDir(1);
      setBottomIndex(Math.floor(Math.random() * bottoms.length));
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-bg-main relative pt-2">
      <div className="flex justify-center mb-2 px-4 z-10">
        <div className="bg-bg-input rounded-xl border border-white/10 p-1 flex shadow-lg">
          <button 
            onClick={() => setMode("mix")}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === "mix" ? 'bg-white/10 text-brand-accent' : 'text-text-secondary hover:text-white'}`}
          >
            Mix & Match
          </button>
          <button 
            onClick={() => setMode("canvas")}
            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${mode === "canvas" ? 'bg-brand-accent text-bg-main shadow-[0_0_15px_rgba(255,176,103,0.4)]' : 'text-text-secondary hover:text-white'}`}
          >
            <LayoutDashboard className="size-4" />
            Canvas Mode
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {mode === "mix" ? (
            <motion.div 
              key="mix"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col p-2 pb-24 overflow-hidden h-full"
            >
              
              {/* Top Half */}
              {renderHalf("Top", tops, topIndex, topDir, paginateTop)}

              {/* Divider / Action */}
              <div className="relative z-30 h-0 flex items-center justify-center">
                <button 
                  onClick={handleRandomize}
                  className="px-4 py-2 bg-brand-accent text-bg-main font-bold rounded-full text-sm shadow-[0_0_20px_rgba(255,176,103,0.4)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <Shuffle className="size-4" />
                  Mix
                </button>
              </div>

              {/* Bottom Half */}
              {renderHalf("Bottom", bottoms, bottomIndex, bottomDir, paginateBottom)}
            </motion.div>
          ) : (
            <motion.div 
              key="canvas"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full absolute inset-0"
            >
              <OutfitCanvas wardrobeItems={items} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
