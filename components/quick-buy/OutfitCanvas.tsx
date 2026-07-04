"use client";

import React, { useState, useCallback } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { DraggableWardrobeItem } from "./DraggableWardrobeItem";
import { LiveOutfitSummary } from "./LiveOutfitSummary";
import { MatchMeter } from "./MatchMeter";
import { CanvasThinkingWave } from "./CanvasThinkingWave";
import { LayoutGrid, Shuffle, Sparkles } from "lucide-react";
import { CheckoutFlow, CheckoutItem } from "../checkout/CheckoutFlow";
import axios from "axios";

interface OutfitCanvasProps {
  wardrobeItems: QuickBuyProduct[];
}

export function OutfitCanvas({ wardrobeItems }: OutfitCanvasProps) {
  const [sourceItems, setSourceItems] = useState<QuickBuyProduct[]>(wardrobeItems);
  const [canvasItems, setCanvasItems] = useState<QuickBuyProduct[]>([]);
  const [layoutMode, setLayoutMode] = useState<"grid" | "free">("free");
  
  // Rating State
  const [isRating, setIsRating] = useState(false);
  const [matchData, setMatchData] = useState<{ score: number; commentary: string } | null>(null);

  // Checkout State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      // Reorder within the same list
      const items = source.droppableId === "source" ? Array.from(sourceItems) : Array.from(canvasItems);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      if (source.droppableId === "source") setSourceItems(items);
      else setCanvasItems(items);
    } else {
      // Move between lists
      const sItems = source.droppableId === "source" ? Array.from(sourceItems) : Array.from(canvasItems);
      const dItems = destination.droppableId === "source" ? Array.from(sourceItems) : Array.from(canvasItems);
      
      const [movedItem] = sItems.splice(source.index, 1);
      dItems.splice(destination.index, 0, movedItem);

      if (source.droppableId === "source") {
        setSourceItems(sItems);
        setCanvasItems(dItems);
      } else {
        setCanvasItems(sItems);
        setSourceItems(dItems);
      }
      
      // Clear rating when canvas changes
      setMatchData(null);
    }
  }, [sourceItems, canvasItems]);

  const handleRemoveFromCanvas = (id: string) => {
    const index = canvasItems.findIndex(i => i.id === id);
    if (index === -1) return;
    
    const item = canvasItems[index];
    setCanvasItems(prev => prev.filter(i => i.id !== id));
    setSourceItems(prev => [...prev, item]);
    setMatchData(null);
  };

  const handleRateFit = async () => {
    if (canvasItems.length < 2) return;
    setIsRating(true);
    setMatchData(null);
    
    try {
      const payload = {
        items: canvasItems.map(i => `${i.name} (${i.category})`)
      };
      const res = await axios.post("/api/outfit-rating", payload);
      setMatchData(res.data);
    } catch (error) {
      console.error("Failed to rate fit", error);
      // Fallback in case of error (e.g. rate limit)
      setMatchData({
        score: 65,
        commentary: "Gemini is catching its breath, but we'll safely assume this is mid."
      });
    } finally {
      setIsRating(false);
    }
  };

  const checkoutItems: CheckoutItem[] = canvasItems.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: 1
  }));

  return (
    <div className="flex flex-col h-full w-full bg-bg-main relative overflow-hidden animate-in fade-in duration-500">
      
      {/* Top Header / Mode Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-bg-main z-20">
        <h2 className="font-heading font-bold text-lg text-text-primary-light">Outfit Canvas</h2>
        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
          <button
            onClick={() => setLayoutMode("free")}
            className={`p-1.5 rounded-md transition-all ${layoutMode === "free" ? "bg-white/10 text-brand-accent shadow-sm" : "text-text-secondary hover:text-text-primary-light"}`}
            title="Free Collage Mode"
          >
            <Shuffle className="size-4" />
          </button>
          <button
            onClick={() => setLayoutMode("grid")}
            className={`p-1.5 rounded-md transition-all ${layoutMode === "grid" ? "bg-white/10 text-brand-accent shadow-sm" : "text-text-secondary hover:text-text-primary-light"}`}
            title="Grid Mode"
          >
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col flex-1 min-h-0 relative">
          
          {/* Main Canvas Area */}
          <div className="flex-1 relative overflow-y-auto">
            <LiveOutfitSummary items={canvasItems} onBuyOutfit={() => setIsCheckoutOpen(true)} />
            
            <Droppable droppableId="canvas" direction={layoutMode === "free" ? "horizontal" : "vertical"}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    min-h-full w-full p-8 pb-32 transition-colors duration-300 relative
                    ${snapshot.isDraggingOver ? "bg-brand-accent/5" : ""}
                    ${layoutMode === "free" ? "flex flex-wrap content-start gap-4" : "grid grid-cols-2 max-w-2xl mx-auto gap-4"}
                  `}
                >
                  {canvasItems.length === 0 && !snapshot.isDraggingOver && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <p className="text-text-secondary text-sm font-mono tracking-widest uppercase opacity-50">
                        Drag items here to build a fit
                      </p>
                    </div>
                  )}

                  {canvasItems.map((item, index) => (
                    <DraggableWardrobeItem 
                      key={item.id} 
                      item={item} 
                      index={index} 
                      isCanvasItem 
                      onRemove={handleRemoveFromCanvas} 
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Overlays */}
            {isRating && <CanvasThinkingWave />}
            {matchData && !isRating && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                <div className="relative">
                  <button 
                    onClick={() => setMatchData(null)}
                    className="absolute -top-12 right-0 text-text-secondary hover:text-white font-mono text-sm"
                  >
                    CLOSE
                  </button>
                  <MatchMeter score={matchData.score} commentary={matchData.commentary} />
                </div>
              </div>
            )}
          </div>

          {/* Rate Button Float (visible when enough items) */}
          {canvasItems.length >= 2 && !isRating && !matchData && (
             <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 z-30">
               <button 
                 onClick={handleRateFit}
                 className="bg-brand-accent text-bg-main font-black uppercase tracking-widest px-6 py-3 rounded-full shadow-[0_0_30px_rgba(255,176,103,0.5)] flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
               >
                 <Sparkles className="size-4" />
                 Rate My Fit
               </button>
             </div>
          )}

          {/* Source Panel (Bottom dock) */}
          <Droppable droppableId="source" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`
                  h-32 shrink-0 bg-bg-input/80 backdrop-blur-xl border-t border-white/10 
                  flex items-center px-4 gap-3 overflow-x-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)]
                  ${snapshot.isDraggingOver ? "bg-white/5" : ""}
                `}
              >
                {sourceItems.length === 0 && (
                  <p className="text-text-secondary text-xs italic mx-auto">All items used.</p>
                )}
                {sourceItems.map((item, index) => (
                  <DraggableWardrobeItem key={item.id} item={item} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
          
        </div>
      </DragDropContext>

      <CheckoutFlow
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={checkoutItems}
        onSuccess={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}
