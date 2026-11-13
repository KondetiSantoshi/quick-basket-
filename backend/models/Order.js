import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: '1 unit' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    street: { type: String, required: true },
    landmark: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    type: { type: String, default: 'Home' }
  },
  deliveryHub: {
    name: { type: String },
    lat: { type: Number },
    lng: { type: Number },
    distanceKm: { type: Number }
  },
  deliveryTimeSlot: { type: String, default: 'Instant Delivery (10-15 mins)' },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'COD', 'RAZORPAY'],
    default: 'UPI'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
    default: 'Pending'
  },
  paymentDetails: {
    transactionId: String,
    paidAt: Date,
    upiId: String,
    upiApp: String,
    cardNetwork: String,
    cardLast4: String,
    bankName: String,
    walletName: String,
    methodLabel: String,
    gatewayMode: String,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  itemsPrice: { type: Number, required: true },
  deliveryPrice: { type: Number, required: true, default: 0 },
  platformFee: { type: Number, required: true, default: 5 },
  discountAmount: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true },
  couponApplied: {
    code: String,
    discount: Number
  },
  orderStatus: {
    type: String,
    enum: ['Order Placed', 'Order Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'],
    default: 'Order Placed'
  },
  statusTimeline: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now },
      description: String
    }
  ],
  deliveryPartner: {
    name: { type: String, default: 'Ramesh Kumar' },
    phone: { type: String, default: '+91 98450 12345' },
    rating: { type: Number, default: 4.9 },
    vehicleNumber: { type: String, default: 'KA-01-EQ-4421' },
    photo: { type: String, default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }
  },
  estimatedDeliveryTime: { type: String, default: '12-15 mins' }
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
