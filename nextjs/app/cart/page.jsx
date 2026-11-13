'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Truck, 
  Tag, 
  ArrowLeft 
} from 'lucide-react';

export default function CartPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    platformFee,
    FREE_DELIVERY_THRESHOLD,
    amountNeededForFreeDelivery,
    coupon,
    couponDiscount,
    couponError,
    applyCoupon,
    removeCoupon,
    finalTotal
  } = useCart();

  const { user, setAuthModalOpen } = useAuth();
  const router = useRouter();
  const [couponInput, setCouponInput] = useState('');

  const freeDeliveryPercent = Math.min(
    100,
    Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100)
  );

  const handleCheckout = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    router.push('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Your basket is empty</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
          Looks like you haven&apos;t added anything to your cart yet. Discover fresh fruits, veggies and dairy delivered in 10 minutes!
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs uppercase tracking-wider shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Start Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Review Basket</h1>
          <p className="text-xs text-slate-500">{cartItems.length} items ready for 10-minute dispatch</p>
        </div>
        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1.5 transition"
        >
          <Trash2 className="w-4 h-4" />
          Empty Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-8 space-y-4">
          {/* Free Delivery Bar */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="flex items-center gap-2 text-emerald-950">
                <Truck className="w-4 h-4 text-[#0c831f]" />
                {amountNeededForFreeDelivery === 0 ? (
                  <strong className="text-[#0c831f]">🎉 Free Delivery Unlocked!</strong>
                ) : (
                  <span>Add <strong className="text-[#0c831f]">₹{amountNeededForFreeDelivery}</strong> more for <strong>FREE Delivery</strong></span>
                )}
              </span>
              <span className="font-mono text-xs text-emerald-800 font-bold">{freeDeliveryPercent}%</span>
            </div>
            <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-[#0c831f] h-full rounded-full transition-all duration-500"
                style={{ width: `${freeDeliveryPercent}%` }}
              />
            </div>
          </div>

          {/* Items */}
          <div className="bg-white rounded-3xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {cartItems.map((item) => (
              <div key={item.cartKey || `${item._id}__${item.unit}`} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-slate-50/50 transition">
                <img
                  src={item.image}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
                  }}
                  className="w-16 h-16 object-contain rounded-2xl bg-slate-50 p-1 shrink-0 border border-slate-100"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">{item.brand}</span>
                  <h3 className="text-sm font-bold text-slate-800 truncate">{item.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{item.unit}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-black text-slate-900">₹{item.price}</span>
                    {item.originalPrice > item.price && (
                      <span className="text-xs text-slate-400 line-through">₹{item.originalPrice}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center bg-[#0c831f] text-white rounded-xl overflow-hidden shadow-sm shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, item.quantity - 1, item.unit)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[#095e16] transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold font-mono">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item._id, item.quantity + 1, item.unit)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[#095e16] transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bill Summary & Proceed */}
        <div className="lg:col-span-4 space-y-4">
          {/* Coupon */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#0c831f]" />
              Promo Coupons
            </h4>
            {coupon ? (
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#0c831f] block">{coupon.code}</span>
                  <span className="text-[11px] text-emerald-800">Saved ₹{coupon.discount}!</span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME50)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none focus:border-[#0c831f]"
                  />
                  <button
                    type="button"
                    onClick={() => { applyCoupon(couponInput); setCouponInput(''); }}
                    className="px-4 py-2 bg-[#0c831f] text-white font-bold text-xs rounded-xl"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>}
              </div>
            )}
          </div>

          {/* Bill breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2">Order Summary</h4>
            <div className="flex justify-between text-slate-600">
              <span>Item Total</span>
              <span className="font-bold text-slate-800">₹{subtotal}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span>{deliveryFee === 0 ? <strong className="text-[#0c831f]">FREE</strong> : `₹${deliveryFee}`}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Platform Fee</span>
              <span>₹{platformFee}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-[#0c831f] font-bold">
                <span>Coupon ({coupon.code})</span>
                <span>-₹{couponDiscount}</span>
              </div>
            )}
            <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
              <span>Total Payable</span>
              <span>₹{finalTotal}</span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full mt-4 py-3.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 active:scale-98 transition"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
