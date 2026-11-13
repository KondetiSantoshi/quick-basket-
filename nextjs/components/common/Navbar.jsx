'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  Search,
  ShoppingCart,
  MapPin,
  ChevronDown,
  User as UserIcon,
  Heart,
  Package,
  LogOut,
  ShieldCheck,
  Bike,
  Zap,
  X,
  Plus,
  Minus,
  TrendingUp,
  ShoppingBag,
  Apple,
  Wheat,
  Coffee,
  Cookie,
  Flame,
  Home,
  Sparkles,
  HeartHandshake,
  Stethoscope,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation } from '../../context/LocationContext';
import api from '../../services/api';
import {
  STOREFRONT_DEPARTMENTS,
  SEARCH_PLACEHOLDER_ITEMS,
  TRENDING_SEARCH_TERMS
} from '../../utils/departments';

const DEPT_ICON_MAP = {
  ShoppingBag,
  Apple,
  Wheat,
  Coffee,
  Cookie,
  Flame,
  Home,
  Sparkles,
  HeartHandshake,
  Stethoscope
};

const QUICK_AISLES = [
  'Fruits & Vegetables',
  'Dairy, Bread & Eggs',
  'Snacks & Munchies',
  'Cold Drinks & Juices',
  'Tea, Coffee & Health Drinks',
  'Chocolates & Ice Cream',
  'Household Essentials',
  'Pharmacy & Wellness'
];

