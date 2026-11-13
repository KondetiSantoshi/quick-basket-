import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';

const ForgotPasswordPage = () => {
  const { forgotPassword, resetPassword, loading } = useAuth();
  const navigate = useNavigate();

  // Stage 1: Request OTP | Stage 2: Verify & Enter New Password | Stage 3: Success
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [verificationId, setVerificationId] = useState('');
  const [devOtp, setDevOtp] = useState('123456');

  // Password reset fields
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your registered email address or mobile number');
      return;
    }

    const res = await forgotPassword(identifier.trim());
    if (res.success) {
      setVerificationId(res.data.verificationId);
      if (res.data.devOtp) setDevOtp(res.data.devOtp);
      setSuccessMessage(res.data.message);
      setStep(2);
    } else {
      setErrorMessage(res.message);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otp.trim() || otp.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit OTP sent to you');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    const res = await resetPassword(verificationId, otp.trim(), newPassword, confirmPassword);
    if (res.success) {
      setStep(3);
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-emerald-950/5">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0c831f] flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
            <KeyRound className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            {step === 1 ? 'Forgot Password?' : step === 2 ? 'Set New Password' : 'Password Reset Done!'}
          </h2>
          <p className="text-xs text-slate-500">
            {step === 1 && 'Enter your registered email or mobile to receive a reset code'}
            {step === 2 && `Enter the 6-digit OTP sent to ${identifier} and your new password`}
            {step === 3 && 'Your account password has been updated securely.'}
          </p>
        </div>

        {/* Success message */}
        {successMessage && step === 2 && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: Enter Identifier */}
        {step === 1 && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Registered Email or Mobile Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. user@quickbasket.com or 9876501234"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-[#0c831f] focus:bg-white outline-none transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Send Reset OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Enter OTP & New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Auto-fill banner */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-700">Test Code: </span>
                <span className="font-mono font-black text-sm text-[#0c831f] bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {devOtp}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOtp(devOtp)}
                className="px-2.5 py-1 bg-[#0c831f] hover:bg-[#095e16] text-white text-[11px] font-bold rounded-lg transition"
              >
                Auto-Fill
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Enter 6-Digit OTP *
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center font-mono font-black text-xl tracking-widest py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#0c831f]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Password (Min. 6 chars) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-[#0c831f] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-[#0c831f] outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Success State */}
        {step === 3 && (
          <div className="text-center space-y-4 py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0c831f] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Your password has been changed successfully!
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0c831f] hover:bg-[#095e16] text-white font-bold text-xs uppercase rounded-xl transition shadow-md"
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Bottom Back Button */}
        {step !== 3 && (
          <div className="pt-2 border-t border-slate-100 text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordPage;
