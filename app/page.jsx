'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../services/api';
import HeroBanner from '../components/home/HeroBanner';
import CategorySlider from '../components/home/CategorySlider';
import DealsSection from '../components/home/DealsSection';
import ProductCarousel from '../components/home/ProductCarousel';
import ProductCard from '../components/product/ProductCard';
import { STOREFRONT_DEPARTMENTS } from '../utils/departments';
import {
  Flame,
  Award,
  Zap,
  Clock,
  Sparkles,
  Apple,
  Coffee,
  Cookie,
  Milk,
  Utensils,
  CreditCard
} from 'lucide-react';

const HOME_AISLE_SECTIONS = [
  {
    category: 'Fruits & Vegetables',
    title: 'Fresh Fruits & Vegetables',
    subtitle: 'Handpicked orchard fruits & farm crisp greens',
    icon: Apple
  },
  {
    category: 'Dairy, Bread & Eggs',
    title: 'Dairy, Bread & Morning Eggs',
    subtitle: 'Daily fresh milk, paneer, curd & farm eggs',
    icon: Milk
  },
  {
    category: 'Snacks & Munchies',
    title: 'Chips, Crisps & Munchies',
    subtitle: 'Movie-time chips, roasted makhana & namkeen',
    icon: Cookie
  },
  {
    category: 'Cold Drinks & Juices',
    title: 'Soft Drinks, Juices & Coolers',
    subtitle: 'Chilled sodas, coconut water & 100% pure juices',
    icon: Sparkles
  },
  {
    category: 'Sauces, Spreads & Honey',
    title: 'Spreads, Peanut Butter & Honey',
    subtitle: 'High-protein peanut butter, ketchup & pure honey',
    icon: Utensils
  },
  {
    category: 'Tea, Coffee & Health Drinks',
    title: 'Tea, Coffee & Wellness Brews',
    subtitle: 'Filter coffee, Assam leaf tea & green teas',
    icon: Coffee
  },
  {
    category: 'Rice, Atta & Dal',
    title: 'Atta, Rice & Organic Pulses',
    subtitle: 'Aged basmati rice, chakki atta & everyday dals',
    icon: Award
  },
  {
    category: 'Chocolates & Ice Cream',
    title: 'Chocolates & Frozen Desserts',
    subtitle: 'Belgian dark chocolates, cones & family tubs',
    icon: Flame
  }
];

const TRUSTED_BRANDS = [
  'Amul',
  'India Gate',
  'Aashirvaad',
  'Tata',
  'Nescafe',
  'Pintola',
  'Haldiram',
  'Dabur'
];

