import express from 'express';
import {
  getDeliveryDashboard,
  getDeliveryPartners,
  createDeliveryPartner
} from '../controllers/deliveryController.js';
import { protect, deliveryOnly, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, deliveryOnly, getDeliveryDashboard);
router.get('/partners', protect, adminOnly, getDeliveryPartners);
router.post('/partners', protect, adminOnly, createDeliveryPartner);

export default router;
