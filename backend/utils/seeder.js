import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Order from '../models/Order.js';
import OTPVerification from '../models/OTPVerification.js';
import Payment from '../models/Payment.js';
import { categoriesData, productsData, couponsData, deliveryPartnersData } from './seedData.js';

dotenv.config();

const seedAll = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing collections...');
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Product.deleteMany(),
      Coupon.deleteMany(),
      DeliveryPartner.deleteMany(),
      Order.deleteMany(),
      OTPVerification.deleteMany(),
      Payment.deleteMany()
    ]);

    console.log('👤 Seeding default users...');
    const users = await User.create([
      {
        fullName: 'Santu Shopper',
        name: 'Santu Shopper',
        email: 'user@quickbasket.com',
        password: 'password123',
        phone: '+919876543210',
        role: 'customer',
        accountStatus: 'active',
        emailVerified: true,
        phoneVerified: true,
        addresses: [
          {
            fullName: 'Santu Shopper',
            phone: '+919876543210',
            street: '402, Green Palm Residency, 100ft Road',
            landmark: 'Near Sony World Signal, Koramangala',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560034',
            type: 'Home',
            isDefault: true
          },
          {
            fullName: 'Santu Shopper',
            phone: '+919876543210',
            street: '7th Floor, Tech Hub Towers, Embassy Golf Links',
            landmark: 'Domlur Intermediate Ring Road',
            city: 'Bangalore',
            state: 'Karnataka',
            pincode: '560071',
            type: 'Work',
            isDefault: false
          }
        ]
      },
      {
        fullName: 'QuickBasket Admin',
        name: 'QuickBasket Admin',
        email: 'admin@quickbasket.com',
        password: 'admin123',
        phone: '+919000000001',
        role: 'admin',
        accountStatus: 'active',
        emailVerified: true,
        phoneVerified: true
      },
      {
        fullName: 'Ramesh Kumar (Delivery Partner)',
        name: 'Ramesh Kumar (Delivery Partner)',
        email: 'delivery@quickbasket.com',
        password: 'rider123',
        phone: '+919845012345',
        role: 'delivery',
        accountStatus: 'active',
        emailVerified: true,
        phoneVerified: true
      }
    ]);

    console.log('📦 Seeding categories...');
    await Category.insertMany(categoriesData);

    console.log('🛒 Seeding products...');
    const productsWithDiscounts = productsData.map((p) => ({
      ...p,
      discountPercent:
        p.originalPrice && p.price && p.originalPrice > p.price
          ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
          : 0
    }));
    await Product.insertMany(productsWithDiscounts);

    console.log('🎟️ Seeding coupons...');
    await Coupon.insertMany(couponsData);

    console.log('🛵 Seeding delivery partners...');
    await DeliveryPartner.insertMany(deliveryPartnersData);

    // Create a demo past order and an active order for the demo user
    const santuUser = users[0];
    const seededProducts = await Product.find().limit(3);

    console.log('📝 Seeding demo orders...');
    await Order.create([
      {
        orderNumber: 'QB-98412-101',
        user: santuUser._id,
        items: [
          {
            product: seededProducts[0]._id,
            name: seededProducts[0].name,
            image: seededProducts[0].image,
            price: seededProducts[0].price,
            originalPrice: seededProducts[0].originalPrice,
            quantity: 2,
            unit: seededProducts[0].unit
          },
          {
            product: seededProducts[1]._id,
            name: seededProducts[1].name,
            image: seededProducts[1].image,
            price: seededProducts[1].price,
            originalPrice: seededProducts[1].originalPrice,
            quantity: 1,
            unit: seededProducts[1].unit
          }
        ],
        shippingAddress: {
          fullName: santuUser.name,
          phone: santuUser.phone,
          street: santuUser.addresses[0].street,
          landmark: santuUser.addresses[0].landmark,
          city: santuUser.addresses[0].city,
          state: santuUser.addresses[0].state,
          pincode: santuUser.addresses[0].pincode,
          type: santuUser.addresses[0].type
        },
        deliveryTimeSlot: 'Instant Delivery (10-15 mins)',
        paymentMethod: 'UPI',
        paymentStatus: 'Completed',
        paymentDetails: {
          transactionId: 'upi_ref_892348123912',
          paidAt: new Date(Date.now() - 8 * 60 * 1000)
        },
        itemsPrice: (seededProducts[0].price * 2) + seededProducts[1].price,
        deliveryPrice: 0,
        platformFee: 5,
        discountAmount: 20,
        totalPrice: ((seededProducts[0].price * 2) + seededProducts[1].price + 5) - 20,
        orderStatus: 'Out for Delivery',
        statusTimeline: [
          {
            status: 'Order Placed',
            timestamp: new Date(Date.now() - 10 * 60 * 1000),
            description: 'Order placed and confirmed by dark store.'
          },
          {
            status: 'Order Confirmed',
            timestamp: new Date(Date.now() - 8 * 60 * 1000),
            description: 'Dark store staff picked your fresh groceries.'
          },
          {
            status: 'Packing',
            timestamp: new Date(Date.now() - 5 * 60 * 1000),
            description: 'Bag sealed and handed over to delivery partner.'
          },
          {
            status: 'Out for Delivery',
            timestamp: new Date(Date.now() - 2 * 60 * 1000),
            description: 'Ramesh Kumar is 4 minutes away on electric scooter.'
          }
        ],
        deliveryPartner: {
          name: 'Ramesh Kumar',
          phone: '+91 98450 12345',
          rating: 4.9,
          vehicleNumber: 'KA-01-EQ-4421',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
        },
        estimatedDeliveryTime: '4 mins'
      }
    ]);

    console.log('✅ QuickBasket database successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

seedAll();