const Navbar = () => {
  const { user, logout, isAdmin, isDelivery } = useAuth();
  const {
    totalItemsCount,
    subtotal,
    setIsDrawerOpen,
    addToCart,
    updateQuantity,
    getItemQuantity
  } = useCart();
  const { selectedLocation, setIsModalOpen } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Determine active department tab from URL
  const activeDeptParam = searchParams ? searchParams.get('dept') : null;
  const activeCategoryParam = searchParams ? searchParams.get('category') : null;
  const resolvedActiveDept = (() => {
    if (pathname === '/') {
      return activeDeptParam || 'all';
    }
    if (pathname === '/products' && activeCategoryParam) {
      const matched = STOREFRONT_DEPARTMENTS.find((d) =>
        d.categories.includes(activeCategoryParam)
      );
      return matched ? matched.id : '';
    }
    return '';
  })();

  // Cycle animated placeholder items like Zepto
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDER_ITEMS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setUserDropdownOpen(false);
    setSearchFocused(false);
    setSuggestions([]);
  }, [pathname, searchParams]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const { data } = await api.get(
          `/products?keyword=${encodeURIComponent(trimmed)}&sort=popularity&limit=8`
        );
        setSuggestions(data.products || []);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setIsSearching(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      router.push(`/products?keyword=${encodeURIComponent(trimmed)}`);
      setSearchFocused(false);
    }
  };

  const handleTrendingTermClick = (term) => {
    setSearchQuery(term);
    setSearchFocused(false);
    router.push(`/products?keyword=${encodeURIComponent(term)}`);
  };

  const handleSuggestionClick = (product) => {
    router.push(`/product/${product._id}`);
    setSearchQuery('');
    setSuggestions([]);
    setSearchFocused(false);
  };

  const handleDeptTabClick = (deptId) => {
    if (deptId === 'all') {
      router.push('/');
    } else {
      router.push(`/?dept=${deptId}`);
    }
  };

  const showSearchPanel =
    searchFocused || (searchQuery.trim().length > 0 && suggestions.length > 0);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/80 shadow-sm">
      {/* Slim Top Delivery Notice */}
      <div className="bg-gradient-to-r from-[#0c831f] via-emerald-700 to-teal-700 text-white text-[11px] sm:text-xs py-1 px-4 text-center font-medium flex items-center justify-center gap-2">
        <Zap className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300 shrink-0" />
        <span className="truncate">
          10-Minute Delivery across {selectedLocation?.city || 'Bangalore'}! Free delivery on orders ₹199+ • Code{' '}
          <strong className="bg-white/20 px-1.5 py-0.5 rounded font-mono tracking-wider">
            WELCOME50
          </strong>
        </span>
      </div>

      {/* Main Zepto-Style Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[70px] gap-3 sm:gap-6">
          {/* Logo & Location Selector */}
          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#0c831f] to-emerald-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                Quick<span className="text-[#0c831f]">Basket</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200 text-left max-w-[210px]"
              title="Change Delivery Location"
            >
              <div className="truncate">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#0c831f] fill-[#0c831f] shrink-0" />
                  <span>Delivery in {selectedLocation?.estimate || '10 mins'}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate font-medium flex items-center gap-0.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {selectedLocation?.area || 'Select Area'}, {selectedLocation?.city || 'Bangalore'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </div>
              </div>
            </button>
          </div>

          {/* Center Wide Search Bar with Zepto-Style Animated Placeholder & Live Search Panel */}
          <div className="flex-1 max-w-2xl relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />

              <input
                type="text"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchFocused(true);
                }}
                aria-label="Search groceries"
                className="w-full h-11 pl-10 pr-10 bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 focus:border-[#0c831f] focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
              />

              {/* Animated Zepto Cycling Placeholder when empty */}
              {!searchQuery && (
                <div className="pointer-events-none absolute left-10 right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs sm:text-sm text-slate-500 overflow-hidden whitespace-nowrap">
                  <span>Search for</span>
                  <span
                    key={placeholderIndex}
                    className="animate-placeholder-enter font-semibold text-slate-700"
                  >
                    &ldquo;{SEARCH_PLACEHOLDER_ITEMS[placeholderIndex]}&rdquo;
                  </span>
                </div>
              )}

              {/* Clear Input button */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSuggestions([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Zepto-Style Search Overlay Dropdown */}
            {showSearchPanel && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden z-50">
                {!searchQuery.trim() ? (
                  <div className="p-4 space-y-4">
                    {/* Trending Searches Pills */}
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#0c831f]" />
                        <span>Trending Searches</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {TRENDING_SEARCH_TERMS.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => handleTrendingTermClick(term)}
                            className="px-3 py-1.5 rounded-full bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-[#0c831f] text-xs font-medium text-slate-700 hover:text-[#0c831f] transition flex items-center gap-1.5"
                          >
                            <Search className="w-3 h-3 text-slate-400" />
                            <span>{term}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Popular Aisles */}
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2.5">
                        Quick Categories
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {QUICK_AISLES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setSearchFocused(false);
                              router.push(`/products?category=${encodeURIComponent(cat)}`);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50/70 hover:bg-[#0c831f] text-[#0c831f] hover:text-white text-xs font-bold transition"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : isSearching ? (
                  <div className="p-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0c831f]" />
                    <span>Searching fresh inventory for &ldquo;{searchQuery}&rdquo;...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-xs font-semibold text-slate-600">
                      No exact match found for &ldquo;{searchQuery}&rdquo;
                    </p>
                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="text-xs font-bold text-[#0c831f] hover:underline"
                    >
                      Browse all products →
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-bold text-slate-700">
                        Top Matches for &ldquo;{searchQuery.trim()}&rdquo;
                      </span>
                      <span>{suggestions.length} items</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                      {suggestions.map((item) => {
                        const qty = getItemQuantity(item._id, item.unit);
                        return (
                          <div
                            key={item._id}
                            onClick={() => handleSuggestionClick(item)}
                            className="px-4 py-2.5 flex items-center gap-3 hover:bg-emerald-50/40 cursor-pointer transition group"
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src =
                                  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
                              }}
                              className="w-11 h-11 object-contain rounded-lg border border-slate-100 bg-white p-0.5 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate group-hover:text-[#0c831f]">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {item.unit} • {item.brand}
                              </p>
                            </div>
                            <div className="text-right shrink-0 mr-1">
                              <span className="text-xs sm:text-sm font-black text-slate-900">
                                ₹{item.price}
                              </span>
                              {item.originalPrice > item.price && (
                                <span className="block text-[10px] text-slate-400 line-through">
                                  ₹{item.originalPrice}
                                </span>
                              )}
                            </div>

                            {/* Quick ADD inside search result (Zepto style) */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0"
                            >
                              {qty === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => addToCart(item, 1)}
                                  className="px-3 py-1 rounded-lg bg-white hover:bg-[#0c831f] text-[#0c831f] hover:text-white border border-[#0c831f] text-[11px] font-extrabold uppercase transition"
                                >
                                  ADD
                                </button>
                              ) : (
                                <div className="flex items-center bg-[#0c831f] text-white rounded-lg overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(item._id, qty - 1, item.unit)
                                    }
                                    className="w-6 h-7 flex items-center justify-center hover:bg-[#095e16]"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="px-1.5 text-[11px] font-bold font-mono">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateQuantity(item._id, qty + 1, item.unit)
                                    }
                                    className="w-6 h-7 flex items-center justify-center hover:bg-[#095e16]"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="text-xs font-bold text-[#0c831f] hover:underline"
                      >
                        See all results for &ldquo;{searchQuery.trim()}&rdquo; →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Side Actions: Profile & Cart */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#0c831f] font-bold flex items-center justify-center text-xs border border-emerald-300">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div className="hidden lg:block text-left">
                    <span className="block text-xs font-bold text-slate-800 leading-tight">
                      {user.name?.split(' ')[0]}
                    </span>
                    <span className="block text-[10px] text-slate-500 capitalize">
                      Profile
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 divide-y divide-slate-100">
                    <div className="px-4 py-2.5">
                      <p className="text-[11px] text-slate-400">Signed in as</p>
                      <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#0c831f] transition"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        My Profile &amp; Account
                      </Link>
                      <Link
                        href="/dashboard?tab=orders"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#0c831f] transition"
                      >
                        <Package className="w-4 h-4 text-slate-400" />
                        My Orders
                      </Link>
                      <Link
                        href="/dashboard?tab=wishlist"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-[#0c831f] transition"
                      >
                        <Heart className="w-4 h-4 text-slate-400" />
                        Wishlist
                      </Link>
                    </div>

                    {(isAdmin || isDelivery) && (
                      <div className="py-1 bg-amber-50/50">
                        {isAdmin && (
                          <Link
                            href="/admin"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100/60 transition"
                          >
                            <ShieldCheck className="w-4 h-4 text-amber-600" />
                            Admin Dashboard
                          </Link>
                        )}
                        {isDelivery && (
                          <Link
                            href="/delivery"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-100/60 transition"
                          >
                            <Bike className="w-4 h-4 text-teal-600" />
                            Rider Dashboard
                          </Link>
                        )}
                      </div>
                    )}

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-slate-800 hover:text-[#0c831f] px-2.5 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-50 transition"
              >
                <UserIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Login</span>
              </Link>
            )}

            {/* Zepto-Style Cart Button */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="bg-[#0c831f] hover:bg-[#095e16] text-white px-3.5 sm:px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all"
            >
              <div className="relative">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItemsCount}
                  </span>
                )}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-none">
                <span className="text-[10px] text-emerald-100 font-medium">
                  {totalItemsCount === 0 ? 'Cart' : `${totalItemsCount} items`}
                </span>
                <span className="text-xs sm:text-sm font-bold">
                  {totalItemsCount === 0 ? 'My Cart' : `₹${subtotal}`}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Row 1.5: Mobile Location Strip (< md) */}
      <div className="md:hidden border-t border-slate-100 bg-slate-50/70 px-4 py-1.5">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-[#0c831f] shrink-0" />
            <span className="text-[11px] font-black text-slate-900 shrink-0">
              ⚡ {selectedLocation?.estimate || '10 MINS'}
            </span>
            <span className="text-[11px] text-slate-500 truncate">
              • {selectedLocation?.area || 'Select Area'}, {selectedLocation?.city || 'Bangalore'}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
        </button>
      </div>

      {/* Row 2: Zepto-Style Horizontal Department Tabs Strip */}
      <div className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Storefront departments"
            className="flex items-center gap-5 sm:gap-7 overflow-x-auto no-scrollbar pt-2"
          >
            {STOREFRONT_DEPARTMENTS.map((dept) => {
              const IconComp = DEPT_ICON_MAP[dept.icon] || ShoppingBag;
              const isActive = resolvedActiveDept === dept.id;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => handleDeptTabClick(dept.id)}
                  className={`flex items-center gap-1.5 pb-2.5 pt-1 text-xs sm:text-[13px] whitespace-nowrap border-b-2 transition-all shrink-0 ${
                    isActive
                      ? 'border-[#0c831f] text-[#0c831f] font-bold'
                      : 'border-transparent text-slate-600 hover:text-[#0c831f] font-medium'
                  }`}
                >
                  <IconComp
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#0c831f]' : 'text-slate-400'
                    }`}
                  />
                  <span>{dept.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default function NavbarWrapper() {
  return (
    <Suspense fallback={<div className="h-20 bg-white border-b border-slate-100" />}>
      <Navbar />
    </Suspense>
  );
}
