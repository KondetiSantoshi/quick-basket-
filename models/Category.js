import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  image: { type: String, required: true },
  bannerImage: { type: String },
  description: { type: String },
  itemCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
