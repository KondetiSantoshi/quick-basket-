import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpVerificationSchema = new mongoose.Schema({
  verificationId: { type: String, required: true, unique: true },
  identifier: { type: String, required: true, index: true }, // email or mobile number
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  otpHash: { type: String, required: true },
  purpose: {
    type: String,
    enum: ['registration', 'password_reset', 'login', 'email_verification', 'phone_verification'],
    default: 'registration'
  },
  expiryTime: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
  },
  attempts: { type: Number, default: 0 },
  verified: { type: Boolean, default: false },
  lastResendAt: { type: Date, default: Date.now },
  pendingData: { type: mongoose.Schema.Types.Mixed } // optional storage for pending user details before activation
}, {
  timestamps: true
});

// Helper to compare plain OTP with stored hash
otpVerificationSchema.methods.matchOTP = async function (enteredOTP) {
  return await bcrypt.compare(String(enteredOTP), this.otpHash);
};

// Auto-delete records older than 1 hour to keep collection clean
otpVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const OTPVerification = mongoose.model('OTPVerification', otpVerificationSchema);
export default OTPVerification;
