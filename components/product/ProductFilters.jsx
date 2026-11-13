'use client';

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const ProductFilters = ({
  categories = [],
  brands = [],
  selectedCategory,
  onSelectCategory,
  selectedBrand,
  onToggleBrand,
  priceRange,
  onPriceChange,
  inStockOnly,
  onToggleInStock,
  sortBy,
  onSortChange,
  onResetFilters
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-6">
      
      {/* Title & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0c831f]" />
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Filters</h3>
        </div>
        <button
          onClick={onResetFilters}
          className="text-xs text-slate-400 hover:text-rose-500 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Sort By Dropdown */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Sort By
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0c831f] transition"
        >
          <option value="popularity">Popularity / Best Match</option>
          <option value="newest">Newest Arrivals</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="discount">Highest Discount</option>
          <option value="rating">Customer Rating</option>
        </select>
      </div>

      {/* Categories */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Category ({categories.length})
        </label>
        <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
          <button
            onClick={() => onSelectCategory('All')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedCategory === 'All'
                ? 'bg-[#0c831f] text-white font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id || cat.slug}
              onClick={() => onSelectCategory(cat.name)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                selectedCategory === cat.name
                  ? 'bg-[#0c831f] text-white font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {cat.itemCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat.name ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {cat.itemCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Availability / In Stock */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-slate-700">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => onToggleInStock(e.target.checked)}
            className="w-4 h-4 rounded text-[#0c831f] focus:ring-[#0c831f] border-slate-300"
          />
          <span>In Stock Items Only</span>
        </label>
      </div>

      {/* Price Range Slider */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Price Range
          </label>
          <span className="text-xs font-mono font-bold text-[#0c831f]">
            Up to ₹{priceRange}
          </span>
        </div>
        <input
          type="range"
          min="20"
          max="1500"
          step="25"
          value={priceRange}
          onChange={(e) => onPriceChange(Number(e.target.value))}
          className="w-full accent-[#0c831f] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
          <span>₹20</span>
          <span>₹750</span>
          <span>₹1500+</span>
        </div>
      </div>

      {/* Brands Multi-Select */}
      {brands.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Brands
          </label>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {brands.map((b) => {
              const isChecked = selectedBrand.includes(b);
              return (
                <label
                  key={b}
                  className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 hover:text-slate-900"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggleBrand(b)}
                    className="w-3.5 h-3.5 rounded text-[#0c831f] focus:ring-[#0c831f] border-slate-300"
                  />
                  <span className="truncate">{b}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductFilters;
