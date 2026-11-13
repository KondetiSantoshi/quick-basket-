import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useLocation } from '../context/LocationContext';
import GeoMap from '../components/common/GeoMap';
import api from '../services/api';
import ProductCard from '../components/product/ProductCard';
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  CreditCard, 
  HelpCircle, 
  LogOut, 
  Plus, 
  Trash2, 
  Check, 
  ArrowRight,
  Truck,
  Clock,
  ShieldCheck,
  ChevronDown,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Navigation
} from 'lucide-react';

const UserDashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const { user, updateProfile, addAddress, deleteAddress, changePassword, logout } = useAuth();
  const { addToCart } = useCart();
  const { wishlist } = useWishlist();
  const { selectedLocation, detectCurrentLocation, resolveCoordinates, isDetecting } = useLocation();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Edit Profile form
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || user?.name || '',
    phone: user?.phone || ''
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Change Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Logout confirmation modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // New Address form
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrGeoNote, setAddrGeoNote] = useState('');
  const [newAddr, setNewAddr] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    street: '',
    landmark: '',
    city: selectedLocation?.city || 'Bangalore',
    state: selectedLocation?.state || 'Karnataka',
    pincode: selectedLocation?.pincode || '',
    lat: selectedLocation?.lat || 12.9352,
    lng: selectedLocation?.lng || 77.6245,
    type: 'Home'
  });

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Sync profile form when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || user.name || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  // Fetch Orders & Payment History
  useEffect(() => {
    const fetchOrdersAndPayments = async () => {
      if (!user) return;
      setLoadingOrders(true);
      try {
        const [ordersRes, paymentsRes] = await Promise.all([
          api.get('/orders/my-orders'),
          api.get('/payment/my-history').catch(() => ({ data: [] }))
        ]);
        setOrders(ordersRes.data || []);
        setPayments(paymentsRes.data || []);
      } catch (err) {
        console.error('Failed to load orders or payments', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrdersAndPayments();
  }, [user]);

  // Fetch Wishlist products
  useEffect(() => {
    const fetchWishlistProducts = async () => {
      if (!wishlist || wishlist.length === 0) {
        setWishlistProducts([]);
        return;
      }
      try {
        const { data } = await api.get('/products?limit=250');
        const filtered = (data.products || []).filter((p) => wishlist.includes(p._id));
        setWishlistProducts(filtered);
      } catch (err) {
        console.error('Failed to load wishlist products', err);
      }
    };
    fetchWishlistProducts();
  }, [wishlist]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    const res = await updateProfile(profileForm);
    if (res.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } else {
      setProfileError(res.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }

    setIsChangingPassword(true);
    const res = await changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword,
      passwordForm.confirmPassword
    );
    setIsChangingPassword(false);

    if (res.success) {
      setPasswordSuccess(res.message);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(''), 4000);
    } else {
      setPasswordError(res.message);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!newAddr.street || !newAddr.pincode) return;
    await addAddress(newAddr);
    setShowAddressModal(false);
    setAddrGeoNote('');
    setNewAddr({
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      street: '',
      landmark: '',
      city: selectedLocation?.city || 'Bangalore',
      state: selectedLocation?.state || 'Karnataka',
      pincode: '',
      lat: selectedLocation?.lat || 12.9352,
      lng: selectedLocation?.lng || 77.6245,
      type: 'Home'
    });
  };

  const handleDashboardAutoFillGps = async () => {
    setAddrGeoNote('');
    const res = await detectCurrentLocation({ closeOnSuccess: false });
    if (res.success && res.location) {
      const loc = res.location;
      setNewAddr((prev) => ({
        ...prev,
        street: loc.street || loc.area || prev.street,
        landmark: loc.landmark || prev.landmark,
        city: loc.city || prev.city,
        state: loc.state || prev.state,
        pincode: loc.pincode || prev.pincode,
        lat: loc.lat,
        lng: loc.lng
      }));
      setAddrGeoNote(`Detected: ${loc.area}, ${loc.city} (${loc.pincode})`);
    } else if (res.message) {
      setAddrGeoNote(res.message);
    }
  };

  const handleDashboardMapPin = async (lat, lng) => {
    setNewAddr((prev) => ({ ...prev, lat, lng }));
    const resolved = await resolveCoordinates(lat, lng);
    setNewAddr((prev) => ({
      ...prev,
      street: resolved.street || resolved.area || prev.street,
      landmark: resolved.landmark || prev.landmark,
      city: resolved.city || prev.city,
      state: resolved.state || prev.state,
      pincode: resolved.pincode || prev.pincode,
      lat,
      lng
    }));
    setAddrGeoNote(`Pinned: ${resolved.area}, ${resolved.city}`);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-100 text-center">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Please Sign In</h3>
        <p className="text-xs text-slate-500 mb-4">You need to sign in to view your dashboard, profile, and orders.</p>
        <Link to="/login" className="px-5 py-2.5 bg-[#0c831f] text-white rounded-xl text-xs font-bold">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Account
          </h1>
          <p className="text-xs text-slate-500">Manage orders, security profile and saved addresses</p>
        </div>

        <button
          onClick={() => setShowLogoutModal(true)}
          className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 border border-rose-100 shadow-2xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 p-3 space-y-1 shadow-sm">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'orders', label: 'My Orders', icon: Package, badge: orders.length },
            { id: 'addresses', label: 'Saved Addresses', icon: MapPin },
            { id: 'wishlist', label: 'Wishlist', icon: Heart, badge: wishlist.length },
            { id: 'security', label: 'Change Password', icon: KeyRound },
            { id: 'payments', label: 'Payment History', icon: CreditCard },
            { id: 'help', label: 'Help & Support', icon: HelpCircle }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-[#0c831f] text-white shadow-md shadow-emerald-700/20'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Profile Information
                  </h3>
                  <p className="text-xs text-slate-400">Account status and contact details</p>
                </div>

                {/* Verification Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    user.emailVerified
                      ? 'bg-emerald-50 text-[#0c831f] border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Email {user.emailVerified ? 'Verified' : 'Pending'}</span>
                  </span>

                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                    user.phoneVerified
                      ? 'bg-emerald-50 text-[#0c831f] border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mobile {user.phoneVerified ? 'Verified' : 'Active'}</span>
                  </span>
                </div>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#0c831f] text-xs font-bold rounded-xl flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Profile details updated successfully!
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-[#0c831f] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address (Registered)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-[#0c831f] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs rounded-xl shadow-md transition"
                >
                  Save Profile Changes
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: Orders */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Order History ({orders.length})</h3>

              {orders.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No orders placed yet</p>
                  <Link to="/products" className="inline-block px-5 py-2 bg-[#0c831f] text-white text-xs font-bold rounded-xl">
                    Order Fresh Groceries Now
                  </Link>
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord._id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-800 text-sm">{ord.orderNumber}</span>
                        <span className="text-slate-400 block mt-0.5">
                          {new Date(ord.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                          ord.orderStatus === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ord.orderStatus}
                        </span>
                        <Link
                          to={`/order-tracking/${ord.orderNumber}`}
                          className="px-3 py-1 rounded-xl bg-[#0c831f] text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Track</span>
                        </Link>
                      </div>
                    </div>

                    {/* Order items row */}
                    <div className="flex flex-wrap items-center gap-3">
                      {ord.items?.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl text-xs">
                          <img src={it.image} alt="" className="w-8 h-8 rounded-lg object-contain bg-white" />
                          <div>
                            <p className="font-bold text-slate-800 truncate max-w-[120px]">{it.name}</p>
                            <p className="text-[10px] text-slate-400">Qty: {it.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-500 font-medium">
                          Method: <strong className="text-slate-700">{ord.paymentDetails?.methodLabel || ord.paymentMethod}</strong>
                        </span>
                        <span className={`px-2 py-0.5 rounded font-semibold text-[10px] ${
                          ord.paymentStatus === 'Completed'
                            ? 'bg-emerald-50 text-[#0c831f]'
                            : ord.paymentStatus === 'Failed'
                              ? 'bg-rose-50 text-rose-600'
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          Payment: {ord.paymentStatus}
                        </span>
                      </div>
                      <span className="text-sm font-black text-slate-900">Total: ₹{ord.totalPrice}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Saved Addresses */}
          {activeTab === 'addresses' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">Saved Addresses</h3>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-3.5 py-1.5 bg-[#0c831f] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.addresses?.map((addr) => (
                  <div key={addr._id} className="p-4 rounded-2xl border border-slate-200 relative group bg-white hover:border-emerald-300 transition">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {addr.type || 'Home'}
                        </span>
                        {addr.lat && addr.lng && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100/70 text-[#0c831f] flex items-center gap-0.5">
                            <MapPin className="w-2.5 h-2.5" /> GPS
                          </span>
                        )}
                      </div>
                      {user.addresses.length > 1 && (
                        <button
                          onClick={() => deleteAddress(addr._id)}
                          className="text-slate-400 hover:text-rose-600 transition"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug">{addr.street}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {addr.landmark && `${addr.landmark}, `}{addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Address Modal */}
              {showAddressModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-bold text-slate-900">Add New Delivery Address</h4>
                      <button
                        type="button"
                        onClick={handleDashboardAutoFillGps}
                        disabled={isDetecting}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition disabled:opacity-60"
                      >
                        <Navigation className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                        <span>{isDetecting ? 'Detecting...' : 'Use GPS'}</span>
                      </button>
                    </div>

                    {addrGeoNote && (
                      <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        {addrGeoNote}
                      </p>
                    )}

                    <GeoMap
                      mode="picker"
                      lat={newAddr.lat || 12.9352}
                      lng={newAddr.lng || 77.6245}
                      height="155px"
                      onSelectCoords={handleDashboardMapPin}
                    />

                    <form onSubmit={handleAddAddress} className="space-y-3">
                      <input
                        type="text"
                        required
                        placeholder="House / Flat / Block No, Street"
                        value={newAddr.street}
                        onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                      />
                      <input
                        type="text"
                        placeholder="Landmark (Optional)"
                        value={newAddr.landmark}
                        onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="City"
                          value={newAddr.city}
                          onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                        />
                        <input
                          type="text"
                          required
                          placeholder="State"
                          value={newAddr.state}
                          onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Pincode"
                          value={newAddr.pincode}
                          onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                        />
                        <select
                          value={newAddr.type}
                          onChange={(e) => setNewAddr({ ...newAddr, type: e.target.value })}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                        >
                          <option value="Home">Home</option>
                          <option value="Work">Work</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddressModal(false)}
                          className="flex-1 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-xl text-xs font-bold bg-[#0c831f] text-white"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Change Password (Security) */}
          {activeTab === 'security' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Change Account Password</h3>
                <p className="text-xs text-slate-400">Keep your grocery delivery account safe with a strong password</p>
              </div>

              {passwordSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Password (Min. 6 characters) *</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-6 py-2.5 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold rounded-xl shadow-md transition"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: Wishlist */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900">Saved Wishlist ({wishlistProducts.length})</h3>
              {wishlistProducts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 space-y-3">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Your wishlist is empty</p>
                  <p className="text-xs text-slate-400">Tap the heart icon on any grocery item to save it for later.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {wishlistProducts.map((p) => (
                    <ProductCard key={p._id} product={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Payment History */}
          {activeTab === 'payments' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Payment History & Gateways
                  </h3>
                  <p className="text-xs text-slate-400">
                    Verified UPI, Card, NetBanking, Wallet & Cash on Delivery records
                  </p>
                </div>
                <span className="text-xs font-bold text-[#0c831f] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  {payments.length > 0 ? payments.length : orders.length} Records
                </span>
              </div>

              {payments.length === 0 && orders.length === 0 ? (
                <p className="text-xs text-slate-400">No payment transactions recorded yet.</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((pay) => (
                    <div
                      key={pay._id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-slate-900">{pay.orderNumber}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                            {pay.methodLabel || pay.paymentMethod}
                          </span>
                          {pay.gatewayMode && (
                            <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                              {pay.gatewayMode}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {new Date(pay.transactionDate || pay.createdAt).toLocaleString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {pay.upiDetails?.vpa && ` • VPA: ${pay.upiDetails.vpa}`}
                          {pay.cardDetails?.last4 && ` • ${pay.cardDetails.network || 'Card'} •••• ${pay.cardDetails.last4}`}
                          {pay.netbankingDetails?.bankName && ` • ${pay.netbankingDetails.bankName}`}
                          {pay.walletDetails?.walletName && ` • ${pay.walletDetails.walletName}`}
                        </p>
                        {(pay.razorpayPaymentId || pay.paymentId) && (
                          <p className="text-[10px] font-mono text-slate-400">
                            Txn Ref: {pay.razorpayPaymentId || pay.paymentId}
                          </p>
                        )}
                      </div>
                      <div className="sm:text-right">
                        <span className="font-black text-slate-900 text-sm block">₹{pay.amount}</span>
                        <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          pay.paymentStatus === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : pay.paymentStatus === 'Failed'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {pay.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Include COD or legacy orders not yet stored in Payments collection */}
                  {orders
                    .filter((o) => !payments.some((p) => p.orderNumber === o.orderNumber))
                    .map((o) => (
                      <div
                        key={o._id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-900">{o.orderNumber}</span>
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                              {o.paymentDetails?.methodLabel || o.paymentMethod}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {new Date(o.createdAt).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {o.paymentDetails?.transactionId && (
                            <p className="text-[10px] font-mono text-slate-400">
                              Ref: {o.paymentDetails.transactionId}
                            </p>
                          )}
                        </div>
                        <div className="sm:text-right">
                          <span className="font-black text-slate-900 text-sm block">₹{o.totalPrice}</span>
                          <span className={`inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            o.paymentStatus === 'Completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.paymentStatus === 'Failed'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {o.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: Help & Support */}
          {activeTab === 'help' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100">
                Frequently Asked Questions
              </h3>

              <div className="space-y-3">
                {[
                  {
                    q: 'How does 10-minute grocery delivery work?',
                    a: 'We maintain localized micro-warehouses (dark stores) within a 2-3 km radius of your neighborhood. When you place an order, our pickers pack it in under 2 minutes, and our riders dispatch immediately.'
                  },
                  {
                    q: 'What is the minimum order for free delivery?',
                    a: 'All orders above ₹299 qualify for 100% FREE delivery! Orders below ₹299 have a nominal delivery fee of ₹25.'
                  },
                  {
                    q: 'What payment modes are accepted?',
                    a: 'We accept UPI (Google Pay, PhonePe, Paytm, BHIM & dynamic UPI QR codes), Credit/Debit Cards with 3D Secure, Net Banking, Mobile Wallets, Razorpay Express, and Cash on Delivery.'
                  }
                ].map((faq, i) => (
                  <details key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <summary className="font-bold text-xs text-slate-800 cursor-pointer list-none flex items-center justify-between">
                      <span>{faq.q}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed pt-2 border-t border-slate-200/60">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Confirm Log Out</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to log out of your QuickBasket account? Your cart and active dispatches will be preserved.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserDashboardPage;
