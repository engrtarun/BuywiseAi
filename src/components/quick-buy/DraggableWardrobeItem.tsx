"use client";

import React, { useEffect, useState } from "react";
import { Draggable } from "@hello-pangea/dnd";
import { QuickBuyProduct } from "@/lib/quickBuyMockData";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { X } from "lucide-react";

interface DraggableWardrobeItemProps {
  item: QuickBuyProduct;
  index: number;
  onRemove?: (id: string) => void;
  isCanvasItem?: boolean;
}

export function DraggableWardrobeItem({ item, index, onRemove, isCanvasItem = false }: DraggableWardrobeItemProps) {
  const velocityX = useMotionValue(0);
  const rotate = useTransform(velocityX, [-100, 100], [-15, 15]);

  return (
    <Draggable draggableId={isCanvasItem ? `canvas-${item.id}-${index}` : `source-${item.id}`} index={index}>
      {(provided, snapshot) => {
        // We use a small hack here: when snapshot.isDragging changes, we track velocity manually
        // because @hello-pangea/dnd handles the actual X/Y translation.
        return (
          <VelocityTracker isDragging={snapshot.isDragging} velocityX={velocityX}>
            <div
              ref={provided.innerRef}
              id={isCanvasItem ? undefined : `onboarding-source-item-${index}`}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                // Ensure dropping items maintains proper dimensions in flex/grid
                ...(snapshot.isDragging ? { zIndex: 9999 } : {})
              }}
              className={`relative ${isCanvasItem ? 'w-28 h-28 sm:w-32 sm:h-32' : 'w-20 h-20'} group rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-md bg-white/5 backdrop-blur-md`}
            >
              <motion.div
                style={{ rotate }}
                className="w-full h-full relative"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
                
                {/* Overlay for source panel indicating dragability */}
                {!isCanvasItem && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white uppercase tracking-wider">Drag</span>
                  </div>
                )}

                {/* Remove button for canvas items */}
                {isCanvasItem && onRemove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    className="absolute -top-1 -right-1 size-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600 z-10"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </motion.div>
            </div>
          </VelocityTracker>
        );
      }}
    </Draggable>
  );
}

function VelocityTracker({ isDragging, velocityX, children }: { isDragging: boolean, velocityX: any, children: React.ReactNode }) {
  useEffect(() => {
    if (!isDragging) {
      animate(velocityX, 0, { type: "spring", stiffness: 300, damping: 20 });
      return;
    }

    let lastX: number | null = null;
    let lastTime = Date.now();
    let animationFrameId: number;

    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      const now = Date.now();
      const dt = now - lastTime;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;

      if (dt > 16) { // Limit frequency to roughly 60fps for stability
        if (lastX !== null) {
          const v = (clientX - lastX) / dt;
          velocityX.set(v * 20); // Multiplier for more dramatic tilt
        }
        lastX = clientX;
        lastTime = now;
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onMouseMove);

    // Damping loop to smoothly return to 0 if movement stops while dragging
    const dampingLoop = () => {
      if (Date.now() - lastTime > 50 && velocityX.get() !== 0) {
        velocityX.set(velocityX.get() * 0.9);
      }
      animationFrameId = requestAnimationFrame(dampingLoop);
    };
    dampingLoop();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDragging, velocityX]);

  return <>{children}</>;
}
