import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';

const ProductCarousel = ({ title, subtitle, products = [], linkTo, icon: Icon }) => {
  const railRef = useRef(null);

  if (!products || products.length === 0) return null;

  const scrollRail = (dir) => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  return (
    <section className="my-7 relative">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <div className="flex items-center gap-1.5">
            {Icon && <Icon className="w-4 h-4 text-[#0c831f]" />}
            <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>

        {linkTo && (
          <Link
            to={linkTo}
            className="text-xs sm:text-sm font-bold text-[#0c831f] hover:text-[#095e16] flex items-center gap-0.5 shrink-0"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Horizontal Scrollable Shelf with Circular Chevron Navigation */}
      <div className="relative group/shelf">
        <button
          type="button"
          onClick={() => scrollRail(-1)}
          aria-label={`Scroll ${title} left`}
          className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-lg items-center justify-center text-slate-700 hover:border-[#0c831f] hover:text-[#0c831f] opacity-0 group-hover/shelf:opacity-100 transition"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div
          ref={railRef}
          className="flex gap-3 sm:gap-3.5 overflow-x-auto no-scrollbar pb-2 scroll-smooth snap-x"
        >
          {products.map((product) => (
            <div
              key={product._id}
              className="w-[162px] sm:w-[184px] md:w-[196px] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollRail(1)}
          aria-label={`Scroll ${title} right`}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-slate-900 text-white shadow-lg items-center justify-center hover:bg-[#0c831f] transition"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default ProductCarousel;
