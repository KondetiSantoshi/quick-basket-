import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Bike,
  CheckCircle2
} from 'lucide-react';

const LoginPage = () => {
  const { login, demoLogin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'phone'
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [unverifiedNotice, setUnverifiedNotice] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setUnverifiedNotice(null);

    if (!identifier.trim() || !password) {
      setErrorMessage('Please fill in both fields');
      return;
    }

    const res = await login(identifier.trim(), password, rememberMe);

    if (res.success) {
      navigate(from, { replace: true });
    } else if (res.requiresVerification) {
      setUnverifiedNotice({
        message: res.message,
        verificationId: res.verificationId,
        identifier: res.identifier,
        devOtp: res.devOtp
      });
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleDemoSignIn = async (role) => {
    setErrorMessage('');
    setUnverifiedNotice(null);
    const res = await demoLogin(role);
    if (res.success) {
      if (role === 'admin') navigate('/admin');
      else if (role === 'delivery') navigate('/delivery');
      else navigate(from, { replace: true });
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-emerald-950/5">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0c831f] to-emerald-400 flex items-center justify-center text-white mx-auto shadow-md shadow-emerald-200">
            <ShoppingBag className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Welcome Back!
          </h2>
          <p className="text-xs text-slate-500">
            Sign in to access your QuickBasket cart, addresses & orders
          </p>
        </div>

        {/* Unverified Account Warning Alert */}
        {unverifiedNotice && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold">{unverifiedNotice.message}</p>
                <p className="text-amber-700 mt-0.5">Please verify your one-time password to activate your account.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/verify-otp', {
                state: {
                  verificationId: unverifiedNotice.verificationId,
                  identifier: unverifiedNotice.identifier,
                  devOtp: unverifiedNotice.devOtp
                }
              })}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition"
            >
              Enter Verification OTP →
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Method Toggle */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => { setLoginMethod('email'); setIdentifier(''); setErrorMessage(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              loginMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email + Password</span>
          </button>

          <button
            type="button"
            onClick={() => { setLoginMethod('phone'); setIdentifier(''); setErrorMessage(''); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              loginMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Mobile + Password</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Identifier Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {loginMethod === 'email' ? 'Email Address' : 'Mobile Number'}
            </label>
            <div className="relative">
              {loginMethod === 'email' ? (
                <>
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="user@quickbasket.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-[#0c831f] focus:bg-white outline-none transition"
                  />
                </>
              ) : (
                <>
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-slate-400 font-bold border-r border-slate-200 pr-2">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="98765 43210"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-20 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-[#0c831f] focus:bg-white outline-none transition"
                  />
                </>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <Link to="/forgot-password" className="text-xs font-bold text-[#0c831f] hover:underline">
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-[#0c831f] focus:bg-white outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#0c831f] focus:ring-[#0c831f] border-slate-300"
              />
              <span>Remember me on this browser</span>
            </label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Instant 1-Click Demo Testing Buttons */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
            ⚡ Quick 1-Click Test Sign-Ins
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleDemoSignIn('customer')}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-center transition group"
            >
              <ShoppingBag className="w-4 h-4 text-slate-600 group-hover:text-[#0c831f] mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-800 block">Customer</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('admin')}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-center transition group"
            >
              <ShieldCheck className="w-4 h-4 text-amber-600 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-800 block">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSignIn('delivery')}
              className="p-2.5 rounded-2xl bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 text-center transition group"
            >
              <Bike className="w-4 h-4 text-teal-600 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-slate-800 block">Rider</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          New to QuickBasket?{' '}
          <Link to="/register" className="text-[#0c831f] font-bold hover:underline">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
