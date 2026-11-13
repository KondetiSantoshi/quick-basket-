import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  verifyPayment,
  getAdminAnalytics
} from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/analytics', protect, adminOnly, getAdminAnalytics);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, updateOrderStatus);
router.post('/verify-payment', protect, verifyPayment);

// Admin all orders
router.get('/', protect, getAllOrders);

export default router;
