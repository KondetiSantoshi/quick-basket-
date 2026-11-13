import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation as useRouterLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import LocationModal from './components/common/LocationModal';
import AuthModal from './components/common/AuthModal';
import FreeDeliveryPill from './components/common/FreeDeliveryPill';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import UserDashboardPage from './pages/UserDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DeliveryDashboardPage from './pages/DeliveryDashboardPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import OTPVerificationPage from './pages/OTPVerificationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import InfoPage from './pages/InfoPage';
import NotFoundPage from './pages/NotFoundPage';

const ScrollToTop = () => {
  const { pathname, search } = useRouterLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <WishlistProvider>
              <div className="min-h-screen flex flex-col bg-[#f8faf8] text-slate-800 font-sans">
                
                {/* Global Sticky Navigation */}
                <Navbar />

                {/* Main Views Container */}
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/product/:id" element={<ProductDetailsPage />} />
                    <Route path="/cart" element={<CartPage />} />

                    {/* Dedicated Authentication Pages */}
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/verify-otp" element={<OTPVerificationPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                    {/* Protected Checkout & User Profile */}
                    <Route
                      path="/checkout"
                      element={
                        <ProtectedRoute>
                          <CheckoutPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <UserDashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/admin" element={<AdminDashboardPage />} />
                    <Route path="/delivery" element={<DeliveryDashboardPage />} />

                    {/* Order Tracking */}
                    <Route path="/order-success/:orderNumber" element={<OrderSuccessPage />} />
                    <Route path="/order-tracking/:id" element={<OrderTrackingPage />} />
                    
                    {/* Informational & App Pages */}
                    <Route path="/about" element={<InfoPage />} />
                    <Route path="/contact" element={<InfoPage />} />
                    <Route path="/help" element={<InfoPage />} />
                    <Route path="/terms" element={<InfoPage />} />
                    <Route path="/privacy" element={<InfoPage />} />
                    <Route path="/apps" element={<InfoPage />} />

                    {/* 404 Not Found fallback */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>

                {/* Global Footer */}
                <Footer />

                {/* Global Modals & Slide-overs */}
                <CartDrawer />
                <LocationModal />
                <AuthModal />
                <FreeDeliveryPill />

              </div>
            </WishlistProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
