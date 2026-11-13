'use client';

import React, { Suspense } from 'react';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { LocationProvider } from '../context/LocationContext';
import { WishlistProvider } from '../context/WishlistContext';

import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CartDrawer from '../components/cart/CartDrawer';
import LocationModal from '../components/common/LocationModal';
import AuthModal from '../components/common/AuthModal';
import FreeDeliveryPill from '../components/common/FreeDeliveryPill';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <WishlistProvider>
            <div className="min-h-screen flex flex-col bg-[#f8faf8] text-slate-800 font-sans">
              <Suspense fallback={<div className="h-20 bg-white border-b border-slate-100" />}>
                <Navbar />
              </Suspense>
              <main className="flex-1">{children}</main>
              <Footer />
              <CartDrawer />
              <LocationModal />
              <AuthModal />
              <FreeDeliveryPill />
            </div>
          </WishlistProvider>
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
