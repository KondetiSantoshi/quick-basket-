import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import api from '../services/api';
import PaymentGatewayModal from '../components/checkout/PaymentGatewayModal';
import GeoMap from '../components/common/GeoMap';
import {
  MapPin,
  Clock,
  CreditCard,
  CheckCircle2,
  Plus,
  ShieldCheck,
  Sparkles,
  Zap,
  QrCode,
  Smartphone,
  Building,
  Wallet,
  Banknote,
  ArrowRight,
  Loader2,
  AlertCircle,
  Lock,
  Check,
  Copy,
  Navigation
} from 'lucide-react';

// Dynamically load Razorpay SDK script (used when real merchant keys are active)
const loadRazorpaySDK = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Client-side Luhn checksum check for Credit/Debit card numbers
const isValidLuhn = (cardNumber) => {
  const digits = String(cardNumber || '').replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const detectCardNetwork = (cardNumber) => {
  const digits = String(cardNumber || '').replace(/\D/g, '');
  if (!digits) return null;
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(digits)) return 'Mastercard';
  if (/^(60|6521|6522|81|82|508)/.test(digits)) return 'RuPay';
  if (/^3[47]/.test(digits)) return 'American Express';
  return 'Card';
};

const formatCardDisplay = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatExpiryInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
};

const DEFAULT_METHODS_CATALOG = {
  merchantUpiId: 'quickbasket.pay@icici',
  upiApps: [
    { id: 'gpay', name: 'Google Pay', short: 'GPay', handle: '@okicici', color: 'blue' },
    { id: 'phonepe', name: 'PhonePe', short: 'PhonePe', handle: '@ybl', color: 'purple' },
    { id: 'paytm', name: 'Paytm UPI', short: 'Paytm', handle: '@paytm', color: 'sky' },
    { id: 'bhim', name: 'BHIM UPI', short: 'BHIM', handle: '@upi', color: 'orange' }
  ],
  banks: [
    { code: 'HDFC', name: 'HDFC Bank', popular: true },
    { code: 'ICIC', name: 'ICICI Bank', popular: true },
    { code: 'SBIN', name: 'State Bank of India', popular: true },
    { code: 'UTIB', name: 'Axis Bank', popular: true },
    { code: 'KKBK', name: 'Kotak Mahindra Bank', popular: true },
    { code: 'YESB', name: 'Yes Bank', popular: true },
    { code: 'PUNB', name: 'Punjab National Bank', popular: false },
    { code: 'BARB', name: 'Bank of Baroda', popular: false },
    { code: 'INDB', name: 'IndusInd Bank', popular: false },
    { code: 'CNRB', name: 'Canara Bank', popular: false }
  ],
  wallets: [
    { id: 'paytm_wallet', name: 'Paytm Wallet', promo: 'Flat ₹25 cashback on ₹499+' },
    { id: 'amazon_pay', name: 'Amazon Pay', promo: 'Zero convenience fee' },
    { id: 'phonepe_wallet', name: 'PhonePe Wallet', promo: 'Instant 1-tap pay' },
    { id: 'mobikwik', name: 'MobiKwik ZIP', promo: 'Up to ₹50 SuperCash' },
    { id: 'freecharge', name: 'Freecharge', promo: 'Fast wallet pay' }
  ]
};

