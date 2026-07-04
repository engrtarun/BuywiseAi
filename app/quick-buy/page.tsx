'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function QuickBuyPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addToCartChecked, setAddToCartChecked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Demo Credentials (Inhe bad me user profile state se connect kar sakte ho)
  const userSize = 'M';
  const maxBudget = 3000;

  useEffect(() => {
    async function loadDemoProducts() {
      try {
        const res = await fetch(`/api/quick-buy?size=${userSize}&budget=${maxBudget}`);
        const result = await res.json();
        if (result.success) setProducts(result.data);
      } catch (err) {
        console.error('Error loading products', err);
      } finally {
        setLoading(false);
      }
    }
    loadDemoProducts();
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 1600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  const saveProductAction = async (isCart: boolean) => {
    const product = products[currentIndex];
    if (!product) return;

    try {
      const res = await fetch('/api/quick-buy/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: String(product.id),
          product_name: product.name,
          price: product.price,
          image_url: product.image_url,
          is_cart: isCart,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to save product action');
      }
    } catch (err) {
      console.error('Failed to save quick-buy action', err);
      const message = err instanceof Error ? err.message : 'Failed to save product action';
      setToastMessage(`⚠️ ${message}`);
    }
  };

  const handleNextCard = () => {
    setAddToCartChecked(false);
    setCurrentIndex((prev) => prev + 1);
    setToastMessage(null);
  };

  const handleOneClickBuy = (productName: string) => {
    setAddToCartChecked(true);
    void saveProductAction(true);
    setToastMessage(`✅ ${productName} added to your cart`);
    handleNextCard();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-full bg-amber-500/20" />
          <h1 className="text-xl font-semibold text-amber-400">Loading your perfect fit...</h1>
          <p className="mt-2 text-sm text-slate-400">Matching size and budget in real time.</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= products.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-center text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
          <div className="mb-4 text-4xl">👋</div>
          <h1 className="text-xl font-semibold text-amber-400">No more matches</h1>
          <p className="mt-2 text-sm text-slate-400">You’ve seen all current options in your selected size and budget.</p>
        </div>
      </div>
    );
  }

  const currentProduct = products[currentIndex];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-4 text-white">
      <div className="mb-6 flex w-full max-w-md items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 shadow-lg backdrop-blur">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Investor demo</p>
          <h1 className="text-xl font-bold tracking-wide text-amber-400">⚡ Quick Buy Deck</h1>
        </div>
        <div className="text-right text-xs text-slate-400">
          <div className="mb-1 flex items-center justify-end gap-1">
            <Badge variant="outline" className="border-amber-400 text-amber-400">{userSize}</Badge>
            <span>under</span>
          </div>
          <div>₹{maxBudget}</div>
        </div>
      </div>

      <Card className="relative w-full max-w-md overflow-hidden border-slate-700 bg-slate-800 shadow-2xl shadow-black/30">
        <div className="absolute left-4 top-4 z-10 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
          {currentProduct.category}
        </div>

        <label className="absolute right-4 top-4 z-10 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/80 p-2">
          <input
            type="checkbox"
            checked={addToCartChecked}
            onChange={(e) => {
              const checked = e.target.checked;
              setAddToCartChecked(checked);
              if (checked) {
                void saveProductAction(true);
              }
            }}
            className="h-4 w-4 accent-amber-400"
          />
          <span className="select-none text-xs font-medium text-white">Add to Cart</span>
        </label>

        <CardContent className="p-0">
          <div className="flex h-80 w-full items-center justify-center bg-white p-4">
            <img
              src={currentProduct.image_url}
              alt={currentProduct.name}
              className="max-h-full object-contain transition-transform duration-300 hover:scale-105"
            />
          </div>

          <div className="space-y-3 p-5">
            <h2 className="line-clamp-1 text-lg font-semibold text-slate-100">{currentProduct.name}</h2>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-amber-400">₹{currentProduct.price}</span>
              <span className="text-sm text-slate-400">⭐ {currentProduct.rating} / 5</span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {currentProduct.sizes.map((s: string) => (
                <Badge
                  key={s}
                  variant={s === userSize ? 'default' : 'secondary'}
                  className={s === userSize ? 'bg-amber-500 font-bold text-black' : 'bg-slate-700 text-slate-300'}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex w-full max-w-md gap-4">
        <Button
          onClick={() => handleOneClickBuy(currentProduct.name)}
          className="flex-1 rounded-xl bg-amber-500 py-6 text-md font-bold text-black shadow-lg hover:bg-amber-600"
        >
          🚀 Buy (One Click)
        </Button>
        <Button
          onClick={() => {
            void saveProductAction(false);
            handleNextCard();
          }}
          variant="outline"
          className="flex-1 rounded-xl border-slate-600 bg-slate-800 py-6 text-md text-white hover:bg-slate-700 hover:text-white"
        >
          ⏩ Next / Save
        </Button>
      </div>

      {toastMessage ? (
        <div className="mt-4 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
          {toastMessage}
        </div>
      ) : null}
    </div>
  );
}
