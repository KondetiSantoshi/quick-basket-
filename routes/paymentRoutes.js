import express from 'express';
import {
  getRazorpayKey,
  getSupportedPaymentMethods,
  verifyUpiVpa,
  createRazorpayOrder,
  authorizeSandboxPayment,
  verifyPaymentSignature,
  recordPaymentFailure,
  getMyPaymentHistory,
  handleRazorpayWebhook
} from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.get('/razorpay-key', getRazorpayKey);
router.get('/methods', getSupportedPaymentMethods);
router.post('/verify-vpa', verifyUpiVpa);
router.post('/create-order', protect, paymentLimiter, createRazorpayOrder);
router.post('/authorize-sandbox', protect, paymentLimiter, authorizeSandboxPayment);
router.post('/verify-signature', protect, verifyPaymentSignature);
router.post('/record-failure', recordPaymentFailure);
router.get('/my-history', protect, getMyPaymentHistory);
router.post('/webhook', handleRazorpayWebhook);

export default router;
