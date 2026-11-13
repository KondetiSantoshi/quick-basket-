import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap, ArrowRight } from 'lucide-react';

const BANNER_SLIDES = [
  {
    id: 1,
    title: 'FRESH GROCERY CORNER',
    subtitle: 'Farm fresh fruits, greens, milk, breads & daily kitchen essentials delivered in 10 minutes!',
    badge: 'UP TO 40% OFF',
    tag: '10 MINS DELIVERY',
    coupon: 'FRESH40',
    category: 'Fruits & Vegetables',
    bgGradient: 'from-emerald-950 via-emerald-800 to-teal-900',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600&q=80'
  },
  {
    id: 2,
    title: 'MORNING DAIRY & PANTRY',
    subtitle: 'Fresh farm milk, artisan paneer, whole wheat atta, pure desi ghee & masala essentials.',
    badge: 'DAILY DEALS',
    tag: 'MORNING REFUEL',
    coupon: 'WELCOME50',
    category: 'Dairy, Bread & Eggs',
    bgGradient: 'from-amber-900 via-orange-950 to-stone-900',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80'
  },
  {
    id: 3,
    title: 'SNACKS, COFFEE & CHILLED DRINKS',
    subtitle: 'Instant cold coffees, crunchy chips, chocolate boxes, ice cream tubs & midnight cravings.',
    badge: 'FLAT ₹100 OFF',
    tag: '24/7 EXPRESS',
    coupon: 'QUICK100',
    category: 'Snacks & Munchies',
    bgGradient: 'from-violet-950 via-purple-900 to-indigo-950',
    image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&q=80'
  }
];

const HeroBanner = ({ customDept = null }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (customDept) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [customDept]);

  if (customDept) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 my-4">
        <div
          className={`bg-gradient-to-r ${customDept.gradient} py-7 px-6 sm:px-10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
        >
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase">
              <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
              {customDept.bannerBadge}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              {customDept.bannerTitle}
            </h1>
            <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
              {customDept.bannerSubtitle}
            </p>
          </div>
          {customDept.categories?.[0] && (
            <Link
              to={`/products?category=${encodeURIComponent(customDept.categories[0])}`}
              className="shrink-0 self-start sm:self-center px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition"
            >
              <span>Explore All</span>
              <ArrowRight className="w-4 h-4 text-[#0c831f]" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  const slide = BANNER_SLIDES[currentSlide];

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-100 my-4">
      <div className={`bg-gradient-to-r ${slide.bgGradient} transition-all duration-700`}>
        <div className="px-6 sm:px-10 py-6 sm:py-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3 text-white z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase inline-flex items-center gap-1">
                <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                {slide.tag}
              </span>
              <span className="bg-[#ff3269] px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase">
                {slide.badge}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              {slide.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 max-w-xl leading-relaxed">
              {slide.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to={`/products?category=${encodeURIComponent(slide.category)}`}
                className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-md active:scale-95 transition"
              >
                <span>Order now</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </Link>
              <div className="bg-black/25 backdrop-blur-sm border border-white/15 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs">
                <span className="text-slate-300">Code:</span>
                <span className="font-mono font-bold tracking-wider text-yellow-300">
                  {slide.coupon}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex md:col-span-4 justify-end">
            <div className="relative w-44 h-44 lg:w-52 lg:h-52 rounded-2xl overflow-hidden shadow-xl border-2 border-white/15">
              <img
                src={slide.image}
                alt={slide.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80';
                }}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <button
        type="button"
        onClick={() =>
          setCurrentSlide((prev) => (prev === 0 ? BANNER_SLIDES.length - 1 : prev - 1))
        }
        className="hidden sm:flex absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/25 hover:bg-white text-white hover:text-slate-900 backdrop-blur-sm items-center justify-center transition"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length)}
        className="hidden sm:flex absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/25 hover:bg-white text-white hover:text-slate-900 backdrop-blur-sm items-center justify-center transition"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {BANNER_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrentSlide(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              currentSlide === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroBanner;
