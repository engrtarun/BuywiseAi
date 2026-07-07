"use client";

import { useEffect, useRef } from "react";

interface KeyboardShortcutActions {
  toggleSidebar?: () => void;
  toggleMute?: () => void;
  toggleTemporaryChat?: () => void;
}

export const useKeyboardShortcuts = (actions: KeyboardShortcutActions) => {
  const actionsRef = useRef(actions);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is typing in an input, textarea, or contenteditable
      const activeElement = document.activeElement as HTMLElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.isContentEditable)
      ) {
        return;
      }

      // Sidebar Toggle: Ctrl + . or Cmd + .
      if ((e.ctrlKey || e.metaKey) && e.key === ".") {
        if (actionsRef.current.toggleSidebar) {
          e.preventDefault();
          actionsRef.current.toggleSidebar();
        }
      }

      // Mute Toggle: Alt + M
      if (e.altKey && e.key.toLowerCase() === "m") {
        if (actionsRef.current.toggleMute) {
          e.preventDefault();
          actionsRef.current.toggleMute();
        }
      }

      // Temporary Chat Toggle: Alt + T
      if (e.altKey && e.key.toLowerCase() === "t") {
        if (actionsRef.current.toggleTemporaryChat) {
          e.preventDefault();
          actionsRef.current.toggleTemporaryChat();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
};
