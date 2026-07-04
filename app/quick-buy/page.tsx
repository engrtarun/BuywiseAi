'use client';

import { useRouter } from 'next/navigation';
import { QuickBuyScreen } from '@/components/quick-buy/QuickBuyScreen';

export default function QuickBuyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950">
      <QuickBuyScreen onClose={() => router.push('/chat')} />
    </div>
  );
}
