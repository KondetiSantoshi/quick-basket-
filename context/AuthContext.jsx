'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [pendingVerification, setPendingVerification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [initialized, setInitialized] = useState(false);

  // Safe client-side storage hydration
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('qb_user');
      if (savedUser) setUser(JSON.parse(savedUser));

      const savedPending = sessionStorage.getItem('qb_pending_verification');
      if (savedPending) setPendingVerification(JSON.parse(savedPending));
    } catch (e) {
      console.error('Storage hydration error', e);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    if (user) {
      localStorage.setItem('qb_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('qb_user');
    }
  }, [user, initialized]);

  useEffect(() => {
    if (!initialized) return;
    if (pendingVerification) {
      sessionStorage.setItem('qb_pending_verification', JSON.stringify(pendingVerification));
    } else {
      sessionStorage.removeItem('qb_pending_verification');
    }
  }, [pendingVerification, initialized]);

  // Login with Email or Mobile + Password
  const login = async (loginIdentifier, password, rememberMe = true) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { loginIdentifier, password, rememberMe });
      setUser(data);
      setAuthModalOpen(false);
      return { success: true, user: data };
    } catch (error) {
      const responseData = error.response?.data;
      if (responseData?.requiresVerification) {
        setPendingVerification({
          verificationId: responseData.verificationId,
          identifier: responseData.identifier,
          devOtp: responseData.devOtp,
          purpose: 'registration'
        });
        return {
          success: false,
          requiresVerification: true,
          verificationId: responseData.verificationId,
          identifier: responseData.identifier,
          devOtp: responseData.devOtp,
          message: responseData.message
        };
      }
      return {
        success: false,
        message: responseData?.message || 'Login failed. Please check your credentials.'
      };
    } finally {
      setLoading(false);
    }
  };

  // Register new user (Triggers real OTP)
  const register = async (registerData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', registerData);
      setPendingVerification({
        verificationId: data.verificationId,
        identifier: data.identifier,
        verificationMethod: data.verificationMethod,
        devOtp: data.devOtp,
        purpose: 'registration'
      });
      return { success: true, data };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Send OTP for login or verification
  const sendOTP = async (identifier, purpose = 'login') => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/send-otp', { identifier, purpose });
      setPendingVerification({
        verificationId: data.verificationId,
        identifier: data.identifier,
        devOtp: data.devOtp,
        purpose
      });
      return { success: true, ...data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to send OTP'
      };
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP to activate account or login
  const verifyOTP = async (verificationIdOrPayload, otpCode, optionalIdentifier) => {
    setLoading(true);
    try {
      let payload = {};
      if (typeof verificationIdOrPayload === 'object' && verificationIdOrPayload !== null) {
        payload = verificationIdOrPayload;
      } else {
        payload = {
          verificationId: verificationIdOrPayload,
          identifier: optionalIdentifier || pendingVerification?.identifier,
          otp: otpCode
        };
      }

      const { data } = await api.post('/auth/verify-otp', payload);
      setUser(data.user);
      setPendingVerification(null);
      setAuthModalOpen(false);
      return { success: true, message: data.message, user: data.user };
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP with cooldown
  const resendOTP = async (verificationId, identifier) => {
    try {
      const { data } = await api.post('/auth/resend-otp', {
        verificationId: verificationId || pendingVerification?.verificationId,
        identifier: identifier || pendingVerification?.identifier
      });
      if (data.devOtp) {
        setPendingVerification(prev => ({ ...prev, devOtp: data.devOtp }));
      }
      return {
        success: true,
        message: data.message,
        cooldown: data.cooldown,
        devOtp: data.devOtp
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to resend OTP'
      };
    }
  };

  // Forgot password request (sends OTP)
  const forgotPassword = async (identifier) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { identifier });
      setPendingVerification({
        verificationId: data.verificationId,
        identifier: data.identifier,
        purpose: 'password_reset'
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset request failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // Reset password using OTP
  const resetPassword = async (verificationId, otp, newPassword, confirmPassword) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', {
        verificationId,
        otp,
        newPassword,
        confirmPassword
      });
      setPendingVerification(null);
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password reset failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // Change password for logged-in user
  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return { success: true, message: data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password'
      };
    } finally {
      setLoading(false);
    }
  };

  // 1-Click test login for demo convenience
  const demoLogin = async (role = 'customer') => {
    setLoading(true);
    let credentials = { loginIdentifier: 'user@quickbasket.com', password: 'password123' };
    if (role === 'admin') credentials = { loginIdentifier: 'admin@quickbasket.com', password: 'admin123' };
    if (role === 'delivery') credentials = { loginIdentifier: 'delivery@quickbasket.com', password: 'rider123' };

    try {
      const { data } = await api.post('/auth/login', credentials);
      setUser(data);
      setAuthModalOpen(false);
      return { success: true, user: data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Demo login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (formData) => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', formData);
      setUser(prev => ({ ...prev, ...data }));
      return { success: true, data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    } finally {
      setLoading(false);
    }
  };

  // Add saved address
  const addAddress = async (addressData) => {
    try {
      const { data } = await api.post('/auth/address', addressData);
      setUser(prev => ({ ...prev, addresses: data }));
      return { success: true, addresses: data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to add address' };
    }
  };

  // Delete saved address
  const deleteAddress = async (addressId) => {
    try {
      const { data } = await api.delete(`/auth/address/${addressId}`);
      setUser(prev => ({ ...prev, addresses: data }));
      return { success: true, addresses: data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Failed to delete address' };
    }
  };

  // Logout
  const logout = () => {
    setUser(null);
    setPendingVerification(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('qb_user');
      sessionStorage.removeItem('qb_pending_verification');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authModalOpen,
        setAuthModalOpen,
        authMode,
        setAuthMode,
        pendingVerification,
        setPendingVerification,
        login,
        register,
        sendOTP,
        verifyOTP,
        resendOTP,
        forgotPassword,
        resetPassword,
        changePassword,
        demoLogin,
        updateProfile,
        addAddress,
        deleteAddress,
        logout,
        isAuthenticated: !!user?.token,
        isAdmin: user?.role === 'admin',
        isDelivery: user?.role === 'delivery'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
