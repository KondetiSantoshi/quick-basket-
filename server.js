import express from 'express';
import next from 'next';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import locationRoutes from './routes/locationRoutes.js';

dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

// Connect to MongoDB
await connectDB();

app.prepare().then(() => {
  const server = express();

  // Middlewares
  server.use(cors());
  server.use(express.json());
  server.use(morgan(dev ? 'dev' : 'combined'));

  // Backend API Endpoints
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

  // Next.js handles all page routes & static assets
  server.all('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`\n🚀 QuickBasket Full-Stack App running at: http://localhost:${PORT}`);
    console.log(`📦 Storefront: http://localhost:${PORT}`);
    console.log(`⚡ API Health: http://localhost:${PORT}/api/health\n`);
  });
}).catch((err) => {
  console.error('Error starting server:', err);
  process.exit(1);
});
