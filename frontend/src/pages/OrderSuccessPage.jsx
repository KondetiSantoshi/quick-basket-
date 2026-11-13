import React, { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { CheckCircle2, Zap, ArrowRight, Truck, ShieldCheck } from 'lucide-react';

const OrderSuccessPage = () => {
  const { orderNumber } = useParams();
  const location = useLocation();
  const order = location.state?.order;

  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.warn('Confetti error', e);
    }
  }, []);

  const paymentLabel =
    order?.paymentDetails?.methodLabel ||
    (order?.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : order?.paymentMethod || 'Online Payment');

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      {/* Success Badge */}
      <div className="w-20 h-20 bg-emerald-100 text-[#0c831f] rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10 animate-in zoom-in-75 duration-300">
        <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
      </div>

      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#0c831f] font-bold text-xs uppercase tracking-wider mb-2 border border-emerald-200">
        <Zap className="w-3.5 h-3.5 fill-[#0c831f]" />
        Superfast Dispatch Triggered
      </span>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
        Order Placed Successfully!
      </h1>

      <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
        Your groceries are being picked right now from our local micro-store. Delivery partner will be at your doorstep in <strong className="text-slate-900">10-14 mins</strong>!
      </p>

      {/* Order Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm text-left mb-8 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
          <div>
            <span className="text-slate-400 block">Order Number</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{orderNumber}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Estimated Arrival</span>
            <span className="font-bold text-[#0c831f] text-sm">~12 Mins</span>
          </div>
        </div>

        {order && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#0c831f] shrink-0" />
              <div>
                <span className="text-slate-400 block text-[11px]">Payment Mode</span>
                <span className="font-bold text-slate-800">{paymentLabel}</span>
              </div>
            </div>
            <div className="sm:text-right">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                order.paymentStatus === 'Completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {order.paymentStatus === 'Completed' ? 'Payment Verified' : `${order.paymentStatus || 'Pending'}`}
              </span>
              {order.paymentDetails?.transactionId && (
                <p className="text-[10px] font-mono text-slate-500 mt-1">
                  Txn ID: {order.paymentDetails.transactionId}
                </p>
              )}
            </div>
          </div>
        )}

        {order?.shippingAddress && (
          <div className="text-xs space-y-1">
            <span className="text-slate-400 block font-semibold">Delivering To</span>
            <p className="font-bold text-slate-800">{order.shippingAddress.fullName}</p>
            <p className="text-slate-500">
              {order.shippingAddress.street}, {order.shippingAddress.city} - {order.shippingAddress.pincode}
            </p>
          </div>
        )}

        {order?.items && (
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs text-slate-400 block font-semibold mb-2">Items Ordered ({order.items.length})</span>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
                      }}
                      className="w-7 h-7 rounded-lg object-contain bg-slate-50"
                    />
                    <span className="text-slate-700 truncate">
                      {item.name} ({item.unit}) x {item.quantity}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm font-black text-slate-900">
          <span>{order?.paymentMethod === 'COD' ? 'Amount Payable on Delivery' : 'Amount Paid'}</span>
          <span>₹{order?.totalPrice ?? '---'}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to={`/order-tracking/${orderNumber}`}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 active:scale-98 transition"
        >
          <Truck className="w-4 h-4" />
          <span>Track Order Live</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          to="/"
          className="w-full sm:w-auto px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider rounded-2xl transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
