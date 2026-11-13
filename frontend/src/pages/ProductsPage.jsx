import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import {
  SlidersHorizontal,
  PackageOpen,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Check
} from 'lucide-react';

const MAX_PRICE_LIMIT = 1500;
const ITEMS_PER_PAGE = 25;

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Popularity / Best Match' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'discount', label: 'Highest Discount' },
  { value: 'rating', label: 'Customer Rating' }
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedBrand, setSelectedBrand] = useState(
    searchParams.get('brand') ? searchParams.get('brand').split(',') : []
  );
  const [priceRange, setPriceRange] = useState(MAX_PRICE_LIMIT);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity');

  // Zepto-style Filter Modal
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState('category'); // 'category' | 'brand' | 'price' | 'sort'

  const keyword = searchParams.get('keyword') || '';
  const tag = searchParams.get('tag') || '';

  // Fetch Categories once
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/categories');
        setCategories(data || []);
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    };
    fetchCategories();
  }, []);

  // Sync filters cleanly when URL query params change (e.g. clicking footer or navbar categories)
  useEffect(() => {
    const cat = searchParams.get('category');
    setSelectedCategory(cat || 'All');
    setSelectedBrand([]);
    setPriceRange(MAX_PRICE_LIMIT);
    setInStockOnly(false);
    const urlSort = searchParams.get('sort');
    if (urlSort) {
      setSortBy(urlSort);
    }
    setPage(1);
  }, [searchParams]);

  const handleSelectCategory = (cat) => {
    setSelectedCategory(cat);
    setPage(1);
    const nextParams = new URLSearchParams(searchParams);
    if (cat === 'All') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', cat);
    }
    setSearchParams(nextParams);
  };

  const handleToggleBrand = (brand) => {
    setSelectedBrand((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setPage(1);
  };

  const handlePriceChange = (val) => {
    setPriceRange(val);
    setPage(1);
  };

  const handleToggleInStock = (val) => {
    setInStockOnly(val);
    setPage(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setPage(1);
  };

  // Fetch Products with filters & pagination
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (keyword) queryParams.set('keyword', keyword);
        if (selectedCategory && selectedCategory !== 'All') queryParams.set('category', selectedCategory);
        if (selectedBrand.length > 0) queryParams.set('brand', selectedBrand.join(','));
        if (priceRange < MAX_PRICE_LIMIT) queryParams.set('maxPrice', priceRange);
        if (inStockOnly) queryParams.set('inStock', 'true');
        if (tag) queryParams.set('tag', tag);
        if (sortBy) queryParams.set('sort', sortBy);
        queryParams.set('page', page);
        queryParams.set('limit', ITEMS_PER_PAGE);

        const { data } = await api.get(`/products?${queryParams.toString()}`);
        setProducts(data.products || []);
        setTotalPages(data.pages || 1);
        setTotalCount(data.total ?? (data.products || []).length);
        if (data.brands) {
          setBrands(data.brands);
        }
      } catch (err) {
        console.error('Failed to fetch filtered products', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [keyword, selectedCategory, selectedBrand, priceRange, inStockOnly, tag, sortBy, page]);

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedBrand([]);
    setPriceRange(MAX_PRICE_LIMIT);
    setInStockOnly(false);
    setSortBy('popularity');
    setPage(1);
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    selectedBrand.length +
    (priceRange < MAX_PRICE_LIMIT ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const pageHeading = keyword
    ? `Search results for "${keyword}"`
    : selectedCategory !== 'All'
    ? `Buy ${selectedCategory} Online`
    : tag === 'deal'
    ? 'Flash Super Saver Deals'
    : 'All Fresh Groceries Online';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {pageHeading}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing <strong className="text-slate-800">{products.length}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> fresh products • 10-minute delivery
          </p>
        </div>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="self-start sm:self-center text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters ({activeFiltersCount})</span>
          </button>
        )}
      </div>

      {/* Zepto-Style Horizontal Filter Chips Strip */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-3.5 mb-4">
        {/* Main Filters Modal Trigger Pill */}
        <button
          type="button"
          onClick={() => setFilterModalOpen(true)}
          className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition ${
            activeFiltersCount > 0
              ? 'bg-emerald-50 border-[#0c831f] text-[#0c831f]'
              : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#0c831f] text-white text-[10px] flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Brand Modal Shortcut Pill */}
        <button
          type="button"
          onClick={() => {
            setActiveFilterTab('brand');
            setFilterModalOpen(true);
          }}
          className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-semibold flex items-center gap-1 transition ${
            selectedBrand.length > 0
              ? 'bg-emerald-50 border-[#0c831f] text-[#0c831f]'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
        >
          <span>
            {selectedBrand.length > 0 ? `Brand (${selectedBrand.length})` : 'Brand'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* Sort Selector Pill */}
        <div className="relative shrink-0">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            aria-label="Sort products"
            className="appearance-none bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold pl-3.5 pr-8 py-2 rounded-full outline-none focus:border-[#0c831f] cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort: {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* In Stock Quick Toggle Chip */}
        <button
          type="button"
          onClick={() => handleToggleInStock(!inStockOnly)}
          className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-semibold transition ${
            inStockOnly
              ? 'bg-[#0c831f] border-[#0c831f] text-white font-bold'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
        >
          In Stock Only
        </button>

        <div className="h-5 w-px bg-slate-200 shrink-0 mx-0.5" />

        {/* Quick Scrollable Category Pills */}
        <button
          type="button"
          onClick={() => handleSelectCategory('All')}
          className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-semibold transition ${
            selectedCategory === 'All'
              ? 'bg-[#0c831f] border-[#0c831f] text-white font-bold shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:border-[#0c831f]'
          }`}
        >
          All Aisles
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat._id || cat.slug}
              type="button"
              onClick={() => handleSelectCategory(cat.name)}
              className={`shrink-0 px-3.5 py-2 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition ${
                isSelected
                  ? 'bg-[#0c831f] border-[#0c831f] text-white font-bold shadow-xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-[#0c831f]'
              }`}
            >
              <span>{cat.name}</span>
              {cat.itemCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {cat.itemCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Product Grid Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin text-[#0c831f] mb-3" />
          <p className="text-sm font-semibold">Loading fresh inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center max-w-md mx-auto my-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <PackageOpen className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No matching groceries found</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            We couldn&apos;t find items matching your current filters. Try clearing filters or searching for something else.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="px-6 py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs uppercase tracking-wide rounded-xl shadow-sm transition"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          {/* 5-Column Zepto Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8">
              <button
                type="button"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-[#0c831f] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition ${
                    pageNum === page
                      ? 'bg-[#0c831f] text-white shadow-md shadow-emerald-700/20'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-[#0c831f]'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-[#0c831f] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Zepto-Style Multi-Tab Filter Modal */}
      {filterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900">Filters</h2>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Split Body (Left Vertical Tabs + Right Checklist) */}
            <div className="flex flex-1 min-h-[340px] overflow-hidden">
              {/* Left Vertical Tabs */}
              <div className="w-36 sm:w-44 bg-slate-50 border-r border-slate-100 py-2 shrink-0">
                {[
                  { id: 'category', label: 'Category' },
                  { id: 'brand', label: `Brand ${selectedBrand.length > 0 ? `(${selectedBrand.length})` : ''}` },
                  { id: 'price', label: 'Price' },
                  { id: 'sort', label: 'Sort & Stock' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveFilterTab(tab.id)}
                    className={`w-full text-left px-4 py-3 text-xs font-bold border-l-4 transition ${
                      activeFilterTab === tab.id
                        ? 'bg-white border-[#0c831f] text-[#0c831f]'
                        : 'border-transparent text-slate-600 hover:bg-slate-100/70'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Right Content Panel */}
              <div className="flex-1 p-5 overflow-y-auto">
                {activeFilterTab === 'category' && (
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleSelectCategory('All')}
                      className="w-full py-2 px-3 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-800"
                    >
                      <span>All Categories</span>
                      {selectedCategory === 'All' && (
                        <Check className="w-4 h-4 text-[#0c831f]" />
                      )}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat._id || cat.slug}
                        type="button"
                        onClick={() => handleSelectCategory(cat.name)}
                        className="w-full py-2 px-3 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700"
                      >
                        <span className="truncate">{cat.name}</span>
                        {selectedCategory === cat.name && (
                          <Check className="w-4 h-4 text-[#0c831f] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {activeFilterTab === 'brand' && (
                  <div className="space-y-2">
                    {brands.length === 0 ? (
                      <p className="text-xs text-slate-400">No specific brands listed for this view.</p>
                    ) : (
                      brands.map((b) => {
                        const checked = selectedBrand.includes(b);
                        return (
                          <label
                            key={b}
                            className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700"
                          >
                            <span>{b}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleBrand(b)}
                              className="w-4 h-4 rounded text-[#0c831f] focus:ring-[#0c831f] border-slate-300"
                            />
                          </label>
                        );
                      })
                    )}
                  </div>
                )}

                {activeFilterTab === 'price' && (
                  <div className="space-y-5 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Maximum Price</span>
                      <span className="text-sm font-black font-mono text-[#0c831f]">
                        Up to ₹{priceRange}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max={MAX_PRICE_LIMIT}
                      step="25"
                      value={priceRange}
                      onChange={(e) => handlePriceChange(Number(e.target.value))}
                      className="w-full accent-[#0c831f] cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>₹20</span>
                      <span>₹750</span>
                      <span>₹1500+</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {[100, 250, 500, 1500].map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => handlePriceChange(cap)}
                          className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                            priceRange === cap
                              ? 'border-[#0c831f] bg-emerald-50 text-[#0c831f]'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {cap === 1500 ? 'Any Price' : `Under ₹${cap}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {activeFilterTab === 'sort' && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">
                        Availability
                      </p>
                      <label className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-slate-50 cursor-pointer text-xs font-bold text-slate-800">
                        <span>Show In-Stock Items Only</span>
                        <input
                          type="checkbox"
                          checked={inStockOnly}
                          onChange={(e) => handleToggleInStock(e.target.checked)}
                          className="w-4 h-4 rounded text-[#0c831f] focus:ring-[#0c831f] border-slate-300"
                        />
                      </label>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase mb-2">Sort Order</p>
                      <div className="space-y-1.5">
                        {SORT_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleSortChange(opt.value)}
                            className="w-full py-2 px-3 rounded-xl hover:bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-700"
                          >
                            <span>{opt.label}</span>
                            {sortBy === opt.value && (
                              <Check className="w-4 h-4 text-[#0c831f]" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer: Clear All + Show N Products */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs uppercase transition"
              >
                Clear all
              </button>
              <button
                type="button"
                onClick={() => setFilterModalOpen(false)}
                className="flex-[2] py-3 rounded-xl bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs uppercase shadow-md shadow-emerald-700/20 transition"
              >
                Show {totalCount} products
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
