import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  Sparkles, 
  Tag, 
  Check, 
  ShieldCheck, 
  Truck,
  Heart
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const CartDrawer = () => {
  const {
    cartItems,
    isDrawerOpen,
    setIsDrawerOpen,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    originalSubtotal,
    totalItemSavings,
    deliveryFee,
    platformFee,
    FREE_DELIVERY_THRESHOLD,
    amountNeededForFreeDelivery,
    tipAmount,
    setTipAmount,
    coupon,
    couponDiscount,
    couponError,
    applyCoupon,
    removeCoupon,
    finalTotal
  } = useCart();

  const { user, setAuthModalOpen } = useAuth();
  const [couponInput, setCouponInput] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const navigate = useNavigate();

  if (!isDrawerOpen) return null;

  const handleApply = async (code) => {
    setIsApplyingCoupon(true);
    await applyCoupon(code || couponInput);
    setIsApplyingCoupon(false);
    setCouponInput('');
  };

  const handleProceedToCheckout = () => {
    setIsDrawerOpen(false);
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    navigate('/checkout');
  };

  const freeDeliveryPercent = Math.min(
    100,
    Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-sm transition-opacity">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0c831f] flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">My Basket</h3>
                <p className="text-xs text-slate-400">
                  {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-600 transition flex items-center gap-1 px-2 py-1"
                  title="Clear Cart"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Empty State */}
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
              </div>
              <h4 className="text-lg font-bold text-slate-800">Your basket is empty</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Looks like you haven't added anything to your cart yet. Explore fresh fruits, dairy and daily snacks delivered in 10 minutes!
              </p>
              <button
                onClick={() => {
                  setIsDrawerOpen(false);
                  navigate('/products');
                }}
                className="mt-2 px-6 py-2.5 rounded-xl bg-[#0c831f] text-white font-bold text-xs uppercase tracking-wide hover:bg-[#095e16] transition shadow-md shadow-emerald-700/20"
              >
                Start Shopping Now
              </button>
            </div>
          ) : (
            <>
              {/* Scrollable Cart Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {/* Free Delivery Meter */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100">
                  <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5 text-emerald-900">
                      <Truck className="w-4 h-4 text-[#0c831f]" />
                      {amountNeededForFreeDelivery === 0 ? (
                        <span className="font-bold text-[#0c831f]">🎉 Yay! You have unlocked FREE Delivery!</span>
                      ) : (
                        <span>Add <strong className="text-[#0c831f]">₹{amountNeededForFreeDelivery}</strong> more for <strong>FREE Delivery</strong></span>
                      )}
                    </span>
                    <span className="font-mono text-[11px] text-emerald-800 font-bold">{freeDeliveryPercent}%</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-[#0c831f] h-full rounded-full transition-all duration-500"
                      style={{ width: `${freeDeliveryPercent}%` }}
                    />
                  </div>
                </div>

                {/* Cart Items List */}
                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div
                      key={item.cartKey || `${item._id}__${item.unit}`}
                      className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center gap-3 hover:border-emerald-200 transition"
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300';
                        }}
                        className="w-14 h-14 object-contain rounded-xl bg-slate-50 p-1 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 truncate">{item.name}</h4>
                        <p className="text-[11px] text-slate-400 font-medium">{item.unit}</p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-black text-slate-900">₹{item.price}</span>
                          {item.originalPrice > item.price && (
                            <span className="text-[10px] text-slate-400 line-through">₹{item.originalPrice}</span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center bg-[#0c831f] text-white rounded-xl overflow-hidden shadow-sm shrink-0">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1, item.unit)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-[#095e16] transition active:scale-90"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1, item.unit)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-[#095e16] transition active:scale-90"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Tip option */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      Tip your delivery partner
                    </span>
                    {tipAmount > 0 && (
                      <button
                        onClick={() => setTipAmount(0)}
                        className="text-[10px] text-slate-400 hover:text-rose-500"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {[10, 20, 30, 50].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setTipAmount(tipAmount === amount ? 0 : amount)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                          tipAmount === amount
                            ? 'bg-[#0c831f] text-white border-[#0c831f]'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        ₹{amount}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Tag className="w-3.5 h-3.5 text-[#0c831f]" />
                    <span>Apply Discount Coupon</span>
                  </div>

                  {coupon ? (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[#0c831f]" />
                        <div>
                          <p className="text-xs font-bold text-[#0c831f]">{coupon.code}</p>
                          <p className="text-[10px] text-emerald-800 font-medium">Saved ₹{coupon.discount}!</p>
                        </div>
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-xs text-rose-600 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. WELCOME50"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="flex-1 px-3 py-2 bg-white text-xs font-mono font-semibold rounded-xl border border-slate-200 focus:border-[#0c831f] outline-none"
                        />
                        <button
                          onClick={() => handleApply(couponInput)}
                          disabled={!couponInput.trim() || isApplyingCoupon}
                          className="px-4 py-2 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-[11px] text-rose-600 font-medium">{couponError}</p>
                      )}

                      {/* Quick Coupon Chips */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['WELCOME50', 'QUICK100', 'FREEDEL'].map((code) => (
                          <button
                            key={code}
                            onClick={() => handleApply(code)}
                            className="text-[10px] font-mono font-bold bg-white px-2 py-1 rounded-lg border border-dashed border-emerald-400 text-[#0c831f] hover:bg-emerald-50 transition"
                          >
                            +{code}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Bill Summary Breakdown */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Bill Summary</h5>
                  
                  <div className="flex justify-between text-slate-600">
                    <span>Items Total (MRP)</span>
                    <span className="line-through text-slate-400">₹{originalSubtotal}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Discounted Price</span>
                    <span className="font-semibold text-slate-800">₹{subtotal}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Delivery Charge</span>
                    <span>
                      {deliveryFee === 0 ? (
                        <span className="font-bold text-[#0c831f]">FREE</span>
                      ) : (
                        `₹${deliveryFee}`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>Handling & Packaging Fee</span>
                    <span>₹{platformFee}</span>
                  </div>

                  {tipAmount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Rider Tip</span>
                      <span>₹{tipAmount}</span>
                    </div>
                  )}

                  {coupon && (
                    <div className="flex justify-between text-[#0c831f] font-bold">
                      <span>Coupon Discount ({coupon.code})</span>
                      <span>-₹{couponDiscount}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                    <span>To Pay</span>
                    <span>₹{finalTotal}</span>
                  </div>

                  {totalItemSavings + couponDiscount > 0 && (
                    <div className="mt-2 p-2 bg-emerald-100/60 rounded-xl text-center text-xs font-bold text-[#0c831f]">
                      🎉 Total Savings on this order: ₹{totalItemSavings + couponDiscount}
                    </div>
                  )}
                </div>

                {/* Cancellation Policy */}
                <div className="text-[11px] text-slate-400 leading-normal px-1">
                  Orders once placed cannot be cancelled after packing begins. Guaranteed fresh replacement within 2 hours if any issue.
                </div>

              </div>

              {/* Sticky Checkout CTA Footer */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <button
                  onClick={handleProceedToCheckout}
                  className="w-full py-3.5 px-4 bg-[#0c831f] hover:bg-[#095e16] text-white rounded-2xl font-bold flex items-center justify-between shadow-lg shadow-emerald-700/20 active:scale-98 transition group"
                >
                  <div className="text-left leading-tight">
                    <span className="text-[10px] text-emerald-100 font-medium block">Total Payable</span>
                    <span className="text-base font-black">₹{finalTotal}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-sm">
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default CartDrawer;
