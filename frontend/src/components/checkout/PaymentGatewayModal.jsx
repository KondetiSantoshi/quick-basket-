import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../services/api';
import {
  X,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building,
  Wallet,
  Lock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

const PaymentGatewayModal = ({
  isOpen,
  onClose,
  onSuccess,
  onFailure,
  order,
  gatewayData,
  initialMode = 'UPI',
  initialPayload = {},
  methodsCatalog = {},
  user
}) => {
  const [activeMode, setActiveMode] = useState(
    initialMode === 'RAZORPAY' ? 'UPI' : initialMode
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(300);

  // Express modal fallback states when launched from RAZORPAY All-in-One
  const [upiApp, setUpiApp] = useState(initialPayload.upiApp || 'Google Pay');
  const [upiVpa, setUpiVpa] = useState(initialPayload.upiVpa || '');
  const [cardOtp, setCardOtp] = useState('');
  const [expressCard, setExpressCard] = useState({
    cardNumber: initialPayload.cardDetails?.cardNumber || '',
    expiry: initialPayload.cardDetails?.expiry || '',
    holderName: initialPayload.cardDetails?.holderName || user?.fullName || user?.name || '',
    cardType: initialPayload.cardDetails?.cardType || 'Credit/Debit'
  });
  const [selectedBank, setSelectedBank] = useState(
    initialPayload.bank || methodsCatalog?.banks?.[0] || { code: 'HDFC', name: 'HDFC Bank' }
  );
  const [bankUserId, setBankUserId] = useState('QB_USER_8492');
  const [bankPin, setBankPin] = useState('••••••••');
  const [selectedWallet, setSelectedWallet] = useState(
    initialPayload.wallet || methodsCatalog?.wallets?.[0] || { id: 'paytm_wallet', name: 'Paytm Wallet' }
  );

  // Reset modal internal state on open
  useEffect(() => {
    if (isOpen) {
      setActiveMode(initialMode === 'RAZORPAY' ? 'UPI' : initialMode);
      setErrorMsg('');
      setCardOtp('');
      setQrTimeLeft(300);
      if (initialPayload.upiApp) setUpiApp(initialPayload.upiApp);
      if (initialPayload.upiVpa !== undefined) setUpiVpa(initialPayload.upiVpa);
      if (initialPayload.bank) setSelectedBank(initialPayload.bank);
      if (initialPayload.wallet) setSelectedWallet(initialPayload.wallet);
      if (initialPayload.cardDetails) {
        setExpressCard({
          cardNumber: initialPayload.cardDetails.cardNumber || '',
          expiry: initialPayload.cardDetails.expiry || '',
          holderName: initialPayload.cardDetails.holderName || user?.fullName || '',
          cardType: initialPayload.cardDetails.cardType || 'Credit/Debit'
        });
      }
    }
  }, [isOpen, initialMode, initialPayload, user]);

  // Countdown timer for UPI QR session
  useEffect(() => {
    if (!isOpen || activeMode !== 'UPI') return;
    const timer = setInterval(() => {
      setQrTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, activeMode]);

  if (!isOpen || !order || !gatewayData) return null;

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(gatewayData.merchantUpiId || 'quickbasket.pay@icici');
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2000);
  };

  const maskedPan = (num) => {
    const digits = String(num || '').replace(/\D/g, '');
    if (digits.length < 4) return '•••• •••• •••• ••••';
    return `•••• •••• •••• ${digits.slice(-4)}`;
  };

  const detectCardNetwork = (num) => {
    const digits = String(num || '').replace(/\D/g, '');
    if (/^4/.test(digits)) return 'Visa';
    if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(digits)) return 'Mastercard';
    if (/^(60|6521|6522|81|82|508)/.test(digits)) return 'RuPay';
    if (/^3[47]/.test(digits)) return 'American Express';
    return 'Card';
  };

  const handleAuthorizePayment = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setIsProcessing(true);

    try {
      const payload = {
        orderId: order._id,
        razorpay_order_id: gatewayData.id,
        paymentMethod: activeMode
      };

      if (activeMode === 'UPI') {
        payload.upiDetails = {
          vpa: upiVpa?.trim() || undefined,
          app: upiApp || 'UPI QR'
        };
        payload.methodLabel = upiVpa?.trim()
          ? `${upiApp} (${upiVpa.trim()})`
          : `${upiApp} QR`;
      } else if (activeMode === 'CARD') {
        if (!expressCard.cardNumber || !expressCard.expiry) {
          setErrorMsg('Please provide valid card number and expiry date (MM/YY).');
          setIsProcessing(false);
          return;
        }
        if (String(cardOtp).trim().length < 4) {
          setErrorMsg('Please enter the 6-digit 3D Secure Bank OTP (Use 123456).');
          setIsProcessing(false);
          return;
        }
        // Only send cardNumber, expiry, holderName, cardType — never transmit CVV in payment request
        payload.cardDetails = {
          cardNumber: expressCard.cardNumber,
          expiry: expressCard.expiry,
          holderName: expressCard.holderName || user?.fullName || 'QuickBasket Customer',
          cardType: expressCard.cardType || 'Credit/Debit'
        };
        payload.otp = cardOtp.trim();
        const digits = expressCard.cardNumber.replace(/\D/g, '');
        payload.methodLabel = `${detectCardNetwork(digits)} •••• ${digits.slice(-4)}`;
      } else if (activeMode === 'NETBANKING') {
        payload.netbankingDetails = {
          bankName: selectedBank.name,
          bankCode: selectedBank.code
        };
        payload.methodLabel = `${selectedBank.name} Net Banking`;
      } else if (activeMode === 'WALLET') {
        payload.walletDetails = {
          walletName: selectedWallet.name,
          phone: user?.phone || '+919876543210'
        };
        payload.methodLabel = selectedWallet.name;
      }

      const { data } = await api.post('/payment/authorize-sandbox', payload);
      if (data.success) {
        onSuccess(data);
      } else {
        setErrorMsg(data.message || 'Authorization failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Transaction declined by bank gateway. Please verify details.';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateDecline = async () => {
    setIsProcessing(true);
    try {
      await api.post('/payment/record-failure', {
        orderId: order._id,
        paymentMethod: activeMode,
        errorDetails: {
          code: 'BANK_AUTH_DECLINED',
          description: `Simulated decline during ${activeMode} authorization`
        }
      });
    } catch (err) {
      console.warn('Could not record decline', err);
    } finally {
      setIsProcessing(false);
      onFailure('Transaction was declined or cancelled at the bank gateway. No amount was debited.');
    }
  };

  const allowTabSwitch = initialMode === 'RAZORPAY';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 my-4">
        
        {/* Top Gateway Bar */}
        <div className="bg-gradient-to-r from-[#0c831f] via-emerald-700 to-teal-800 text-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight">QuickBasket Secure Checkout</h3>
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    Sandbox Mode
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100 mt-0.5">
                  Order #{order.orderNumber} • 256-bit HMAC Verified
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
              title="Cancel payment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-baseline justify-between">
            <span className="text-xs text-emerald-100 font-medium">Payable Amount</span>
            <span className="text-2xl font-black tracking-tight">₹{gatewayData.displayAmount || order.totalPrice}</span>
          </div>
        </div>

        {/* All-in-One Mode Switcher (shown when opened via Razorpay Express) */}
        {allowTabSwitch && (
          <div className="grid grid-cols-4 border-b border-slate-100 bg-slate-50 p-1.5 gap-1">
            {[
              { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
              { id: 'CARD', label: 'Card', icon: CreditCard },
              { id: 'NETBANKING', label: 'NetBanking', icon: Building },
              { id: 'WALLET', label: 'Wallets', icon: Wallet }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveMode(tab.id);
                    setErrorMsg('');
                  }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition ${
                    isSelected
                      ? 'bg-white text-[#0c831f] shadow-sm border border-emerald-200'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* MODE 1: UPI QR / VPA AUTHORIZATION */}
          {activeMode === 'UPI' && (
            <div className="space-y-4">
              {allowTabSwitch && (
                <div className="grid grid-cols-4 gap-2">
                  {(methodsCatalog?.upiApps || [
                    { id: 'gpay', name: 'Google Pay' },
                    { id: 'phonepe', name: 'PhonePe' },
                    { id: 'paytm', name: 'Paytm UPI' },
                    { id: 'bhim', name: 'BHIM UPI' }
                  ]).map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setUpiApp(app.name)}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition ${
                        upiApp === app.name
                          ? 'border-[#0c831f] bg-emerald-50 text-[#0c831f]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {app.short || app.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs shrink-0">
                  <QRCodeSVG
                    value={gatewayData.upiUri}
                    size={136}
                    level="M"
                    includeMargin={false}
                  />
                </div>
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    <Clock className="w-3 h-3" />
                    <span>QR Expires in {formatTimer(qrTimeLeft)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Scan with {upiApp} or any UPI App
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Compatible with Google Pay, PhonePe, Paytm, BHIM & Amazon Pay UPI.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyVpa}
                      className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 flex items-center gap-1.5"
                    >
                      <span>{gatewayData.merchantUpiId || 'quickbasket.pay@icici'}</span>
                      {copiedVpa ? (
                        <Check className="w-3 h-3 text-[#0c831f]" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400" />
                      )}
                    </button>
                    <a
                      href={gatewayData.upiUri}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100/80 text-emerald-900 hover:bg-emerald-200/70 inline-flex items-center gap-1"
                    >
                      <span>Open App</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {upiVpa && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                  <span className="text-emerald-900 font-medium">
                    Collect Request Sent To: <strong className="font-mono">{upiVpa}</strong>
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-[#0c831f]" />
                </div>
              )}

              <button
                type="button"
                onClick={handleAuthorizePayment}
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying NPCI Signature...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Complete ₹{gatewayData.displayAmount || order.totalPrice} UPI Payment</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* MODE 2: CARD 3D SECURE OTP */}
          {activeMode === 'CARD' && (
            <form onSubmit={handleAuthorizePayment} className="space-y-4">
              {allowTabSwitch && !initialPayload.cardDetails?.cardNumber && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Enter Card for Express Checkout</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpressCard({
                          cardNumber: '4242 4242 4242 4242',
                          expiry: '12/29',
                          holderName: user?.fullName || 'QuickBasket Shopper',
                          cardType: 'Visa'
                        })
                      }
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                    >
                      Fill Test Visa
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Card Number (e.g. 4242 4242 4242 4242)"
                    value={expressCard.cardNumber}
                    onChange={(e) => setExpressCard({ ...expressCard, cardNumber: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none focus:border-[#0c831f]"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={expressCard.expiry}
                      onChange={(e) => setExpressCard({ ...expressCard, expiry: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono outline-none focus:border-[#0c831f]"
                    />
                    <input
                      type="text"
                      placeholder="Cardholder Name"
                      value={expressCard.holderName}
                      onChange={(e) => setExpressCard({ ...expressCard, holderName: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
                    />
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-950 text-white space-y-2 shadow-md">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    3D Secure Verified by {detectCardNetwork(expressCard.cardNumber)}
                  </span>
                  <span className="font-mono font-bold text-white">
                    {maskedPan(expressCard.cardNumber)}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Cardholder: <strong className="text-white">{expressCard.holderName || 'Customer'}</strong> • Exp:{' '}
                  <strong className="font-mono text-white">{expressCard.expiry || 'MM/YY'}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Enter 6-Digit Bank 3DS OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => setCardOtp('123456')}
                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[#0c831f] hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto-fill OTP: 123456
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Enter 6-digit OTP (123456)"
                  value={cardOtp}
                  onChange={(e) => setCardOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-center font-mono text-lg tracking-[0.4em] font-black text-slate-900 outline-none focus:border-[#0c831f]"
                />
                <p className="text-[11px] text-slate-400 text-center">
                  Test Bank Authentication OTP is <strong className="font-mono text-slate-600">123456</strong>. CVV is never stored.
                </p>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying 3DS & Tokenizing Card...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verify OTP & Pay ₹{gatewayData.displayAmount || order.totalPrice}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 3: NET BANKING AUTHENTICATION */}
          {activeMode === 'NETBANKING' && (
            <form onSubmit={handleAuthorizePayment} className="space-y-4">
              {allowTabSwitch && methodsCatalog?.banks && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Bank</label>
                  <select
                    value={selectedBank.code}
                    onChange={(e) => {
                      const found = methodsCatalog.banks.find((b) => b.code === e.target.value);
                      if (found) setSelectedBank(found);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#0c831f]"
                  >
                    {methodsCatalog.banks.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shrink-0">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950">{selectedBank.name} NetBanking</h4>
                  <p className="text-[11px] text-indigo-700">Retail & Corporate Internet Banking Portal</p>
                </div>
              </div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer ID / User ID</label>
                  <input
                    type="text"
                    required
                    value={bankUserId}
                    onChange={(e) => setBankUserId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-[#0c831f]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">IPIN / Password (Test Pre-filled)</label>
                  <input
                    type="password"
                    required
                    value={bankPin}
                    onChange={(e) => setBankPin(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none focus:border-[#0c831f]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Debiting {selectedBank.name}...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authenticate & Pay ₹{gatewayData.displayAmount || order.totalPrice}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* MODE 4: DIGITAL WALLETS */}
          {activeMode === 'WALLET' && (
            <form onSubmit={handleAuthorizePayment} className="space-y-4">
              {allowTabSwitch && methodsCatalog?.wallets && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Choose Wallet</label>
                  <div className="grid grid-cols-2 gap-2">
                    {methodsCatalog.wallets.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => setSelectedWallet(w)}
                        className={`p-2.5 rounded-xl text-left text-xs border transition ${
                          selectedWallet.id === w.id
                            ? 'border-[#0c831f] bg-emerald-50 text-[#0c831f] font-bold'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-sky-950">{selectedWallet.name}</h4>
                    <p className="text-[11px] text-sky-700">
                      Linked Mobile: {user?.phone || '+919876543210'}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-white text-emerald-700 border border-emerald-200">
                  1-Tap Pay
                </span>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing Wallet Debit...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Authorize ₹{gatewayData.displayAmount || order.totalPrice} from {selectedWallet.name}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSimulateDecline}
              disabled={isProcessing}
              className="text-slate-400 hover:text-rose-600 font-semibold transition"
            >
              Simulate Bank Failure / Cancel
            </button>
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0c831f]" />
              PCI-DSS Level 1
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentGatewayModal;
