import express from 'express';
import {
  getCoupons,
  validateCoupon,
  createCoupon,
  deleteCoupon
} from '../controllers/couponController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCoupons);
router.post('/validate', validateCoupon);
router.post('/', protect, adminOnly, createCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

export default router;
