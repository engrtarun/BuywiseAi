'use client';

import { useRouter } from 'next/navigation';
import { VirtualWardrobe } from '@/components/quick-buy/VirtualWardrobe';
import { FloatingChatBubble } from '@/components/shared/FloatingChatBubble';
import { ChevronLeft } from 'lucide-react';
import { mockQuickBuyProducts } from '@/lib/quickBuyMockData';

export default function VirtualWardrobePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 h-14 z-50 bg-bg-main/80 backdrop-blur-xl border-b border-line-ondark flex items-center px-4">
        <button
          onClick={() => router.push('/chat')}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary-light hover:bg-white/5 px-2 py-1.5 rounded-lg transition-all"
        >
          <ChevronLeft className="size-5" />
          <span className="font-bold text-sm">Back to Chat</span>
        </button>
      </div>

      <div className="pt-14 h-screen">
        <VirtualWardrobe items={mockQuickBuyProducts} />
      </div>

      <FloatingChatBubble />
    </div>
  );
}
