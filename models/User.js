import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
  fullName: { type: String },
  phone: { type: String },
  street: { type: String, required: true },
  landmark: { type: String },
  city: { type: String, required: true, default: 'Bangalore' },
  state: { type: String, required: true, default: 'Karnataka' },
  pincode: { type: String, required: true },
  lat: { type: Number },
  lng: { type: Number },
  type: { type: String, enum: ['Home', 'Work', 'Other'], default: 'Home' },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  password: { type: String, required: true },
  emailVerified: { type: Boolean, default: false },
  phoneVerified: { type: Boolean, default: false },
  accountStatus: {
    type: String,
    enum: ['active', 'pending_verification', 'suspended'],
    default: 'pending_verification'
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'delivery'],
    default: 'customer'
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
  },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual `name` pointing to `fullName` for backwards compatibility with any existing components
userSchema.virtual('name')
  .get(function () { return this.fullName; })
  .set(function (v) { this.fullName = v; });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
