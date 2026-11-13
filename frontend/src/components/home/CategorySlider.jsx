import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CategorySlider = ({
  categories = [],
  title = 'Shop by Category',
  subtitle = null,
  showSeeAll = true
}) => {
  const railRef = useRef(null);

  if (!categories || categories.length === 0) return null;

  const scrollRail = (dir) => {
    if (!railRef.current) return;
    railRef.current.scrollBy({ left: dir * 480, behavior: 'smooth' });
  };

  return (
    <section className="my-6 relative">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h2 className="text-base sm:text-xl font-black text-slate-900 tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {showSeeAll && (
          <Link
            to="/products"
            className="text-xs sm:text-sm font-bold text-[#0c831f] hover:text-[#095e16] flex items-center gap-0.5"
          >
            <span>See All</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Horizontal Scrollable Category Strip */}
      <div className="relative group/rail">
        <button
          type="button"
          onClick={() => scrollRail(-1)}
          aria-label="Scroll categories left"
          className="hidden md:flex absolute -left-3 top-12 z-10 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-md items-center justify-center text-slate-700 hover:border-[#0c831f] hover:text-[#0c831f] opacity-0 group-hover/rail:opacity-100 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div
          ref={railRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
        >
          {categories.map((cat) => (
            <Link
              key={cat._id || cat.slug}
              to={`/products?category=${encodeURIComponent(cat.name)}`}
              className="group w-[92px] sm:w-[108px] shrink-0 flex flex-col items-center text-center"
            >
              <div className="w-[88px] h-[88px] sm:w-[102px] sm:h-[102px] rounded-2xl bg-gradient-to-b from-slate-50 to-emerald-50/40 border border-slate-100 group-hover:border-emerald-300 group-hover:shadow-md p-2 mb-2 transition-all overflow-hidden flex items-center justify-center">
                <img
                  src={cat.image}
                  alt={cat.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80';
                  }}
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <h3 className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-[#0c831f] leading-tight line-clamp-2">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => scrollRail(1)}
          aria-label="Scroll categories right"
          className="hidden md:flex absolute -right-3 top-12 z-10 w-8 h-8 rounded-full bg-slate-900 text-white shadow-md items-center justify-center hover:bg-[#0c831f] transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};

export default CategorySlider;
