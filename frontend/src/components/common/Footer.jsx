import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Clock, 
  RotateCcw, 
  Headphones, 
  Smartphone, 
  Heart,
  ShoppingCart
} from 'lucide-react';
import { TRENDING_SEARCH_TERMS } from '../../utils/departments';

const Footer = () => {
  const categories = [
    { name: 'Fruits & Vegetables', slug: 'fruits-vegetables' },
    { name: 'Dairy, Bread & Eggs', slug: 'dairy-bread-eggs' },
    { name: 'Rice, Atta & Dal', slug: 'rice-atta-dal' },
    { name: 'Tea, Coffee & Health Drinks', slug: 'tea-coffee-health-drinks' },
    { name: 'Oil, Ghee & Cooking Pastes', slug: 'oil-ghee-cooking-pastes' },
    { name: 'Masalas, Spices & Dry Fruits', slug: 'masalas-spices-dry-fruits' },
    { name: 'Snacks & Munchies', slug: 'snacks-munchies' },
    { name: 'Cold Drinks & Juices', slug: 'cold-drinks-juices' },
    { name: 'Breakfast & Instant Food', slug: 'breakfast-instant-food' },
    { name: 'Sauces, Spreads & Honey', slug: 'sauces-spreads-honey' },
    { name: 'Chocolates & Ice Cream', slug: 'chocolates-ice-cream' },
    { name: 'Bakery & Biscuits', slug: 'bakery-biscuits' },
    { name: 'Frozen Foods & Ready Meals', slug: 'frozen-foods-ready-meals' },
    { name: 'Organic, Millets & Gourmet', slug: 'organic-millets-gourmet' },
    { name: 'Meat & Seafood', slug: 'meat-seafood' },
    { name: 'Personal Care', slug: 'personal-care' },
    { name: 'Household Essentials', slug: 'household-essentials' },
    { name: 'Baby Care', slug: 'baby-care' },
    { name: 'Pet Care', slug: 'pet-care' },
    { name: 'Pharmacy & Wellness', slug: 'pharmacy-wellness' }
  ];

  return (
    <footer className="bg-white border-t border-slate-200 mt-16 pt-12">
      {/* Guarantees Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100">
          <Link to="/products" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-white text-[#0c831f] flex items-center justify-center shadow-sm group-hover:scale-105 transition">
              <Clock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#0c831f] transition">10-Minute Delivery</h4>
              <p className="text-xs text-slate-500">From our local micro dark-stores</p>
            </div>
          </Link>

          <Link to="/products?sort=discount" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-white text-[#0c831f] flex items-center justify-center shadow-sm group-hover:scale-105 transition">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#0c831f] transition">Best Prices & Offers</h4>
              <p className="text-xs text-slate-500">Directly sourced without middlemen</p>
            </div>
          </Link>

          <Link to="/help?topic=returns" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-white text-[#0c831f] flex items-center justify-center shadow-sm group-hover:scale-105 transition">
              <RotateCcw className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#0c831f] transition">Hassle-Free Returns</h4>
              <p className="text-xs text-slate-500">No questions asked doorstep refund</p>
            </div>
          </Link>

          <Link to="/contact" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-xl bg-white text-[#0c831f] flex items-center justify-center shadow-sm group-hover:scale-105 transition">
              <Headphones className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#0c831f] transition">24/7 Help & Support</h4>
              <p className="text-xs text-slate-500">Instant chat & call assistance</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Popular Searches Directory Strip (Zepto Style) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 pb-8 border-b border-slate-100">
        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3">
          Popular Searches
        </h4>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-500">
          {TRENDING_SEARCH_TERMS.map((term, idx) => (
            <React.Fragment key={term}>
              <Link
                to={`/products?keyword=${encodeURIComponent(term)}`}
                className="hover:text-[#0c831f] font-medium transition"
              >
                {term}
              </Link>
              {idx < TRENDING_SEARCH_TERMS.length - 1 && (
                <span className="text-slate-300">|</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-[#0c831f] flex items-center justify-center text-white font-bold group-hover:scale-105 transition">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black text-slate-900">
                Quick<span className="text-[#0c831f]">Basket</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
              QuickBasket is your neighborhood's ultra-fast instant grocery delivery service. 
              Fresh fruits, dairy, cold drinks, snacks, and daily household essentials delivered to your doorstep in 10 minutes.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                to="/apps?platform=ios"
                className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0c831f] flex items-center gap-2 transition"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>iOS App (Coming Soon)</span>
              </Link>
              <Link
                to="/apps?platform=android"
                className="px-3.5 py-2 bg-slate-100 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-semibold text-slate-700 hover:text-[#0c831f] flex items-center gap-2 transition"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>Android APK Available</span>
              </Link>
            </div>
          </div>

          {/* Categories 1 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Categories
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {categories.slice(0, 10).map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/products?category=${encodeURIComponent(c.name)}`}
                    className="hover:text-[#0c831f] transition"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories 2 */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              More Categories
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              {categories.slice(10, 20).map((c) => (
                <li key={c.slug}>
                  <Link
                    to={`/products?category=${encodeURIComponent(c.name)}`}
                    className="hover:text-[#0c831f] transition"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-4">
              Company & Help
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link to="/about" className="hover:text-[#0c831f] transition">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-[#0c831f] transition">Contact Us</Link></li>
              <li><Link to="/help" className="hover:text-[#0c831f] transition">Help & FAQs</Link></li>
              <li><Link to="/terms" className="hover:text-[#0c831f] transition">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-[#0c831f] transition">Privacy Policy</Link></li>
              <li><Link to="/delivery" className="hover:text-[#0c831f] transition">Delivery Partner Portal</Link></li>
              <li><Link to="/admin" className="hover:text-[#0c831f] transition">Admin Dashboard</Link></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-slate-100 py-6 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} QuickBasket Technologies Pvt. Ltd. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" /> for lightning-fast groceries.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
