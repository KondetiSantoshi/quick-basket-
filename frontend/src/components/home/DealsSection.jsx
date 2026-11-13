import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, ArrowRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';

const DealsSection = ({ products = [] }) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 3,
    minutes: 42,
    seconds: 19
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!products || products.length === 0) return null;

  return (
    <section className="my-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-rose-500/10 via-amber-500/5 to-emerald-500/10 border border-rose-100">
      
      {/* Header with Live Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-lg bg-rose-500 text-white shadow-sm">
              <Flame className="w-4 h-4 fill-white animate-bounce" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-rose-600">
              Limited Time Deals
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Flash Super Saver Deals
          </h2>
        </div>

        {/* Countdown Box */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-white px-3.5 py-2 rounded-2xl border border-slate-200/80 shadow-sm">
            <Clock className="w-4 h-4 text-rose-500" />
            <span>Ends In:</span>
            <div className="flex items-center gap-1 font-mono font-black text-rose-600 text-sm">
              <span className="bg-rose-50 px-1.5 py-0.5 rounded">{String(timeLeft.hours).padStart(2, '0')}h</span>
              <span>:</span>
              <span className="bg-rose-50 px-1.5 py-0.5 rounded">{String(timeLeft.minutes).padStart(2, '0')}m</span>
              <span>:</span>
              <span className="bg-rose-50 px-1.5 py-0.5 rounded">{String(timeLeft.seconds).padStart(2, '0')}s</span>
            </div>
          </div>

          <Link
            to="/products?tag=deal"
            className="hidden sm:flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-[#0c831f] transition"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Grid of deal products */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p._id} product={p} />
        ))}
      </div>
    </section>
  );
};

export default DealsSection;
