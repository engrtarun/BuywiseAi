'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { QuickBuyScreen } from '@/components/quick-buy/QuickBuyScreen';
import { FloatingChatBubble } from '@/components/shared/FloatingChatBubble';
import { SoundMuteToggle } from '@/components/shared/SoundMuteToggle';
import { ChevronLeft } from 'lucide-react';

export default function QuickBuyPage() {
  const router = useRouter();
  const previousGhostRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    previousGhostRef.current = root.getAttribute('data-ghost');
    root.setAttribute('data-ghost', 'true');

    return () => {
      if (previousGhostRef.current === null) {
        root.removeAttribute('data-ghost');
      } else {
        root.setAttribute('data-ghost', previousGhostRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-bg-main relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 h-14 z-50 bg-bg-main/80 backdrop-blur-xl border-b border-line-ondark flex items-center justify-between px-4">
        <button
          onClick={() => router.push('/chat')}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary-light hover:bg-white/5 px-2 py-1.5 rounded-lg transition-all"
        >
          <ChevronLeft className="size-5" />
          <span className="font-bold text-sm">Back to Chat</span>
        </button>
        <SoundMuteToggle showTooltip={false} />
      </div>

      <div className="pt-14 h-screen">
        <QuickBuyScreen onClose={() => router.push('/chat')} />
      </div>

      <FloatingChatBubble />
    </div>
  );
}
