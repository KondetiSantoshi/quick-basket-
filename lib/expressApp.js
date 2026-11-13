import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/authRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import categoryRoutes from '../routes/categoryRoutes.js';
import orderRoutes from '../routes/orderRoutes.js';
import couponRoutes from '../routes/couponRoutes.js';
import deliveryRoutes from '../routes/deliveryRoutes.js';
import paymentRoutes from '../routes/paymentRoutes.js';
import locationRoutes from '../routes/locationRoutes.js';

export function createExpressApp() {
  const server = express();

  server.use(cors());
  server.use(express.json({ limit: '10mb' }));
  server.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Endpoints
  server.use('/api/auth', authRoutes);
  server.use('/api/payment', paymentRoutes);
  server.use('/api/products', productRoutes);
  server.use('/api/categories', categoryRoutes);
  server.use('/api/orders', orderRoutes);
  server.use('/api/coupons', couponRoutes);
  server.use('/api/delivery', deliveryRoutes);
  server.use('/api/location', locationRoutes);

  // Health check
  server.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      appName: 'QuickBasket Unified Next.js Platform',
      version: '2.0.0',
      timestamp: new Date()
    });
  });

  return server;
}
