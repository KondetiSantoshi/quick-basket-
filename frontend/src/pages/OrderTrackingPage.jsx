import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import GeoMap from '../components/common/GeoMap';
import { 
  PackageCheck, 
  CheckCircle, 
  Boxes, 
  Bike, 
  Home, 
  Phone, 
  Star, 
  Clock, 
  Navigation, 
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Zap,
  MapPin
} from 'lucide-react';

const STAGES = [
  { key: 'Order Placed', title: 'Order Placed', desc: 'Order received at dark store' },
  { key: 'Order Confirmed', title: 'Order Confirmed', desc: 'Items accepted and picking started' },
  { key: 'Packing', title: 'Packing Items', desc: 'Sealed safely in eco-friendly bag' },
  { key: 'Out for Delivery', title: 'Out for Delivery', desc: 'Rider on the way on electric scooter' },
  { key: 'Delivered', title: 'Delivered', desc: 'Order handed over at doorstep' }
];

const OrderTrackingPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [timeLeftMins, setTimeLeftMins] = useState(11);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data);
    } catch (err) {
      console.error('Failed to load order', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 15000); // Poll status
    return () => clearInterval(interval);
  }, [id]);

  // Simulated countdown
  useEffect(() => {
    if (!order) return;
    if (order.orderStatus === 'Delivered') {
      setTimeLeftMins(0);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeftMins((prev) => (prev > 1 ? prev - 1 : 1));
    }, 45000);
    return () => clearInterval(timer);
  }, [order?.orderStatus]);

  // Simulate updating status manually for testing/demo
  const handleSimulateNextStage = async (nextStatus) => {
    if (!order) return;
    setIsUpdating(true);
    try {
      const { data } = await api.put(`/orders/${order._id}/status`, {
        status: nextStatus
      });
      setOrder(data);
    } catch (err) {
      console.error('Failed to update stage', err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-[#0c831f] mb-3" />
        <p className="text-sm font-semibold">Loading live order track...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-100 text-center">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Order Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">No order exists matching identifier "{id}".</p>
        <Link to="/" className="px-5 py-2.5 bg-[#0c831f] text-white rounded-xl text-xs font-bold">
          Return Home
        </Link>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.key === order.orderStatus);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-400">Order ID:</span>
            <span className="font-mono font-bold text-slate-800 text-sm">{order.orderNumber}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Live Order Tracking
          </h1>
        </div>

        {/* Estimated Time Badge */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-2xl">
          <Clock className="w-5 h-5 text-[#0c831f]" />
          <div>
            <span className="text-[10px] uppercase font-bold text-emerald-800 block leading-tight">
              {order.orderStatus === 'Delivered' ? 'Delivered In' : 'Arriving in approximately'}
            </span>
            <span className="text-base font-black text-[#0c831f]">
              {order.orderStatus === 'Delivered' ? 'Delivered' : `${timeLeftMins} Minutes`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: 5 Stages Timeline & Interactive Simulator */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Timeline Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              Delivery Progress
            </h3>

            <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {STAGES.map((stage, idx) => {
                const isCompleted = idx <= activeIndex;
                const isCurrent = idx === activeIndex;

                return (
                  <div key={stage.key} className="relative flex items-start gap-4 group">
                    {/* Step Icon */}
                    <div
                      className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-sm ${
                        isCompleted
                          ? 'bg-[#0c831f] text-white ring-4 ring-emerald-50'
                          : 'bg-white border-2 border-slate-300 text-slate-400'
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`text-sm font-bold ${
                            isCurrent
                              ? 'text-[#0c831f]'
                              : isCompleted
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {stage.title}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-[#0c831f] animate-pulse">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{stage.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stage Simulation Bar for testing/demo presentation */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Interactive Simulator (Demo Test Buttons)
                </span>
                <span className="text-[10px] text-slate-400">Advance order stage</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {STAGES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleSimulateNextStage(s.key)}
                    disabled={isUpdating}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                      order.orderStatus === s.key
                        ? 'bg-[#0c831f] text-white border-[#0c831f]'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-300'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Delivery Partner Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Assigned Delivery Partner
            </h3>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={order.deliveryPartner?.photo || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                  alt="Delivery Partner"
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-400"
                />
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{order.deliveryPartner?.name || 'Ramesh Kumar'}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <Bike className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{order.deliveryPartner?.vehicleNumber || 'KA-01-EQ-4421'}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-lg mb-1">
                  <span>{order.deliveryPartner?.rating || 4.9}</span>
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                </div>
                <a
                  href={`tel:${order.deliveryPartner?.phone || '+919845012345'}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#0c831f] font-bold text-xs transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Partner</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Geolocation Route Map & Order Items */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Interactive Geo Route Map */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-[#0c831f]" />
                Live GPS Delivery Route
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                ⚡ {order.deliveryHub?.distanceKm ? `${order.deliveryHub.distanceKm} km route` : 'GPS Active'}
              </span>
            </div>

            <GeoMap
              mode="tracker"
              lat={order.shippingAddress?.lat || 12.9352}
              lng={order.shippingAddress?.lng || 77.6245}
              hubLat={order.deliveryHub?.lat || (order.shippingAddress?.lat ? order.shippingAddress.lat - 0.01 : 12.926)}
              hubLng={order.deliveryHub?.lng || (order.shippingAddress?.lng ? order.shippingAddress.lng - 0.01 : 77.614)}
              hubName={order.deliveryHub?.name || 'QuickBasket Micro Dark-Store'}
              progressRatio={[0.1, 0.3, 0.5, 0.78, 1.0][activeIndex] ?? 0.3}
              height="245px"
            />

            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 rounded-2xl p-3 border border-slate-100">
              <div className="min-w-0">
                <span className="font-bold text-slate-400 uppercase block text-[9px]">Dispatch Hub</span>
                <span className="font-bold text-slate-800 truncate block">
                  🏪 {order.deliveryHub?.name || 'QuickBasket Dark-Store'}
                </span>
              </div>
              <div className="min-w-0">
                <span className="font-bold text-slate-400 uppercase block text-[9px]">Drop Address</span>
                <span className="font-bold text-slate-800 truncate block">
                  🏠 {order.shippingAddress?.street}, {order.shippingAddress?.pincode}
                </span>
              </div>
            </div>
          </div>

          {/* Items in this Order */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Items in this Basket ({order.items?.length || 0})
            </h4>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-50">
              {order.items?.map((item, idx) => (
                <div key={idx} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate mr-2">
                    <img src={item.image} alt="" className="w-9 h-9 rounded-xl object-contain bg-slate-50 shrink-0" />
                    <div className="truncate">
                      <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.quantity} x ₹{item.price}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-sm font-black text-slate-900">
              <span>Total Paid</span>
              <span>₹{order.totalPrice}</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default OrderTrackingPage;
