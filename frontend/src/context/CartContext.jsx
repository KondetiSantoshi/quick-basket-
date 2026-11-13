import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('qb_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [coupon, setCoupon] = useState(() => {
    const saved = localStorage.getItem('qb_coupon');
    return saved ? JSON.parse(saved) : null;
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [tipAmount, setTipAmount] = useState(0);

  useEffect(() => {
    localStorage.setItem('qb_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (coupon) {
      localStorage.setItem('qb_coupon', JSON.stringify(coupon));
    } else {
      localStorage.removeItem('qb_coupon');
    }
  }, [coupon]);

  // Add product (with optional selected pack-size unit) to cart
  const addToCart = (product, qty = 1) => {
    const targetId = product.productId || product._id;
    const targetUnit = product.unit || '1 unit';

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => (item.productId || item._id) === targetId && (item.unit || '1 unit') === targetUnit
      );

      if (existingIndex > -1) {
        return prevItems.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      }

      return [
        ...prevItems,
        {
          _id: targetId,
          productId: targetId,
          cartKey: `${targetId}__${targetUnit}`,
          name: product.name,
          brand: product.brand,
          unit: targetUnit,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
          category: product.category,
          quantity: qty,
          inStock: product.inStock
        }
      ];
    });
  };

  // Update item quantity (matches product + unit when unit is provided)
  const updateQuantity = (productId, newQuantity, unit = null) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, unit);
      return;
    }
    setCartItems((prevItems) => {
      let updatedOnce = false;
      return prevItems.map((item) => {
        const itemId = item.productId || item._id;
        const matchesId = itemId === productId || item.cartKey === productId;
        const matchesUnit = unit ? item.unit === unit : !updatedOnce;
        if (matchesId && matchesUnit) {
          updatedOnce = true;
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  // Remove item completely (specific variant if unit passed, else matching product)
  const removeFromCart = (productId, unit = null) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => {
        const itemId = item.productId || item._id;
        if (itemId !== productId && item.cartKey !== productId) return true;
        if (unit && item.unit !== unit) return true;
        return false;
      })
    );
  };

  // Clear all items
  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setTipAmount(0);
    localStorage.removeItem('qb_cart');
    localStorage.removeItem('qb_coupon');
  };

  // Check how many of a product (or specific pack-size unit) are currently in cart
  const getItemQuantity = (productId, unit = null) => {
    if (unit) {
      const item = cartItems.find(
        (i) => (i.productId || i._id) === productId && i.unit === unit
      );
      return item ? item.quantity : 0;
    }
    return cartItems
      .filter((i) => (i.productId || i._id) === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const originalSubtotal = cartItems.reduce((acc, item) => acc + (item.originalPrice || item.price) * item.quantity, 0);
  const totalItemSavings = Math.max(0, originalSubtotal - subtotal);

  const FREE_DELIVERY_THRESHOLD = 299;
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : 25;
  const platformFee = subtotal > 0 ? 5 : 0;
  const amountNeededForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);

  // Apply Coupon
  const applyCoupon = async (code) => {
    setCouponError('');
    try {
      const { data } = await api.post('/coupons/validate', {
        code,
        orderAmount: subtotal
      });
      setCoupon({
        code: data.code,
        discount: data.discount,
        message: data.message
      });
      return { success: true, data };
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid coupon code';
      setCouponError(msg);
      return { success: false, message: msg };
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError('');
  };

  const couponDiscount = coupon ? coupon.discount : 0;
  const finalTotal = Math.max(0, subtotal + deliveryFee + platformFee + tipAmount - couponDiscount);
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getItemQuantity,
        totalItemsCount,
        subtotal,
        originalSubtotal,
        totalItemSavings,
        deliveryFee,
        platformFee,
        FREE_DELIVERY_THRESHOLD,
        amountNeededForFreeDelivery,
        tipAmount,
        setTipAmount,
        coupon,
        couponDiscount,
        couponError,
        applyCoupon,
        removeCoupon,
        finalTotal,
        isDrawerOpen,
        setIsDrawerOpen,
        toggleDrawer: () => setIsDrawerOpen((prev) => !prev)
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
