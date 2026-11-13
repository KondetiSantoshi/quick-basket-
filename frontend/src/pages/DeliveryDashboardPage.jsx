import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Bike, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Clock, 
  ShieldCheck, 
  Navigation, 
  DollarSign, 
  Package, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';

const DeliveryDashboardPage = () => {
  const { user, isDelivery, isAdmin, demoLogin, setAuthModalOpen } = useAuth();
  const canAccessDelivery = isDelivery || isAdmin;
  const [switchingRole, setSwitchingRole] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    activeOrders: [],
    completedToday: [],
    totalActive: 0,
    totalDeliveredToday: 0,
    todayEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchDeliveryData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/delivery/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load delivery data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canAccessDelivery) {
      fetchDeliveryData();
    }
  }, [canAccessDelivery]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      fetchDeliveryData();
    } catch (err) {
      alert('Failed to update delivery status');
    }
  };

  if (!canAccessDelivery) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
        <Bike className="w-12 h-12 text-teal-600 mx-auto" />
        <h3 className="text-lg font-black text-slate-900">Delivery Partner Portal</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {user
            ? `Currently signed in as ${user.fullName || user.email} (${user.role}). Sign in with a delivery partner or admin account to view dispatch queues.`
            : 'This portal is reserved for registered delivery partners. Sign in to view assigned deliveries and earnings.'}
        </p>
        <div className="flex flex-col gap-2.5 pt-2">
          <button
            type="button"
            disabled={switchingRole}
            onClick={async () => {
              setSwitchingRole(true);
              await demoLogin('delivery');
              setSwitchingRole(false);
            }}
            className="w-full py-2.5 px-5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs uppercase rounded-xl transition disabled:opacity-60"
          >
            {switchingRole ? 'Signing in...' : '⚡ Instant Demo Rider Login'}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
            >
              Sign In Modal
            </button>
            <Link
              to="/login"
              state={{ from: { pathname: '/delivery' } }}
              className="py-2.5 px-3 border border-slate-200 hover:border-teal-500 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center"
            >
              Login Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-teal-100 text-teal-800 font-bold text-[10px] uppercase">
              Rider Portal
            </span>
            <span className="text-xs text-slate-400">Hub: Koramangala Dark Store</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Delivery Partner Dashboard
          </h1>
        </div>

        <button
          onClick={fetchDeliveryData}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 rounded-xl"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Assigned Active Deliveries
          </span>
          <p className="text-3xl font-black text-emerald-600">{dashboardData.totalActive}</p>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Dispatches awaiting delivery
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Completed Deliveries Today
          </span>
          <p className="text-3xl font-black text-slate-900">{dashboardData.totalDeliveredToday}</p>
          <span className="text-[11px] font-bold text-emerald-600 mt-2 block">
            ⚡ 100% on-time rate
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Today's Delivery Incentives
          </span>
          <p className="text-3xl font-black text-teal-600">₹{dashboardData.todayEarnings}</p>
          <span className="text-[11px] text-slate-400 mt-2 block">
            ₹45 per completed drop
          </span>
        </div>

      </div>

      {/* Active Orders List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">
          Live Orders Requiring Delivery ({dashboardData.activeOrders.length})
        </h2>

        {dashboardData.activeOrders.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 space-y-2">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">No active dispatches right now</p>
            <p className="text-xs text-slate-400">All pending groceries are delivered! Rest up for the next wave.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {dashboardData.activeOrders.map((ord) => (
              <div key={ord._id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <span className="font-mono font-black text-slate-900 text-sm">{ord.orderNumber}</span>
                    <span className="text-xs text-slate-400 ml-2 font-medium">({ord.items?.length || 0} items)</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 uppercase tracking-wider w-fit">
                    {ord.orderStatus}
                  </span>
                </div>

                {/* Customer Address & Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Customer Name & Phone</span>
                    <p className="font-bold text-slate-900 text-sm">{ord.shippingAddress?.fullName}</p>
                    <a
                      href={`tel:${ord.shippingAddress?.phone}`}
                      className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>{ord.shippingAddress?.phone}</span>
                    </a>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 uppercase font-bold text-[10px]">Delivery Destination</span>
                    <p className="font-bold text-slate-800 leading-snug">{ord.shippingAddress?.street}</p>
                    <p className="text-slate-500">{ord.shippingAddress?.city} - {ord.shippingAddress?.pincode}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {ord.deliveryHub?.name && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                          🏪 {ord.deliveryHub.name}
                          {ord.deliveryHub.distanceKm ? ` (${ord.deliveryHub.distanceKm} km)` : ''}
                        </span>
                      )}
                      {ord.shippingAddress?.lat && ord.shippingAddress?.lng && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${ord.shippingAddress.lat},${ord.shippingAddress.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#0c831f] bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 transition"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Navigate GPS</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons to update stage */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 mr-2">Update Stage:</span>

                  <button
                    onClick={() => handleUpdateStatus(ord._id, 'Packing')}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition"
                  >
                    1. Mark Picked & Packing
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(ord._id, 'Out for Delivery')}
                    className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition"
                  >
                    2. Out for Delivery
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(ord._id, 'Delivered')}
                    className="px-4 py-1.5 rounded-xl bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs shadow-md transition ml-auto flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Delivered</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default DeliveryDashboardPage;
