"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles, Shirt, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-dvh w-full bg-ink-deeper flex flex-col relative overflow-hidden font-sans">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-teal-dark/30 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand-accent/10 rounded-full blur-[150px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        <motion.div 
          className="w-full max-w-4xl mx-auto flex flex-col items-center text-center space-y-10"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-accent/10 border border-brand-accent/20 text-brand-accent text-sm font-semibold mb-2">
              <Sparkles className="size-4" />
              <span>BuyWise AI Professional</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-black text-text-primary-light tracking-tight leading-tight">
              Smarter Shopping, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-marigold via-amber-400 to-yellow-500">
                Powered by AI.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
              Discover exactly what you're looking for with conversational intelligence, deep research, and instant product matching.
            </p>
          </motion.div>

          {/* Primary CTA */}
          <motion.div variants={itemVariants} className="w-full max-w-md">
            <button
              onClick={() => router.push("/chat")}
              className="group relative w-full flex items-center justify-center gap-3 px-8 py-5 bg-brand-accent text-ink-deeper rounded-2xl font-bold text-lg hover:bg-brand-accent/90 transition-all duration-300 shadow-[0_0_40px_rgba(255,178,36,0.3)] hover:shadow-[0_0_60px_rgba(255,178,36,0.5)] active:scale-95"
            >
              <span>Start Chatting</span>
              <ArrowRight className="size-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mt-8">
            <button 
              onClick={() => router.push("/quick-buy")}
              className="group flex flex-col items-start text-left p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-marigold/30 transition-all duration-300 backdrop-blur-md"
            >
              <div className="p-3 bg-brand-accent/10 rounded-xl text-brand-accent mb-4 group-hover:scale-110 transition-transform">
                <ShoppingBag className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary-light mb-2">Quick Buy</h3>
              <p className="text-sm text-text-secondary leading-relaxed">Swipe through AI-curated product matches instantly and find the perfect item in seconds.</p>
            </button>

            <button 
              onClick={() => router.push("/virtual-wardrobe")}
              className="group flex flex-col items-start text-left p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.05] hover:border-marigold/30 transition-all duration-300 backdrop-blur-md"
            >
              <div className="p-3 bg-teal-dark/30 rounded-xl text-teal-light mb-4 group-hover:scale-110 transition-transform">
                <Shirt className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary-light mb-2">Virtual Wardrobe</h3>
              <p className="text-sm text-text-secondary leading-relaxed">Organize your saved items, mix and match outfits on a freeform canvas, and plan your looks.</p>
            </button>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center py-6 relative z-10">
        <p className="text-xs text-text-dim-ondark tracking-wide uppercase font-semibold">
          &copy; {new Date().getFullYear()} BuyWise AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
