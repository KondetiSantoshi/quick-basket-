'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Lock, Mail, User, Phone, CheckCircle2, ShieldCheck, Bike, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AuthModal = () => {
  const {
    authModalOpen,
    setAuthModalOpen,
    authMode,
    setAuthMode,
    login,
    register,
    sendOTP,
    verifyOTP,
    demoLogin,
    loading
  } = useAuth();

  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [otpValue, setOtpValue] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [modalVerificationId, setModalVerificationId] = useState('');
  const [modalDevOtp, setModalDevOtp] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!authModalOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (authMode === 'login') {
      const res = await login(formData.email, formData.password);
      if (res.requiresVerification) {
        setAuthModalOpen(false);
        router.push(`/verify-otp?vid=${encodeURIComponent(res.verificationId || '')}&id=${encodeURIComponent(res.identifier || '')}&otp=${encodeURIComponent(res.devOtp || '')}`);
      } else if (!res.success) {
        setErrorMessage(res.message);
      }
    } else if (authMode === 'register') {
      const res = await register({
        fullName: formData.name,
        email: formData.email,
        phone: formData.phone || '+919876543210',
        password: formData.password,
        confirmPassword: formData.password,
        termsAccepted: true
      });
      if (res.success) {
        setAuthModalOpen(false);
        router.push(`/verify-otp?vid=${encodeURIComponent(res.data?.verificationId || '')}&id=${encodeURIComponent(res.data?.identifier || '')}&otp=${encodeURIComponent(res.data?.devOtp || '')}`);
      } else {
        setErrorMessage(res.message);
      }
    } else if (authMode === 'otp') {
      if (!otpSent) {
        if (!formData.phone || formData.phone.length < 10) {
          setErrorMessage('Please enter a valid 10-digit mobile number');
          return;
        }
        const res = await sendOTP(formData.phone, 'login');
        if (res.success) {
          setOtpSent(true);
          setModalVerificationId(res.verificationId);
          if (res.devOtp) setModalDevOtp(res.devOtp);
          setSuccessMessage(`OTP sent! Use testing code: ${res.devOtp || '123456'}`);
        } else {
          setErrorMessage(res.message);
        }
      } else {
        const code = otpValue.trim();
        if (code.length < 6 && code !== '1234' && code !== '123456') {
          setErrorMessage('Please enter a 6-digit OTP code');
          return;
        }
        const effectiveOtp = code === '1234' ? '123456' : code;
        const res = await verifyOTP(
          { verificationId: modalVerificationId, identifier: formData.phone, otp: effectiveOtp },
          effectiveOtp,
          formData.phone
        );
        if (res.success) {
          setAuthModalOpen(false);
        } else {
          setErrorMessage(res.message);
        }
      }
    }
  };

  const handleQuickDemo = async (role) => {
    setErrorMessage('');
    const res = await demoLogin(role);
    if (!res.success) setErrorMessage(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-955/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-6 text-white relative">
          <button
            onClick={() => setAuthModalOpen(false)}
            className="absolute right-4 top-4 text-emerald-200 hover:text-white transition w-8 h-8 rounded-full bg-black/10 flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-6 h-6 text-emerald-300" />
            <span className="text-xl font-black tracking-tight">QuickBasket</span>
          </div>
          <p className="text-emerald-200 text-xs">
            {authMode === 'login' && 'Welcome back! Log in to access your orders & cart.'}
            {authMode === 'register' && 'Create your account to start 10-minute grocery delivery.'}
            {authMode === 'otp' && 'Fast phone login with instant verification.'}
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex p-1 bg-black/20 rounded-xl mt-4">
            <button
              onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); setOtpSent(false); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                authMode === 'login' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthMode('register'); setErrorMessage(''); setSuccessMessage(''); setOtpSent(false); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                authMode === 'register' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:text-white'
              }`}
            >
              Register
            </button>
            <button
              onClick={() => { setAuthMode('otp'); setErrorMessage(''); setSuccessMessage(''); setOtpSent(false); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                authMode === 'otp' ? 'bg-white text-emerald-950 shadow-sm' : 'text-emerald-100 hover:text-white'
              }`}
            >
              OTP Login
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Santoshi Kondeti"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#0c831f] focus:bg-white outline-none transition"
                  />
                </div>
              </div>
            )}

            {authMode !== 'otp' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="user@quickbasket.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#0c831f] focus:bg-white outline-none transition"
                  />
                </div>
              </div>
            )}

            {authMode === 'otp' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      disabled={otpSent}
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#0c831f] focus:bg-white outline-none transition disabled:bg-slate-100"
                    />
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">Enter OTP Code</label>
                      <button
                        type="button"
                        onClick={() => setOtpValue(modalDevOtp || '123456')}
                        className="text-[11px] font-bold text-[#0c831f] hover:underline flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto-Fill ({modalDevOtp || '123456'})</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value)}
                      className="w-full text-center tracking-widest font-mono text-lg py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#0c831f] focus:bg-white outline-none transition"
                    />
                  </div>
                )}
              </>
            )}

            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#0c831f] focus:bg-white outline-none transition"
                  />
                </div>
              </div>
            )}

            {authMode !== 'otp' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthModalOpen(false);
                        router.push('/forgot-password');
                      }}
                      className="text-[11px] text-[#0c831f] hover:underline font-semibold"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-[#0c831f] focus:bg-white outline-none transition"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0c831f] hover:bg-[#095e16] text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-700/20 active:scale-98 transition flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>
                    {authMode === 'login' 
                      ? 'Sign In' 
                      : authMode === 'register' 
                      ? 'Create Account' 
                      : !otpSent 
                      ? 'Send Verification OTP' 
                      : 'Verify & Continue'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              ⚡ Instant 1-Click Test Logins
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('customer')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-center transition group"
              >
                <ShoppingBag className="w-4 h-4 text-slate-600 group-hover:text-[#0c831f] mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-700 block">Customer</span>
                <span className="text-[9px] text-slate-400">user@...</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-center transition group"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-700 block">Admin</span>
                <span className="text-[9px] text-slate-400">admin@...</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('delivery')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-center transition group"
              >
                <Bike className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                <span className="text-[11px] font-bold text-slate-700 block">Rider</span>
                <span className="text-[9px] text-slate-400">delivery@...</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthModal;
