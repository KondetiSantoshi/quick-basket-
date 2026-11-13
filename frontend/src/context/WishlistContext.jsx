import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('qb_wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('qb_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const toggleWishlist = async (productId) => {
    const exists = wishlist.includes(productId);
    const updated = exists ? wishlist.filter((id) => id !== productId) : [...wishlist, productId];
    setWishlist(updated);

    if (user && user.token) {
      try {
        await api.post(`/auth/wishlist/${productId}`);
      } catch (e) {
        console.error('Wishlist backend sync error', e);
      }
    }
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
