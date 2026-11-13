'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, deliveryOnly = false }) => {
  const { user, isAuthenticated, isAdmin, isDelivery, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.replace(`/login?from=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    if (adminOnly && !isAdmin) {
      router.replace('/');
      return;
    }

    if (deliveryOnly && !isDelivery && !isAdmin) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, user, isAdmin, isDelivery, loading, adminOnly, deliveryOnly, pathname, router]);

  if (loading || !isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-emerald-600/30 border-t-[#0c831f] rounded-full animate-spin" />
      </div>
    );
  }

  if (adminOnly && !isAdmin) return null;
  if (deliveryOnly && !isDelivery && !isAdmin) return null;

  return children;
};

export default ProtectedRoute;
