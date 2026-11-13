import mongoose from 'mongoose';

const reviewSubSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  brand: { type: String, required: true },
  category: { type: String, required: true }, // e.g. "Fruits & Vegetables", "Dairy, Bread & Eggs"
  categorySlug: { type: String, required: true },
  unit: { type: String, required: true, default: '1 kg' }, // e.g. '500 g', '1 kg', '1 L'
  variants: [{
    unit: String,
    price: Number,
    originalPrice: Number,
    inStock: { type: Boolean, default: true }
  }],
  price: { type: Number, required: true }, // discounted price
  originalPrice: { type: Number, required: true }, // MRP
  discountPercent: { type: Number, default: 0 },
  image: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String, required: true },
  shelfLife: { type: String, default: '3 to 5 days' },
  storageInstructions: { type: String, default: 'Store in a cool, dry place' },
  countryOfOrigin: { type: String, default: 'India' },
  deliveryEstimate: { type: String, default: '10 MINS' },
  inStock: { type: Boolean, default: true },
  stockCount: { type: Number, default: 50 },
  isTrending: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isDailyEssential: { type: Boolean, default: false },
  isDeal: { type: Boolean, default: false },
  rating: { type: Number, default: 4.5 },
  numReviews: { type: Number, default: 12 },
  reviews: [reviewSubSchema],
  tags: [{ type: String }]
}, {
  timestamps: true
});

// Auto-calculate discount percentage before save
productSchema.pre('save', function (next) {
  if (this.originalPrice && this.price && this.originalPrice > this.price) {
    this.discountPercent = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  } else {
    this.discountPercent = 0;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
