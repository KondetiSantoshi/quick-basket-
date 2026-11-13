import express from 'express';
import {
  registerUser,
  sendLoginOTP,
  verifyRegistrationOTP,
  resendOTP,
  loginUser,
  forgotPassword,
  resetPassword,
  changePassword,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
  toggleWishlist
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Registration & Verification
router.post('/register', authLimiter, registerUser);
router.post('/send-otp', otpLimiter, sendLoginOTP);
router.post('/verify-otp', otpLimiter, verifyRegistrationOTP);
router.post('/resend-otp', otpLimiter, resendOTP);

// Login & Password Management
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', otpLimiter, resetPassword);
router.put('/change-password', protect, changePassword);

// Profile & Account Management
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/address', protect, addAddress);
router.delete('/address/:addressId', protect, deleteAddress);
router.post('/wishlist/:productId', protect, toggleWishlist);

export default router;
