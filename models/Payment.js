import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  orderNumber: { type: String, required: true },
  razorpayOrderId: { type: String },
  razorpayPaymentId: { type: String },
  razorpaySignature: { type: String },
  gatewayMode: {
    type: String,
    enum: ['razorpay', 'sandbox', 'upi_direct', 'cod'],
    default: 'razorpay'
  },
  paymentStatus: {
    type: String,
    enum: ['Created', 'Authorized', 'Captured', 'Completed', 'Failed', 'Refunded'],
    default: 'Created'
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'COD', 'RAZORPAY'],
    required: true
  },
  methodLabel: { type: String }, // e.g., "Google Pay (UPI)", "VISA •••• 4242", "HDFC Net Banking"
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  upiDetails: {
    vpa: { type: String },
    app: { type: String },
    bank: { type: String }
  },
  cardDetails: {
    network: { type: String },
    last4: { type: String },
    type: { type: String },
    holderName: { type: String }
  },
  netbankingDetails: {
    bankName: { type: String },
    bankCode: { type: String }
  },
  walletDetails: {
    walletName: { type: String },
    phone: { type: String }
  },
  errorDetails: {
    code: String,
    description: String,
    source: String,
    step: String,
    reason: String
  },
  transactionDate: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
