'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VirtualWardrobe } from '@/components/quick-buy/VirtualWardrobe';
import { FloatingChatBubble } from '@/components/shared/FloatingChatBubble';
import { SoundMuteToggle } from '@/components/shared/SoundMuteToggle';
import { ChevronLeft, ShoppingBag, X } from 'lucide-react';
import { mockQuickBuyProducts } from '@/lib/quickBuyMockData';
import { useQuickBuy } from '@/hooks/useQuickBuy';
import { SavedItemsList } from '@/components/quick-buy/SavedItemsList';
import { QuickBuyLockedState } from '@/components/quick-buy/QuickBuyLockedState';

export default function VirtualWardrobePage() {
  const router = useRouter();
  const [showCart, setShowCart] = useState(false);
  const {
    savedProducts,
    savedForLaterProducts,
    itemQuantities,
    removeSavedItem,
    updateQuantity,
    clearCart,
    moveToSavedForLater,
    moveToCart,
    profiles,
    isInitializing
  } = useQuickBuy();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="size-8 rounded-full border-4 border-brand-accent/20 border-t-brand-accent animate-spin" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <QuickBuyLockedState
        onCreateProfile={() => router.push('/quick-buy')}
        onClose={() => router.push('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 h-14 z-50 bg-bg-main/80 backdrop-blur-xl border-b border-line-ondark flex items-center justify-between px-4">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary-light hover:bg-white/5 px-2 py-1.5 rounded-lg transition-all"
        >
          <ChevronLeft className="size-5" />
          <span className="font-bold text-sm">Back to Chat</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCart(!showCart)}
            className="flex items-center gap-1.5 text-text-secondary hover:text-text-primary-light hover:bg-white/5 px-2 py-1.5 rounded-lg transition-all relative"
          >
            {showCart ? (
              <>
                 <X className="size-5" />
                 <span className="font-bold text-sm hidden sm:inline">Close Cart</span>
              </>
            ) : (
              <>
                 <ShoppingBag className="size-5" />
                 <span className="font-bold text-sm hidden sm:inline">View Cart</span>
                 {savedProducts.length > 0 && (
                   <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[9px] font-bold text-white shadow-sm border border-bg-main">
                     {savedProducts.length}
                   </span>
                 )}
              </>
            )}
          </button>
          <SoundMuteToggle showTooltip={false} />
        </div>
      </div>

      <div className="pt-14 h-[100dvh]">
        {showCart ? (
          <SavedItemsList 
            items={savedProducts} 
            savedForLaterItems={savedForLaterProducts}
            itemQuantities={itemQuantities}
            onBack={() => setShowCart(false)}
            onRemove={removeSavedItem}
            onUpdateQuantity={updateQuantity}
            onClearCart={clearCart}
            onMoveToSavedForLater={moveToSavedForLater}
            onMoveToCart={moveToCart}
          />
        ) : (
          <VirtualWardrobe items={mockQuickBuyProducts} />
        )}
      </div>

      <FloatingChatBubble />
    </div>
  );
}
