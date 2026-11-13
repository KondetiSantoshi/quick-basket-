import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  ArrowLeft,
  Mail,
  Phone,
  Sparkles,
  Send
} from 'lucide-react';

const OTPVerificationPage = () => {
  const { verifyOTP, resendOTP, sendOTP, pendingVerification, setPendingVerification } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve verification state from router or session
  const [verificationId, setVerificationId] = useState(
    location.state?.verificationId || pendingVerification?.verificationId || ''
  );
  const [identifier, setIdentifier] = useState(
    location.state?.identifier || pendingVerification?.identifier || ''
  );
  const [currentDevOtp, setCurrentDevOtp] = useState(
    location.state?.devOtp || pendingVerification?.devOtp || '123456'
  );

  const verificationMethod = location.state?.verificationMethod || 
    pendingVerification?.verificationMethod || 
    (identifier?.includes('@') ? 'email' : 'phone');

  // Input for standalone lookup if user came with empty session
  const [standaloneInput, setStandaloneInput] = useState('');
  const [isSendingInitialOtp, setIsSendingInitialOtp] = useState(false);

  // 6 boxes state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  
  // 15-minute validity (900 seconds)
  const [timeLeft, setTimeLeft] = useState(900);

  // 30s resend cooldown countdown
  const [resendCooldown, setResendCooldown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Focus first input on mount
  useEffect(() => {
    if (identifier && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [identifier]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal) {
      const updated = [...otpDigits];
      updated[index] = '';
      setOtpDigits(updated);
      return;
    }

    const char = cleanVal.slice(-1);
    const updated = [...otpDigits];
    updated[index] = char;
    setOtpDigits(updated);

    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }

    const fullOtp = updated.join('');
    if (fullOtp.length === 6) {
      submitOTP(fullOtp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const digits = pasteData.split('');
    const updated = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      if (i < 6) updated[i] = d;
    });
    setOtpDigits(updated);

    const nextIndex = Math.min(digits.length, 5);
    if (inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex].focus();
    }

    if (pasteData.length === 6) {
      submitOTP(pasteData);
    }
  };

  const submitOTP = async (codeToVerify) => {
    const code = codeToVerify || otpDigits.join('');
    if (code.length < 6) {
      setErrorMessage('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const res = await verifyOTP(
      { verificationId, identifier, otp: code },
      code,
      identifier
    );
    setLoading(false);

    if (res.success) {
      setSuccessMessage(res.message);
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleAutoFill = (codeToFill) => {
    const fillCode = String(codeToFill || currentDevOtp || '123456').slice(0, 6);
    const digits = fillCode.split('');
    setOtpDigits(digits);
    setErrorMessage('');
    submitOTP(fillCode);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage('');
    
    const res = await resendOTP(verificationId, identifier);
    setIsResending(false);

    if (res.success) {
      setSuccessMessage(res.message);
      if (res.devOtp) {
        setCurrentDevOtp(res.devOtp);
      }
      setResendCooldown(res.cooldown || 30);
      setTimeLeft(900); // Reset to 15 mins
      setOtpDigits(['', '', '', '', '', '']);
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } else {
      setErrorMessage(res.message);
    }
  };

  const handleSendInitialOtp = async (e) => {
    e.preventDefault();
    if (!standaloneInput.trim()) {
      setErrorMessage('Please enter your email or mobile number');
      return;
    }

    setIsSendingInitialOtp(true);
    setErrorMessage('');

    const res = await sendOTP(standaloneInput.trim(), 'login');
    setIsSendingInitialOtp(false);

    if (res.success) {
      setIdentifier(res.identifier);
      setVerificationId(res.verificationId);
      if (res.devOtp) setCurrentDevOtp(res.devOtp);
      setSuccessMessage(res.message);
      setTimeLeft(900);
      setResendCooldown(30);
    } else {
      setErrorMessage(res.message);
    }
  };

  // If no session was provided, offer inline lookup
  if (!identifier && !verificationId) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-emerald-950/5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0c831f] flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
              <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Account Verification
            </h2>
            <p className="text-xs text-slate-500">
              Enter your registered Email or Mobile to verify and activate your account
            </p>
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSendInitialOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address or Mobile Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. user@gmail.com or 9876543210"
                value={standaloneInput}
                onChange={(e) => setStandaloneInput(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:border-[#0c831f] focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingInitialOtp}
              className="w-full py-3.5 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              {isSendingInitialOtp ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Verification Code</span>
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link to="/register" className="text-[#0c831f] font-bold hover:underline">
              Register New Account
            </Link>
            <Link to="/login" className="text-slate-600 hover:text-slate-900 font-semibold">
              Sign In Instead
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-5 bg-white p-8 sm:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-emerald-950/5">
        
        {/* Top Icon */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#0c831f] flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
            <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Verify Your OTP
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
            {verificationMethod === 'phone' ? <Phone className="w-3.5 h-3.5 text-emerald-600" /> : <Mail className="w-3.5 h-3.5 text-emerald-600" />}
            <span>Code for <strong className="text-slate-800 font-semibold">{identifier}</strong></span>
          </div>
        </div>

        {/* Instant Dev / Testing OTP Auto-Fill Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <p className="text-[11px] text-emerald-700 font-medium">Testing Code Ready:</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="font-mono font-black text-sm text-[#0c831f] bg-white px-2 py-0.5 rounded-md border border-emerald-300">
                  {currentDevOtp}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">(or 123456)</span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleAutoFill(currentDevOtp)}
            className="px-3.5 py-1.5 bg-[#0c831f] hover:bg-[#095e16] text-white text-[11px] font-bold rounded-xl shadow-sm hover:shadow active:scale-95 transition flex items-center gap-1"
          >
            <span>Auto-Fill</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 6 Digit Input Boxes */}
        <div className="space-y-4">
          <label className="block text-xs font-bold text-slate-700 text-center uppercase tracking-wider">
            Enter 6-Digit Code
          </label>
          <div className="flex justify-between gap-2 sm:gap-2.5">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-11 h-14 sm:w-12 sm:h-14 text-center font-mono font-black text-2xl text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl focus:border-[#0c831f] focus:bg-white focus:ring-4 focus:ring-emerald-50 outline-none transition"
              />
            ))}
          </div>

          {/* Expiry Timer Countdown & Resend Button */}
          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Valid for:</span>
              <strong className={`font-mono ${timeLeft < 60 ? 'text-rose-600' : 'text-slate-700'}`}>
                {formatTimer(timeLeft)}
              </strong>
            </span>

            {/* Resend button with cooldown */}
            {resendCooldown > 0 ? (
              <span className="text-[11px] font-semibold text-slate-400">
                Resend in {resendCooldown}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isResending}
                className="text-xs font-bold text-[#0c831f] hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                <span>Resend OTP</span>
              </button>
            )}
          </div>

          {/* Verify CTA Button */}
          <button
            type="button"
            onClick={() => submitOTP()}
            disabled={loading || otpDigits.join('').length < 6 || timeLeft === 0}
            className="w-full py-3.5 bg-[#0c831f] hover:bg-[#095e16] disabled:bg-slate-300 text-white rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-700/20 active:scale-98 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Verify & Activate Account</span>
            )}
          </button>
        </div>

        {/* Bottom Navigation */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link to="/register" className="flex items-center gap-1 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Details</span>
          </Link>

          <Link to="/login" className="text-[#0c831f] font-bold hover:underline">
            Back to Sign In
          </Link>
        </div>

      </div>
    </div>
  );
};

export default OTPVerificationPage;
