import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, required: true },
  discountType: { type: String, enum: ['PERCENTAGE', 'FLAT'], default: 'PERCENTAGE' },
  discountValue: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: { type: Number, default: 200 },
  validUntil: { type: Date, default: () => new Date(+new Date() + 30*24*60*60*1000) },
  usageCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