const CheckoutPage = () => {
  const {
    cartItems,
    subtotal,
    deliveryFee,
    platformFee,
    tipAmount,
    coupon,
    couponDiscount,
    finalTotal,
    clearCart
  } = useCart();

  const { user, addAddress } = useAuth();
  const { selectedLocation, detectCurrentLocation, resolveCoordinates, isDetecting } = useLocation();
  const navigate = useNavigate();

  // Selected address
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [showAddressMap, setShowAddressMap] = useState(false);
  const [geoAddressFeedback, setGeoAddressFeedback] = useState('');
  const [newAddress, setNewAddress] = useState({
    street: '',
    landmark: '',
    city: selectedLocation.city || 'Bangalore',
    state: selectedLocation.state || 'Karnataka',
    pincode: selectedLocation.pincode || '560034',
    lat: selectedLocation.lat || 12.9352,
    lng: selectedLocation.lng || 77.6245,
    type: 'Home'
  });

  // Delivery Time Slot
  const [deliverySlot, setDeliverySlot] = useState('Instant Delivery (10-15 mins)');

  // Payment catalog & live config from backend
  const [methodsCatalog, setMethodsCatalog] = useState(DEFAULT_METHODS_CATALOG);
  const [razorpayConfig, setRazorpayConfig] = useState({ keyId: '', isLiveConfigured: false });

  // Active Payment Method: 'UPI' | 'CARD' | 'NETBANKING' | 'WALLET' | 'RAZORPAY' | 'COD'
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  // Method 1: UPI state
  const [upiMode, setUpiMode] = useState('app'); // 'app' | 'qr'
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [upiVpa, setUpiVpa] = useState('');
  const [vpaStatus, setVpaStatus] = useState({ verified: false, loading: false, message: '', verifiedName: '' });
  const [copiedMerchantVpa, setCopiedMerchantVpa] = useState(false);

  // Method 2: Card state (CVV validated locally only, never persisted)
  const [cardForm, setCardForm] = useState({
    holderName: user?.fullName || user?.name || '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardType: 'Credit/Debit'
  });

  // Method 3: Net Banking state
  const [selectedBank, setSelectedBank] = useState(DEFAULT_METHODS_CATALOG.banks[0]);

  // Method 4: Digital Wallet state
  const [selectedWallet, setSelectedWallet] = useState(DEFAULT_METHODS_CATALOG.wallets[0]);

  // Gateway modal & order submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [gatewayModalOpen, setGatewayModalOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [activeGatewayData, setActiveGatewayData] = useState(null);

  useEffect(() => {
    const loadPaymentMetadata = async () => {
      try {
        const [methodsRes, keyRes] = await Promise.all([
          api.get('/payment/methods'),
          api.get('/payment/razorpay-key')
        ]);
        if (methodsRes.data) {
          setMethodsCatalog(methodsRes.data);
          if (methodsRes.data.banks?.length) setSelectedBank(methodsRes.data.banks[0]);
          if (methodsRes.data.wallets?.length) setSelectedWallet(methodsRes.data.wallets[0]);
        }
        if (keyRes.data) {
          setRazorpayConfig(keyRes.data);
        }
      } catch (err) {
        console.warn('Using default payment catalog fallback', err);
      }
    };
    loadPaymentMetadata();
  }, []);

  useEffect(() => {
    if (user && !cardForm.holderName) {
      setCardForm((prev) => ({ ...prev, holderName: user.fullName || user.name || '' }));
    }
  }, [user]);

  const currentAddresses = user?.addresses && user.addresses.length > 0 ? user.addresses : [
    {
      _id: 'default_addr',
      fullName: user?.fullName || 'QuickBasket Shopper',
      phone: user?.phone || '+919876543210',
      street: '402, Green Palm Residency, 100ft Road',
      landmark: 'Near Sony World Signal, Koramangala',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560034',
      type: 'Home'
    }
  ];

  const activeShippingAddress = currentAddresses[selectedAddressIndex] || currentAddresses[0];

  const handleAddNewAddressSubmit = async (e) => {
    e.preventDefault();
    if (!newAddress.street || !newAddress.pincode) return;
    await addAddress(newAddress);
    setShowNewAddressForm(false);
    setShowAddressMap(false);
    setGeoAddressFeedback('');
    setSelectedAddressIndex(currentAddresses.length);
  };

  const handleCheckoutAutoFillGps = async () => {
    setGeoAddressFeedback('');
    const res = await detectCurrentLocation({ closeOnSuccess: false });
    if (res.success && res.location) {
      const loc = res.location;
      setNewAddress((prev) => ({
        ...prev,
        street: loc.street || loc.area || prev.street,
        landmark: loc.landmark || prev.landmark,
        city: loc.city || prev.city,
        state: loc.state || prev.state,
        pincode: loc.pincode || prev.pincode,
        lat: loc.lat,
        lng: loc.lng
      }));
      setShowAddressMap(true);
      setGeoAddressFeedback(`GPS Pin detected: ${loc.area}, ${loc.city} (${loc.pincode})`);
    } else if (res.message) {
      setGeoAddressFeedback(res.message);
    }
  };

  const handleCheckoutMapPin = async (lat, lng) => {
    setNewAddress((prev) => ({ ...prev, lat, lng }));
    const resolved = await resolveCoordinates(lat, lng);
    setNewAddress((prev) => ({
      ...prev,
      street: resolved.street || resolved.area || prev.street,
      landmark: resolved.landmark || prev.landmark,
      city: resolved.city || prev.city,
      state: resolved.state || prev.state,
      pincode: resolved.pincode || prev.pincode,
      lat,
      lng
    }));
    setGeoAddressFeedback(`Pinned: ${resolved.area}, ${resolved.city}`);
  };

  const handleVerifyVpa = async () => {
    const trimmed = upiVpa.trim();
    if (!trimmed) {
      setVpaStatus({ verified: false, loading: false, message: 'Please enter your UPI ID first (e.g. mobile@ybl)', verifiedName: '' });
      return false;
    }
    setVpaStatus({ verified: false, loading: true, message: '', verifiedName: '' });
    try {
      const { data } = await api.post('/payment/verify-vpa', { vpa: trimmed });
      setVpaStatus({
        verified: true,
        loading: false,
        message: 'Verified',
        verifiedName: data.verifiedName || trimmed
      });
      return true;
    } catch (err) {
      setVpaStatus({
        verified: false,
        loading: false,
        message: err.response?.data?.message || 'Invalid UPI ID format',
        verifiedName: ''
      });
      return false;
    }
  };

  const validatePaymentDetailsBeforeOrder = async () => {
    if (paymentMethod === 'UPI' && upiMode === 'app' && upiVpa.trim()) {
      if (!vpaStatus.verified) {
        const ok = await handleVerifyVpa();
        if (!ok) {
          setOrderError('Please enter a valid UPI ID (or switch to Scan QR Code).');
          return false;
        }
      }
    }

    if (paymentMethod === 'CARD') {
      const cleanDigits = cardForm.cardNumber.replace(/\D/g, '');
      if (!isValidLuhn(cleanDigits)) {
        setOrderError('Please enter a valid 16-digit Debit or Credit card number (or select a Test Card below).');
        return false;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardForm.expiry.trim())) {
        setOrderError('Please enter card expiry in MM/YY format.');
        return false;
      }
      const [m, y] = cardForm.expiry.split('/').map(Number);
      const now = new Date();
      const fullYear = 2000 + y;
      if (fullYear < now.getFullYear() || (fullYear === now.getFullYear() && m < now.getMonth() + 1)) {
        setOrderError('Card appears to be expired. Please check MM/YY.');
        return false;
      }
      if (!/^\d{3,4}$/.test(cardForm.cvv.trim())) {
        setOrderError('Please enter a valid 3 or 4 digit CVV code.');
        return false;
      }
      if (!cardForm.holderName.trim()) {
        setOrderError('Please enter the cardholder name printed on your card.');
        return false;
      }
    }

    if (paymentMethod === 'NETBANKING' && !selectedBank?.code) {
      setOrderError('Please choose your bank for Net Banking.');
      return false;
    }

    if (paymentMethod === 'WALLET' && !selectedWallet?.name) {
      setOrderError('Please select a digital wallet.');
      return false;
    }

    return true;
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    setOrderError('');
    setIsSubmitting(true);

    try {
      const isValid = await validatePaymentDetailsBeforeOrder();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      // 1. Prepare initial order payload (keep real Product ObjectId via item.productId || item._id)
      const orderPayload = {
        items: cartItems.map((item) => ({
          product: item.productId || item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          originalPrice: item.originalPrice || item.price,
          quantity: item.quantity,
          unit: item.unit
        })),
        shippingAddress: {
          fullName: user?.fullName || user?.name || activeShippingAddress.fullName || 'QuickBasket Customer',
          phone: user?.phone || activeShippingAddress.phone || '+919876543210',
          street: activeShippingAddress.street,
          landmark: activeShippingAddress.landmark || '',
          city: activeShippingAddress.city,
          state: activeShippingAddress.state,
          pincode: activeShippingAddress.pincode,
          lat: activeShippingAddress.lat || selectedLocation.lat || 12.9352,
          lng: activeShippingAddress.lng || selectedLocation.lng || 77.6245,
          type: activeShippingAddress.type
        },
        deliveryTimeSlot: deliverySlot,
        paymentMethod,
        itemsPrice: subtotal,
        deliveryPrice: deliveryFee,
        platformFee: platformFee + (tipAmount || 0),
        discountAmount: couponDiscount,
        totalPrice: finalTotal,
        couponApplied: coupon ? { code: coupon.code, discount: coupon.discount } : null
      };

      // 2. Create the Order document in MongoDB (starts with paymentStatus: 'Pending')
      const { data: createdOrder } = await api.post('/orders', orderPayload);

      // 3. Cash on Delivery flow finishes immediately
      if (paymentMethod === 'COD') {
        clearCart();
        navigate(`/order-success/${createdOrder.orderNumber}`, { state: { order: createdOrder } });
        return;
      }

      // 4. Create Backend Payment Order (Real Razorpay SDK or Signed Test Gateway with NPCI UPI URI)
      const { data: rzpOrder } = await api.post('/payment/create-order', {
        orderId: createdOrder._id,
        amount: finalTotal,
        currency: 'INR',
        paymentMethod
      });

      // 5. If real Razorpay merchant credentials are configured AND live gateway order created, launch window.Razorpay
      if (paymentMethod === 'RAZORPAY' && rzpOrder.isLiveGatewayOrder) {
        const isSDKLoaded = await loadRazorpaySDK();
        if (!isSDKLoaded) {
          setOrderError('Could not load Razorpay checkout script. Please use UPI / Card / COD below.');
          setIsSubmitting(false);
          return;
        }

        const options = {
          key: rzpOrder.keyId || razorpayConfig.keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'QuickBasket',
          description: '10-Minute Grocery Delivery',
          image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150',
          order_id: rzpOrder.id,
          prefill: {
            name: user?.fullName || user?.name || 'QuickBasket Shopper',
            email: user?.email || 'shopper@quickbasket.com',
            contact: user?.phone || '+919876543210'
          },
          notes: {
            orderNumber: createdOrder.orderNumber,
            deliveryAddress: activeShippingAddress.street
          },
          theme: {
            color: '#0c831f'
          },
          handler: async function (response) {
            try {
              setIsSubmitting(true);
              const { data: verifyResult } = await api.post('/payment/verify-signature', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId: createdOrder._id,
                paymentMethod: 'RAZORPAY',
                methodLabel: 'Razorpay Checkout'
              });

              if (verifyResult.success) {
                clearCart();
                navigate(`/order-success/${createdOrder.orderNumber}`, {
                  state: { order: verifyResult.order || createdOrder }
                });
              } else {
                setOrderError(verifyResult.message || 'Payment signature verification failed.');
              }
            } catch (err) {
              console.error('Signature verification error', err);
              setOrderError('Payment verification failed on server. Please contact support.');
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: async function () {
              setIsSubmitting(false);
              try {
                await api.post('/payment/record-failure', {
                  orderId: createdOrder._id,
                  paymentMethod: 'RAZORPAY',
                  errorDetails: { code: 'USER_CANCELLED', description: 'Customer closed Razorpay modal' }
                });
              } catch (e) {
                console.warn('Could not record cancellation', e);
              }
              setOrderError('Payment was cancelled. Please select a payment method and try again.');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', async function (response) {
          setIsSubmitting(false);
          setOrderError(`Payment failed: ${response.error.description}`);
          try {
            await api.post('/payment/record-failure', {
              orderId: createdOrder._id,
              paymentMethod: 'RAZORPAY',
              errorDetails: response.error
            });
          } catch (e) {
            console.warn('Failed recording failure', e);
          }
        });
        rzp.open();
        return;
      }

      // 6. Open Interactive Signed Sandbox Payment Gateway Modal for UPI / Card 3DS / NetBanking / Wallet / Razorpay Express
      setActiveOrder(createdOrder);
      setActiveGatewayData(rzpOrder);
      setGatewayModalOpen(true);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to initialize checkout', err);
      setOrderError(err.response?.data?.message || 'Failed to initialize checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  const detectedNetwork = detectCardNetwork(cardForm.cardNumber);
  const cleanCardDigits = cardForm.cardNumber.replace(/\D/g, '');
  const cardLuhnOk = cleanCardDigits.length >= 13 && isValidLuhn(cleanCardDigits);
  const merchantUpi = methodsCatalog.merchantUpiId || 'quickbasket.pay@icici';
  const previewUpiUri = `upi://pay?pa=${encodeURIComponent(merchantUpi)}&pn=${encodeURIComponent('QuickBasket Groceries')}&am=${Number(finalTotal).toFixed(2)}&cu=INR&tn=${encodeURIComponent('QuickBasket Instant Delivery')}`;

  const ctaLabel = () => {
    if (paymentMethod === 'COD') return 'Place Cash on Delivery Order';
    if (paymentMethod === 'UPI') return `Pay ₹${finalTotal} via ${upiMode === 'qr' ? 'UPI QR' : selectedUpiApp}`;
    if (paymentMethod === 'CARD') return `Verify & Pay ₹${finalTotal} by Card`;
    if (paymentMethod === 'NETBANKING') return `Pay ₹${finalTotal} via ${selectedBank?.name || 'NetBanking'}`;
    if (paymentMethod === 'WALLET') return `Pay ₹${finalTotal} via ${selectedWallet?.name || 'Wallet'}`;
    return `Pay ₹${finalTotal} with Razorpay Express`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title */}
      <div className="pb-4 mb-6 border-b border-slate-100">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Checkout</h1>
        <p className="text-xs text-slate-500">Superfast delivery dispatched to your doorstep in 10-15 minutes</p>
      </div>

      {orderError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{orderError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Step 1: Delivery Address */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0c831f] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Delivery Address</h3>
                  <p className="text-[11px] text-slate-400">Where should we deliver your order?</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewAddressForm(!showNewAddressForm)}
                className="text-xs font-bold text-[#0c831f] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {currentAddresses.map((addr, idx) => {
                const isSelected = selectedAddressIndex === idx;
                return (
                  <div
                    key={addr._id || idx}
                    onClick={() => setSelectedAddressIndex(idx)}
                    className={`p-4 rounded-2xl border cursor-pointer transition relative ${
                      isSelected
                        ? 'border-[#0c831f] bg-emerald-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
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
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0c831f]" />}
                    </div>
                    <p className="text-xs font-bold text-slate-800 leading-snug line-clamp-2">{addr.street}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                );
              })}
            </div>

            {showNewAddressForm && (
              <form
                onSubmit={handleAddNewAddressSubmit}
                className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800">Add New Address</h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCheckoutAutoFillGps}
                      disabled={isDetecting}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 transition disabled:opacity-60"
                    >
                      <Navigation className={`w-3 h-3 ${isDetecting ? 'animate-spin' : ''}`} />
                      <span>{isDetecting ? 'Detecting GPS...' : 'Auto-fill via GPS'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressMap((prev) => !prev)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#0c831f] text-slate-700 text-[11px] font-bold flex items-center gap-1 transition"
                    >
                      <MapPin className="w-3 h-3 text-[#0c831f]" />
                      <span>{showAddressMap ? 'Hide Map' : 'Pin on Map'}</span>
                    </button>
                  </div>
                </div>

                {geoAddressFeedback && (
                  <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                    {geoAddressFeedback}
                  </p>
                )}

                {showAddressMap && (
                  <GeoMap
                    mode="picker"
                    lat={newAddress.lat || selectedLocation.lat || 12.9352}
                    lng={newAddress.lng || selectedLocation.lng || 77.6245}
                    height="175px"
                    onSelectCoords={handleCheckoutMapPin}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      required
                      placeholder="Flat / House / Apartment, Road, Area"
                      value={newAddress.street}
                      onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Landmark (Optional)"
                      value={newAddress.landmark}
                      onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Pincode (e.g. 560034)"
                      value={newAddress.pincode}
                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:border-[#0c831f]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {['Home', 'Work', 'Other'].map((type) => (
                    <button
                      type="button"
                      key={type}
                      onClick={() => setNewAddress({ ...newAddress, type })}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                        newAddress.type === type ? 'bg-[#0c831f] text-white border-[#0c831f]' : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                  <button
                    type="submit"
                    className="ml-auto px-4 py-1.5 bg-[#0c831f] text-white rounded-xl text-xs font-bold"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Step 2: Delivery Time Slot */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0c831f] flex items-center justify-center font-bold text-xs">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Delivery Speed & Time Slot</h3>
                <p className="text-[11px] text-slate-400">Choose when you want your items delivered</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {[
                { title: '⚡ Instant Delivery', desc: '10-15 mins guaranteed', slot: 'Instant Delivery (10-15 mins)', badge: 'FASTEST' },
                { title: 'Evening Slot', desc: 'Today 7:00 PM - 9:00 PM', slot: 'Today 7:00 PM - 9:00 PM' },
                { title: 'Tomorrow Morning', desc: '7:00 AM - 9:00 AM', slot: 'Tomorrow 7:00 AM - 9:00 AM' }
              ].map((s) => (
                <div
                  key={s.slot}
                  onClick={() => setDeliverySlot(s.slot)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition relative ${
                    deliverySlot === s.slot ? 'border-[#0c831f] bg-emerald-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s.badge && (
                    <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                      {s.badge}
                    </span>
                  )}
                  <h4 className="text-xs font-bold text-slate-800">{s.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Multi-Method Payment Selection */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0c831f] flex items-center justify-center font-bold text-xs">
                  3
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Select Payment Method</h3>
                  <p className="text-[11px] text-slate-400">
                    UPI (GPay / PhonePe / Paytm / QR), Cards, NetBanking, Wallets or COD
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#0c831f] border border-emerald-200">
                <Lock className="w-3 h-3" /> 256-Bit Encrypted
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {/* OPTION 1: UPI (Google Pay, PhonePe, Paytm, VPA & Live QR) */}
              <div
                onClick={() => {
                  setPaymentMethod('UPI');
                  setOrderError('');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'UPI' ? 'border-[#0c831f] bg-emerald-50/30 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#0c831f] flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">UPI • GPay, PhonePe, Paytm & QR</h4>
                        <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                          Instant & Zero Fee
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pay using any UPI app, verified UPI ID or scan dynamic QR code
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'UPI'}
                    onChange={() => setPaymentMethod('UPI')}
                    className="accent-[#0c831f] w-4 h-4"
                  />
                </div>

                {paymentMethod === 'UPI' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-emerald-200/70 space-y-4 animate-in fade-in duration-150"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(methodsCatalog.upiApps || []).map((app) => {
                        const active = selectedUpiApp === app.name && upiMode === 'app';
                        return (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              setUpiMode('app');
                              setSelectedUpiApp(app.name);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                              active
                                ? 'border-[#0c831f] bg-white shadow-xs ring-1 ring-[#0c831f]'
                                : 'border-slate-200 bg-white/80 hover:border-emerald-300'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">{app.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{app.handle}</span>
                            </div>
                            {active && <CheckCircle2 className="w-4 h-4 text-[#0c831f] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 border-b border-slate-200/80 pb-2">
                      <button
                        type="button"
                        onClick={() => setUpiMode('app')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          upiMode === 'app' ? 'bg-[#0c831f] text-white' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Enter UPI ID / Collect</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpiMode('qr')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                          upiMode === 'qr' ? 'bg-[#0c831f] text-white' : 'bg-white text-slate-600 border border-slate-200'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Scan & Pay UPI QR</span>
                      </button>
                    </div>

                    {upiMode === 'app' ? (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-700">
                          UPI ID / VPA (Optional if paying via QR on next step)
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="e.g. yourname@okicici or 9876543210@ybl"
                            value={upiVpa}
                            onChange={(e) => {
                              setUpiVpa(e.target.value);
                              setVpaStatus({ verified: false, loading: false, message: '', verifiedName: '' });
                            }}
                            className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono outline-none focus:border-[#0c831f]"
                          />
                          <button
                            type="button"
                            onClick={handleVerifyVpa}
                            disabled={vpaStatus.loading}
                            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0 transition"
                          >
                            {vpaStatus.loading ? 'Verifying...' : 'Verify VPA'}
                          </button>
                        </div>

                        {vpaStatus.verified && (
                          <p className="text-[11px] font-bold text-[#0c831f] flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verified VPA Holder: {vpaStatus.verifiedName}</span>
                          </p>
                        )}
                        {!vpaStatus.verified && vpaStatus.message && (
                          <p className="text-[11px] font-semibold text-rose-600">{vpaStatus.message}</p>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white p-4 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center gap-4">
                        <div className="p-2 bg-white border border-slate-200 rounded-xl shrink-0">
                          <QRCodeSVG value={previewUpiUri} size={116} level="M" />
                        </div>
                        <div className="space-y-1.5 text-center sm:text-left">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Dynamic NPCI QR • ₹{finalTotal}
                          </span>
                          <p className="text-xs font-bold text-slate-900">
                            Scan using GPay, PhonePe, Paytm or BHIM
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Click <strong>Pay ₹{finalTotal}</strong> on the right to generate your order-locked confirmation QR.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(merchantUpi);
                              setCopiedMerchantVpa(true);
                              setTimeout(() => setCopiedMerchantVpa(false), 2000);
                            }}
                            className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                          >
                            <span>{merchantUpi}</span>
                            {copiedMerchantVpa ? <Check className="w-3 h-3 text-[#0c831f]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* OPTION 2: CREDIT / DEBIT CARD */}
              <div
                onClick={() => {
                  setPaymentMethod('CARD');
                  setOrderError('');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'CARD' ? 'border-[#0c831f] bg-emerald-50/30 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Credit / Debit Cards</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Visa, Mastercard, RuPay & Amex with 3D Secure Bank OTP
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'CARD'}
                    onChange={() => setPaymentMethod('CARD')}
                    className="accent-[#0c831f] w-4 h-4"
                  />
                </div>

                {paymentMethod === 'CARD' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-emerald-200/70 space-y-3 animate-in fade-in duration-150"
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 mr-1">Test Cards:</span>
                      {[
                        { label: 'Test Visa', num: '4242 4242 4242 4242', type: 'Credit Card' },
                        { label: 'Test Mastercard', num: '5555 5555 5555 4444', type: 'Debit Card' },
                        { label: 'Test RuPay', num: '6070 9800 0000 0005', type: 'Debit Card' }
                      ].map((tc) => (
                        <button
                          key={tc.label}
                          type="button"
                          onClick={() =>
                            setCardForm({
                              holderName: user?.fullName || user?.name || 'QuickBasket Shopper',
                              cardNumber: tc.num,
                              expiry: '12/29',
                              cvv: '123',
                              cardType: tc.type
                            })
                          }
                          className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[#0c831f] hover:bg-emerald-50 transition"
                        >
                          <Sparkles className="w-2.5 h-2.5 inline mr-1" />
                          {tc.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="sm:col-span-2">
                        <label className="block font-bold text-slate-700 mb-1">Cardholder Name</label>
                        <input
                          type="text"
                          placeholder="Name as on card"
                          value={cardForm.holderName}
                          onChange={(e) => setCardForm({ ...cardForm, holderName: e.target.value })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-slate-700">Card Number</label>
                          {detectedNetwork && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                              cardLuhnOk ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {detectedNetwork} {cardLuhnOk ? '✓ Valid' : ''}
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="4242 4242 4242 4242"
                          value={cardForm.cardNumber}
                          onChange={(e) => setCardForm({ ...cardForm, cardNumber: formatCardDisplay(e.target.value) })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none focus:border-[#0c831f]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Valid Thru (MM/YY)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="12/29"
                          value={cardForm.expiry}
                          onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiryInput(e.target.value) })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none focus:border-[#0c831f]"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="•••"
                          value={cardForm.cvv}
                          onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none focus:border-[#0c831f]"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#0c831f]" />
                      Card details are tokenized per RBI norms. CVV is never stored on disk.
                    </p>
                  </div>
                )}
              </div>

              {/* OPTION 3: NET BANKING */}
              <div
                onClick={() => {
                  setPaymentMethod('NETBANKING');
                  setOrderError('');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'NETBANKING' ? 'border-[#0c831f] bg-emerald-50/30 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Net Banking</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        All major Indian banks supported (HDFC, ICICI, SBI, Axis, Kotak & more)
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'NETBANKING'}
                    onChange={() => setPaymentMethod('NETBANKING')}
                    className="accent-[#0c831f] w-4 h-4"
                  />
                </div>

                {paymentMethod === 'NETBANKING' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-emerald-200/70 space-y-3 animate-in fade-in duration-150"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(methodsCatalog.banks || []).filter((b) => b.popular).map((bank) => {
                        const isSel = selectedBank?.code === bank.code;
                        return (
                          <button
                            key={bank.code}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold flex items-center justify-between transition ${
                              isSel ? 'border-[#0c831f] bg-white text-[#0c831f] ring-1 ring-[#0c831f]' : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300'
                            }`}
                          >
                            <span className="truncate">{bank.name}</span>
                            {isSel && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Or Choose From All Banks</label>
                      <select
                        value={selectedBank?.code || ''}
                        onChange={(e) => {
                          const found = (methodsCatalog.banks || []).find((b) => b.code === e.target.value);
                          if (found) setSelectedBank(found);
                        }}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:border-[#0c831f]"
                      >
                        {(methodsCatalog.banks || []).map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.name} ({b.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* OPTION 4: DIGITAL WALLETS */}
              <div
                onClick={() => {
                  setPaymentMethod('WALLET');
                  setOrderError('');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'WALLET' ? 'border-[#0c831f] bg-emerald-50/30 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Mobile Wallets</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Paytm Wallet, Amazon Pay, PhonePe Wallet, MobiKwik & Freecharge
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'WALLET'}
                    onChange={() => setPaymentMethod('WALLET')}
                    className="accent-[#0c831f] w-4 h-4"
                  />
                </div>

                {paymentMethod === 'WALLET' && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="mt-4 pt-4 border-t border-emerald-200/70 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-150"
                  >
                    {(methodsCatalog.wallets || []).map((w) => {
                      const isSel = selectedWallet?.id === w.id;
                      return (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => setSelectedWallet(w)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                            isSel ? 'border-[#0c831f] bg-white ring-1 ring-[#0c831f]' : 'border-slate-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{w.name}</span>
                            <span className="text-[10px] text-[#0c831f] font-semibold">{w.promo}</span>
                          </div>
                          {isSel && <CheckCircle2 className="w-4 h-4 text-[#0c831f] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* OPTION 5: RAZORPAY ALL-IN-ONE EXPRESS GATEWAY */}
              <div
                onClick={() => {
                  setPaymentMethod('RAZORPAY');
                  setOrderError('');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'RAZORPAY' ? 'border-[#0c831f] bg-emerald-50/30 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">Razorpay All-in-One Express</h4>
                        <span className="text-[9px] font-black bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full uppercase">
                          {razorpayConfig.isLiveConfigured ? 'Live SDK' : 'Express Modal'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        One-window Razorpay checkout supporting UPI, Cards, NetBanking & Wallets
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'RAZORPAY'}
                    onChange={() => setPaymentMethod('RAZORPAY')}
                    className="accent-[#0c831f] w-4 h-4"
                  />
                </div>
              </div>

              {/* OPTION 6: CASH ON DELIVERY */}
              <div
                onClick={() => {
                  setPaymentMethod('COD');
                  setOrderError('');
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition ${
                  paymentMethod === 'COD' ? 'border-[#0c831f] bg-emerald-50/30 ring-2 ring-emerald-500/20' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Cash on Delivery (COD)</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pay cash or scan rider&apos;s UPI QR code upon doorstep arrival
                      </p>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="accent-[#0c831f] w-4 h-4"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & CTA */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
              Basket Summary ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </h3>

            <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-50">
              {cartItems.map((item) => (
                <div key={item.cartKey || `${item._id}__${item.unit}`} className="pt-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate mr-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200';
                      }}
                      className="w-8 h-8 rounded-lg object-contain bg-slate-50 shrink-0"
                    />
                    <div className="truncate">
                      <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.unit} • {item.quantity} x ₹{item.price}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900 shrink-0">₹{item.quantity * item.price}</span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <strong className="text-[#0c831f]">FREE</strong> : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Fee</span>
                <span>₹{platformFee}</span>
              </div>
              {tipAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Partner Tip</span>
                  <span>₹{tipAmount}</span>
                </div>
              )}
              {coupon && (
                <div className="flex justify-between text-[#0c831f] font-bold">
                  <span>Coupon Discount ({coupon.code})</span>
                  <span>-₹{couponDiscount}</span>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100 flex justify-between text-base font-black text-slate-900">
                <span>Total Amount</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-4 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-700/25 active:scale-98 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing Secure Checkout...</span>
                </>
              ) : (
                <>
                  <span>{ctaLabel()}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-[#0c831f]" />
              <span>Verified PCI-DSS Level 1 • HMAC Protected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Signed Sandbox Payment Authorization Modal */}
      <PaymentGatewayModal
        isOpen={gatewayModalOpen}
        onClose={async () => {
          setGatewayModalOpen(false);
          if (activeOrder) {
            try {
              await api.post('/payment/record-failure', {
                orderId: activeOrder._id,
                paymentMethod,
                errorDetails: { code: 'USER_CANCELLED', description: 'Customer cancelled payment modal' }
              });
            } catch (e) {
              console.warn('Could not record cancel event', e);
            }
          }
          setOrderError('Payment was not completed. Please complete payment or choose Cash on Delivery.');
        }}
        onSuccess={(result) => {
          setGatewayModalOpen(false);
          clearCart();
          navigate(`/order-success/${activeOrder.orderNumber}`, {
            state: { order: result.order || activeOrder }
          });
        }}
        onFailure={(msg) => {
          setGatewayModalOpen(false);
          setOrderError(msg);
        }}
        order={activeOrder}
        gatewayData={activeGatewayData}
        initialMode={paymentMethod}
        initialPayload={{
          upiApp: selectedUpiApp,
          upiVpa: upiMode === 'qr' ? '' : upiVpa,
          cardDetails: {
            cardNumber: cardForm.cardNumber,
            expiry: cardForm.expiry,
            holderName: cardForm.holderName,
            cardType: cardForm.cardType
          },
          bank: selectedBank,
          wallet: selectedWallet
        }}
        methodsCatalog={methodsCatalog}
        user={user}
      />
    </div>
  );
};

export default CheckoutPage;
