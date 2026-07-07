"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "buywise-sidebar-v2";
const DEFAULT_WIDTH = 272;
const MIN_WIDTH = 220;
const COLLAPSE_THRESHOLD = 150;

const COLLAPSED_WIDTH = 64;

interface SidebarState {
  width: number;
  collapsed: boolean;
}

function loadState(): SidebarState {
  if (typeof window === "undefined") return { width: DEFAULT_WIDTH, collapsed: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return { width: DEFAULT_WIDTH, collapsed: true };
}

function saveState(state: SidebarState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { }
}

/**
 * Custom hook for desktop sidebar resize & collapse logic.
 *
 * Returns:
 *  - `width`        – current sidebar width in px (64 when collapsed)
 *  - `isCollapsed`  – whether the sidebar is fully hidden
 *  - `isDragging`   – true while the user is actively dragging the handle
 *  - `handleProps`  – spread onto the resize-handle element (`onMouseDown`)
 *  - `toggleCollapse` – click handler for the collapse/expand chevron button
 *
 * Width constraints:
 *  - MIN_WIDTH  = 220px  (below COLLAPSE_THRESHOLD=150px → auto-collapse)
 *  - MAX_WIDTH  = 50% of viewport (recalculated dynamically)
 *  - DEFAULT    = 272px
 *
 * Persistence: width & collapsed state are saved to localStorage.
 */
export function useSidebarResize() {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const lastExpandedWidth = useRef(DEFAULT_WIDTH);
  const initialised = useRef(false);

  // Load persisted state on mount (client only)
  useEffect(() => {
    const s = loadState();
    setWidth(s.width);
    setIsCollapsed(s.collapsed);
    lastExpandedWidth.current = s.width || DEFAULT_WIDTH;
    initialised.current = true;
  }, []);

  // Persist whenever width or collapsed changes (skip first render)
  useEffect(() => {
    if (!initialised.current) return;
    saveState({ width: isCollapsed ? lastExpandedWidth.current : width, collapsed: isCollapsed });
  }, [width, isCollapsed]);

  // Drag handlers (attached to window during drag)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startWidth = isCollapsed ? COLLAPSED_WIDTH : width;

    const onMouseMove = (ev: MouseEvent) => {
      const maxW = Math.floor(window.innerWidth * 0.5);
      let newW = startWidth + (ev.clientX - startX);

      if (newW < COLLAPSE_THRESHOLD) {
        // Auto-collapse
        setIsCollapsed(true);
        setWidth(COLLAPSED_WIDTH);
        return;
      }

      // Uncollapse if we were collapsed and dragged past threshold
      if (isCollapsed) setIsCollapsed(false);

      newW = Math.max(MIN_WIDTH, Math.min(newW, maxW));
      setWidth(newW);
      lastExpandedWidth.current = newW;
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };

    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width, isCollapsed]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      if (prev) {
        // Expanding — restore last width
        setWidth(lastExpandedWidth.current || DEFAULT_WIDTH);
        return false;
      } else {
        // Collapsing — remember current width
        lastExpandedWidth.current = width;
        setWidth(COLLAPSED_WIDTH);
        return true;
      }
    });
  }, [width]);

  return {
    width: isCollapsed ? COLLAPSED_WIDTH : width,
    isCollapsed,
    isDragging,
    toggleCollapse,
    handleProps: { onMouseDown },
  };
}
