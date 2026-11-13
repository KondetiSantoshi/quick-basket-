'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight, Lock, Sparkles, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const FREE_DELIVERY_THRESHOLD = 199;

const FreeDeliveryPill = () => {
  const { subtotal, setIsDrawerOpen } = useCart();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);

  const hiddenRoutes = ['/checkout', '/cart', '/admin', '/delivery', '/login', '/register'];
  if (dismissed || (pathname && hiddenRoutes.some((r) => pathname.startsWith(r)))) return null;

  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const unlocked = remaining === 0 && subtotal > 0;
  const progress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100));

  return (
    <div className="fixed bottom-4 right-4 z-30 max-w-xs bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 px-3.5 py-2.5 flex items-center gap-3">
      <div
        onClick={() => setIsDrawerOpen(true)}
        className="flex items-center gap-2.5 cursor-pointer"
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            unlocked ? 'bg-[#0c831f] text-white' : 'bg-white/10 text-emerald-300'
          }`}
        >
          {unlocked ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
        </div>

        <div className="min-w-0">
          <p className="text-xs font-bold leading-tight">
            {unlocked
              ? 'Free delivery unlocked!'
              : subtotal === 0
              ? `Unlock free delivery`
              : `Add ₹${remaining} for FREE delivery`}
          </p>
          <p className="text-[10px] text-slate-300 mt-0.5">
            {unlocked ? 'Tap to review cart & checkout' : `Shop for ₹${FREE_DELIVERY_THRESHOLD}`}
          </p>
          <div className="w-32 h-1 bg-white/15 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-emerald-400 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss delivery offer"
        className="w-5 h-5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center shrink-0 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default FreeDeliveryPill;