function HomeContent() {
  const searchParams = useSearchParams();
  const activeDeptId = searchParams ? searchParams.get('dept') || 'all' : 'all';

  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [featured, setFeatured] = useState({
    trending: [],
    bestSellers: [],
    dailyEssentials: [],
    deals: [],
    newArrivals: []
  });
  const [loading, setLoading] = useState(true);
  const [switchingDept, setSwitchingDept] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catRes, featRes, allRes] = await Promise.all([
          api.get('/categories'),
          api.get('/products/featured'),
          api.get('/products?limit=250')
        ]);
        setCategories(catRes.data || []);
        setFeatured(featRes.data || {});
        setAllProducts(allRes.data?.products || []);
      } catch (err) {
        console.error('Error fetching homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Crisp Zepto-style skeleton pulse when switching department tabs
  useEffect(() => {
    setSwitchingDept(true);
    const t = setTimeout(() => setSwitchingDept(false), 160);
    return () => clearTimeout(t);
  }, [activeDeptId]);

  const activeDepartment = useMemo(
    () =>
      STOREFRONT_DEPARTMENTS.find((d) => d.id === activeDeptId) ||
      STOREFRONT_DEPARTMENTS[0],
    [activeDeptId]
  );

  // Group all products by category once for fast shelves
  const productsByCategory = useMemo(() => {
    const map = {};
    for (const p of allProducts) {
      if (!map[p.category]) map[p.category] = [];
      map[p.category].push(p);
    }
    return map;
  }, [allProducts]);

  // Department-filtered categories & products
  const deptCategories = useMemo(() => {
    if (activeDepartment.id === 'all') return categories;
    return categories.filter((c) => activeDepartment.categories.includes(c.name));
  }, [categories, activeDepartment]);

  const deptProducts = useMemo(() => {
    if (activeDepartment.id === 'all') return allProducts;
    return allProducts.filter((p) =>
      activeDepartment.categories.includes(p.category)
    );
  }, [allProducts, activeDepartment]);

  const isSkeleton = loading || switchingDept;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      {isSkeleton ? (
        <div className="py-5 space-y-6 animate-pulse">
          <div className="h-48 sm:h-56 bg-slate-200/70 rounded-2xl" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-24 h-28 bg-slate-200/70 rounded-2xl shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3.5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-56 bg-slate-200/70 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : activeDepartment.id === 'all' ? (
        <>
          {/* Zepto-Style Promo Hero */}
          <HeroBanner />

          {/* Shop by Category Horizontal Strip */}
          <CategorySlider
            categories={categories}
            title="Shop by Category"
            subtitle={`${categories.length || 20} fresh grocery aisles delivered in 10 minutes`}
          />

          {/* Flash Super Saver Deals */}
          <DealsSection products={featured.deals} />

          {/* Trending Shelf */}
          <ProductCarousel
            title="Trending Near You"
            subtitle="Most ordered essentials across your sector right now"
            products={featured.trending}
            linkTo="/products?tag=trending"
            icon={Flame}
          />

          {/* Category Horizontal Carousels just like Zepto */}
          {HOME_AISLE_SECTIONS.map((section) => {
            const catProducts = productsByCategory[section.category] || [];
            if (catProducts.length === 0) return null;
            return (
              <ProductCarousel
                key={section.category}
                title={section.title}
                subtitle={section.subtitle}
                products={catProducts}
                linkTo={`/products?category=${encodeURIComponent(section.category)}`}
                icon={section.icon}
              />
            );
          })}

          {/* Trusted Brands Quick Filter Bar */}
          <section className="my-8 p-5 sm:p-6 rounded-2xl bg-white border border-slate-100 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Trusted Brands Storefront
                </h2>
                <p className="text-xs text-slate-500">
                  Tap any brand to shop all its authentic grocery essentials
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0c831f] bg-emerald-50 px-3 py-1 rounded-full">
                <CreditCard className="w-3.5 h-3.5" />
                Extra UPI &amp; Card offers at checkout
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
              {TRUSTED_BRANDS.map((brand) => (
                <Link
                  key={brand}
                  href={`/products?keyword=${encodeURIComponent(brand)}`}
                  className="py-3 px-3 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200/80 hover:border-[#0c831f] text-center text-xs font-black text-slate-800 hover:text-[#0c831f] transition"
                >
                  {brand}
                </Link>
              ))}
            </div>
          </section>

          {/* Newly Added & Morning Essentials */}
          <ProductCarousel
            title="Fresh Arrivals & New Aisles"
            subtitle="Specialty teas, olive oils, millets, dry fruits, frozen snacks & wellness"
            products={featured.newArrivals}
            linkTo="/products?sort=newest"
            icon={Sparkles}
          />

          <ProductCarousel
            title="Daily Morning Essentials"
            subtitle="Fresh milk, eggs, whole wheat breads, curd & butter"
            products={featured.dailyEssentials}
            linkTo="/products?tag=essential"
            icon={Clock}
          />

          {/* Bottom Promise Banner */}
          <div className="my-10 rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-7 sm:p-10 relative overflow-hidden shadow-lg">
            <div className="relative z-10 max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-emerald-200">
                <Zap className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                QuickBasket Super Promise
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                Freshness delivered in 10 minutes or it&apos;s on us!
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Micro dark-stores stocked fresh at 4 AM directly from verified farms and trusted brands. Delivered safely in eco-friendly paper bags.
              </p>
            </div>
          </div>
        </>
      ) : (
        /* Department Tab View */
        <>
          <HeroBanner customDept={activeDepartment} />

          {deptCategories.length > 0 && (
            <CategorySlider
              categories={deptCategories}
              title={`Explore ${activeDepartment.label}`}
              subtitle={activeDepartment.tagline}
              showSeeAll={false}
            />
          )}

          {/* Carousels for each category in this Department */}
          {deptCategories.map((cat) => {
            const catProducts = productsByCategory[cat.name] || [];
            if (catProducts.length === 0) return null;
            return (
              <ProductCarousel
                key={cat._id || cat.slug}
                title={cat.name}
                subtitle={cat.description}
                products={catProducts}
                linkTo={`/products?category=${encodeURIComponent(cat.name)}`}
              />
            );
          })}

          {/* Complete Grid of everything in this Department */}
          <section className="my-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-xl font-black text-slate-900">
                  All {activeDepartment.label} Products ({deptProducts.length})
                </h2>
                <p className="text-xs text-slate-500">
                  10-minute doorstep delivery across {activeDepartment.categories.join(', ')}
                </p>
              </div>
              <Link
                href="/products"
                className="text-xs font-bold text-[#0c831f] hover:underline"
              >
                Browse full store →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {deptProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8 animate-pulse h-96 bg-slate-100 rounded-3xl my-6" />}>
      <HomeContent />
    </Suspense>
  );
}
