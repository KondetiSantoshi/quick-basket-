import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto my-24 p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <div className="w-20 h-20 bg-emerald-50 text-[#0c831f] rounded-full flex items-center justify-center mx-auto mb-2">
        <ShoppingBag className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 tracking-tight">404</h1>
      <h2 className="text-base font-bold text-slate-800">Page Not Found</h2>
      <p className="text-xs text-slate-500 leading-relaxed">
        The grocery shelf you are looking for does not exist or has been moved to another aisle.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs uppercase rounded-xl transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Home</span>
      </Link>
    </div>
  );
}
