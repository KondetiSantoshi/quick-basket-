'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Layers, 
  Tag, 
  Users, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  ShieldCheck, 
  Clock, 
  AlertCircle,
  Truck,
  RotateCcw
} from 'lucide-react';

const AdminDashboardPage = () => {
  const { user, isAdmin, demoLogin, setAuthModalOpen } = useAuth();
  const [switchingRole, setSwitchingRole] = useState(false);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'products' | 'orders' | 'categories' | 'coupons'
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalSales: 0,
    deliveredCount: 0,
    activeOrdersCount: 0,
    recentOrders: []
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter in Products table
  const [productSearch, setProductSearch] = useState('');

  // Add / Edit Product Modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    category: 'Fruits & Vegetables',
    unit: '1 kg',
    price: '',
    originalPrice: '',
    image: '',
    description: '',
    stockCount: 50,
    isTrending: false,
    isBestSeller: false,
    isDailyEssential: false,
    isDeal: false
  });

  // Add Coupon form state
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minOrderAmount: 299,
    maxDiscount: 100
  });

  // Add Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    image: '',
    description: ''
  });

  // Fetch initial admin data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, prodRes, catRes, ordRes, coupRes] = await Promise.all([
        api.get('/orders/analytics'),
        api.get('/products?limit=500'),
        api.get('/categories'),
        api.get('/orders?limit=100'),
        api.get('/coupons')
      ]);

      setAnalytics(analyticsRes.data || {});
      setProducts(prodRes.data?.products || []);
      setCategories(catRes.data || []);
      setOrders(ordRes.data?.orders || []);
      setCoupons(coupRes.data || []);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]);

  // Handle Product Save (Create or Update)
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, productForm);
      } else {
        await api.post('/products', productForm);
      }
      setProductModalOpen(false);
      setEditingProductId(null);
      setProductForm({
        name: '',
        brand: '',
        category: 'Fruits & Vegetables',
        unit: '1 kg',
        price: '',
        originalPrice: '',
        image: '',
        description: '',
        stockCount: 50,
        isTrending: false,
        isBestSeller: false,
        isDailyEssential: false,
        isDeal: false
      });
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product');
    }
  };

  const handleEditProductClick = (p) => {
    setEditingProductId(p._id);
    setProductForm({
      name: p.name,
      brand: p.brand,
      category: p.category,
      unit: p.unit,
      price: p.price,
      originalPrice: p.originalPrice,
      image: p.image,
      description: p.description,
      stockCount: p.stockCount || 50,
      isTrending: !!p.isTrending,
      isBestSeller: !!p.isBestSeller,
      isDailyEssential: !!p.isDailyEssential,
      isDeal: !!p.isDeal
    });
    setProductModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this grocery product?')) {
      await api.delete(`/products/${id}`);
      fetchAllData();
    }
  };

  // Update Order Status
  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchAllData();
    } catch (err) {
      alert('Error updating status');
    }
  };

  // Create Coupon
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', couponForm);
      setCouponForm({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 299,
        maxDiscount: 100
      });
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating coupon');
    }
  };

  const handleDeleteCoupon = async (id) => {
    await api.delete(`/coupons/${id}`);
    fetchAllData();
  };

  // Create Category
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', categoryForm);
      setCategoryForm({ name: '', image: '', description: '' });
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating category');
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-amber-600 mx-auto" />
        <h3 className="text-lg font-black text-slate-900">Admin Dashboard Access</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {user
            ? `Currently signed in as ${user.fullName || user.email} (${user.role}). Sign in with store admin credentials to access inventory and sales controls.`
            : 'This portal is reserved for store administrators. Sign in to manage products, categories, coupons, and orders.'}
        </p>
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            disabled={switchingRole}
            onClick={async () => {
              setSwitchingRole(true);
              await demoLogin('admin');
              setSwitchingRole(false);
            }}
            className="w-full py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase rounded-xl transition disabled:opacity-60"
          >
            {switchingRole ? 'Signing in...' : '⚡ Instant Demo Admin Login'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              Sign In Modal
            </button>
            <Link href="/login"
              state={{ from: { pathname: '/admin' } }}
              className="py-2.5 px-3 border border-slate-200 hover:border-amber-500 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center"
            >
              Login Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400">QuickBasket Headquarters</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Store Management Console
          </h1>
        </div>

        <button
          onClick={fetchAllData}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-100">
        {[
          { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
          { id: 'products', label: `Manage Products (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
          { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
          { id: 'coupons', label: `Coupons (${coupons.length})`, icon: Tag }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Overview & KPI Cards */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Revenue
              </span>
              <p className="text-3xl font-black text-slate-900">₹{analytics.totalSales || 0}</p>
              <span className="text-[11px] font-bold text-emerald-600 mt-2 block">
                ⚡ +18.4% from last week
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Orders
              </span>
              <p className="text-3xl font-black text-slate-900">{analytics.totalOrders || 0}</p>
              <span className="text-[11px] text-slate-400 mt-2 block">
                {analytics.deliveredCount || 0} successfully delivered
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Live Active Dispatches
              </span>
              <p className="text-3xl font-black text-emerald-600">{analytics.activeOrdersCount || 0}</p>
              <span className="text-[11px] font-bold text-emerald-800 mt-2 block">
                ⚡ Under 10-min SLA
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Catalog Size
              </span>
              <p className="text-3xl font-black text-slate-900">{products.length}</p>
              <span className="text-[11px] text-slate-400 mt-2 block">
                Across {categories.length} grocery categories
              </span>
            </div>

          </div>

          {/* Recent Orders Overview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Recent Orders Stream
              </h3>
              <button onClick={() => setActiveTab('orders')} className="text-xs font-bold text-[#0c831f] hover:underline">
                View All Orders →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Order Number</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium">
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-3 px-3">{o.user?.name || o.shippingAddress?.fullName}</td>
                      <td className="py-3 px-3">{o.items?.length || 0} items</td>
                      <td className="py-3 px-3 font-bold text-slate-900">₹{o.totalPrice}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: Manage Products */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by title, brand, category..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
              />
            </div>

            <button
              onClick={() => {
                setEditingProductId(null);
                setProductForm({
                  name: '',
                  brand: '',
                  category: 'Fruits & Vegetables',
                  unit: '1 kg',
                  price: '',
                  originalPrice: '',
                  image: '',
                  description: '',
                  stockCount: 50,
                  isTrending: false,
                  isBestSeller: false,
                  isDailyEssential: false,
                  isDeal: false
                });
                setProductModalOpen(true);
              }}
              className="px-4 py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product</span>
            </button>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price / MRP</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Tags</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img src={p.image} alt="" className="w-10 h-10 object-contain rounded-lg bg-slate-50 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-xs">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.brand} • {p.unit}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{p.category}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900">₹{p.price}</span>
                        {p.originalPrice > p.price && (
                          <span className="text-[10px] text-slate-400 line-through ml-1">₹{p.originalPrice}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.inStock ? 'bg-emerald-50 text-[#0c831f]' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {p.inStock ? `${p.stockCount || 50} in stock` : 'Out of Stock'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {p.isTrending && <span className="text-[9px] bg-purple-50 text-purple-700 font-bold px-1.5 py-0.2 rounded">Trend</span>}
                          {p.isBestSeller && <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.2 rounded">Best</span>}
                          {p.isDeal && <span className="text-[9px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.2 rounded">Deal</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEditProductClick(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
                            title="Edit Product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add / Edit Product Modal */}
          {productModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    {editingProductId ? 'Edit Product' : 'Add New Grocery Product'}
                  </h3>
                  <button onClick={() => setProductModalOpen(false)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleProductSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Product Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fresh Red Hybrid Tomatoes"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Brand Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. QuickBasket Fresh / Amul"
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                      >
                        {categories.map((c) => (
                          <option key={c._id || c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="35"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Original MRP (₹)</label>
                      <input
                        type="number"
                        required
                        placeholder="45"
                        value={productForm.originalPrice}
                        onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Unit / Pack Size</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1 kg / 500 g"
                        value={productForm.unit}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      required
                      placeholder="https://images.unsplash.com/..."
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Fresh product details, origin and culinary suggestions"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                    />
                  </div>

                  {/* Highlights checkboxes */}
                  <div className="flex flex-wrap gap-4 pt-1 font-semibold text-slate-700">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.isTrending}
                        onChange={(e) => setProductForm({ ...productForm, isTrending: e.target.checked })}
                      />
                      <span>Trending</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.isBestSeller}
                        onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                      />
                      <span>Best Seller</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.isDailyEssential}
                        onChange={(e) => setProductForm({ ...productForm, isDailyEssential: e.target.checked })}
                      />
                      <span>Daily Essential</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={productForm.isDeal}
                        onChange={(e) => setProductForm({ ...productForm, isDeal: e.target.checked })}
                      />
                      <span>Hot Deal</span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <button
                      type="button"
                      onClick={() => setProductModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-[#0c831f] text-white font-bold"
                    >
                      {editingProductId ? 'Update Product' : 'Add Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Manage Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Customer Orders Management
          </h3>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer Details</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Current Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {orders.map((o) => (
                    <tr key={o._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{o.shippingAddress?.fullName}</span>
                        <span className="text-[10px] text-slate-400">{o.shippingAddress?.phone}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">{o.shippingAddress?.street}, {o.shippingAddress?.city}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">₹{o.totalPrice}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          o.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {o.orderStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleOrderStatusUpdate(o._id, e.target.value)}
                          className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none"
                        >
                          <option value="Order Placed">Order Placed</option>
                          <option value="Order Confirmed">Order Confirmed</option>
                          <option value="Packing">Packing</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Manage Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create Category Form */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-xs">
            <h4 className="font-bold text-sm text-slate-900">Create New Category</h4>
            <form onSubmit={handleCategorySubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Superfoods"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={categoryForm.image}
                  onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  placeholder="Aisle highlights and products included..."
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold rounded-xl transition"
              >
                Add Category
              </button>
            </form>
          </div>

          {/* Categories Grid */}
          <div className="lg:col-span-8 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Categories &amp; Item Counts ({categories.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div key={c._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
                  <img
                    src={c.image}
                    alt={c.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
                    }}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{c.name}</h4>
                    <p className="text-[10px] text-slate-400">{c.itemCount || 0} active products</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Manage Coupons */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Create Coupon Form */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 text-xs">
            <h4 className="font-bold text-sm text-slate-900">Create Discount Coupon</h4>
            <form onSubmit={handleCouponSubmit} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FRESH50"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  placeholder="50% off on fresh produce"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount (% or ₹)</label>
                  <input
                    type="number"
                    required
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Order (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[#0c831f] text-white font-bold rounded-xl"
              >
                Create Coupon
              </button>
            </form>
          </div>

          {/* Active Coupons List */}
          <div className="lg:col-span-8 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Active Coupons ({coupons.length})</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {coupons.map((c) => (
                <div key={c._id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="font-mono font-black text-sm text-[#0c831f] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      {c.code}
                    </span>
                    <p className="text-xs text-slate-600 font-medium mt-1.5">{c.description}</p>
                    <p className="text-[10px] text-slate-400">Min Order: ₹{c.minOrderAmount} • Max Disc: ₹{c.maxDiscount}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(c._id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default AdminDashboardPage;
