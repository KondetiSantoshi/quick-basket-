import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import { categoriesData, productsData, couponsData, deliveryPartnersData } from './seedData.js';

dotenv.config();

const computeDiscount = (originalPrice, price) => {
  if (originalPrice && price && originalPrice > price) {
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  }
  return 0;
};

const syncCatalog = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      throw new Error('Could not connect to MongoDB');
    }

    console.log('📦 Upserting categories (preserving users and orders)...');
    let categoriesUpserted = 0;
    for (const cat of categoriesData) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { $set: { ...cat, isActive: cat.isActive !== false } },
        { upsert: true, new: true }
      );
      categoriesUpserted++;
    }

    console.log('🛒 Upserting products with calculated discounts...');
    let productsUpserted = 0;
    for (const prod of productsData) {
      const discountPercent = computeDiscount(prod.originalPrice, prod.price);
      await Product.findOneAndUpdate(
        { slug: prod.slug },
        { $set: { ...prod, discountPercent } },
        { upsert: true, new: true }
      );
      productsUpserted++;
    }

    console.log('🔢 Updating category itemCounts...');
    for (const cat of categoriesData) {
      const count = await Product.countDocuments({ category: cat.name });
      await Category.updateOne({ slug: cat.slug }, { $set: { itemCount: count } });
    }

    console.log('🎟️ Syncing coupons...');
    for (const coupon of couponsData) {
      await Coupon.findOneAndUpdate(
        { code: coupon.code },
        { $setOnInsert: coupon },
        { upsert: true, new: true }
      );
    }

    console.log('🛵 Syncing delivery partners...');
    for (const partner of deliveryPartnersData) {
      await DeliveryPartner.findOneAndUpdate(
        { email: partner.email },
        { $setOnInsert: partner },
        { upsert: true, new: true }
      );
    }

    const totalCategories = await Category.countDocuments();
    const totalProducts = await Product.countDocuments();

    console.log(
      `✅ Catalog sync complete! Upserted ${categoriesUpserted} categories (DB total: ${totalCategories}) and ${productsUpserted} products (DB total: ${totalProducts}). Users and Orders untouched.`
    );

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during catalog sync:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
};

syncCatalog();
