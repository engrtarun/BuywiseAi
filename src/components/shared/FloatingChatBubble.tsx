"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

export function FloatingChatBubble() {
  const router = useRouter();

  return (
    <motion.button
      onClick={() => router.push('/chat')}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-[100] size-14 rounded-full bg-brand-accent text-bg-main shadow-[0_0_20px_rgba(255,176,103,0.4)] flex items-center justify-center transition-shadow group"
      aria-label="Back to Chat"
    >
      <div className="absolute inset-0 rounded-full bg-brand-accent animate-ping opacity-20 group-hover:opacity-40" />
      <MessageSquare className="size-6 relative z-10" />
    </motion.button>
  );
}
