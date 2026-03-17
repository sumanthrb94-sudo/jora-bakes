import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { CartItem, Product, Variant } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product, 
    quantity: number, 
    variant: Variant, 
    specialRequest?: string,
    isGiftWrap?: boolean,
    giftMessage?: string,
    deliveryDate?: Date,
    deliverySlot?: string
  ) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  updateItemDetails: (cartItemId: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('zora_cart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      return parsed.map((item: any) => ({
        ...item,
        deliveryDate: new Date(item.deliveryDate)
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('zora_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (
    product: Product, 
    quantity: number, 
    variant: Variant, 
    specialRequest?: string,
    isGiftWrap = false,
    giftMessage?: string,
    deliveryDate = new Date(),
    deliverySlot = '10 AM - 1 PM'
  ) => {
    let isNew = true;
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => 
          item.product.id === product.id && 
          item.variant.id === variant.id && 
          item.specialRequest === specialRequest &&
          item.isGiftWrap === isGiftWrap &&
          item.giftMessage === giftMessage &&
          item.deliveryDate.toDateString() === deliveryDate.toDateString() &&
          item.deliverySlot === deliverySlot
      );

      if (existingItemIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        isNew = false;
        return newCart;
      }

      return [
        ...prevCart,
        {
          id: Math.random().toString(36).substr(2, 9),
          product,
          variant,
          quantity,
          specialRequest,
          isGiftWrap,
          giftMessage,
          deliveryDate,
          deliverySlot,
        },
      ];
    });

    if (isNew) {
      toast.success(`Zora is packing your ${product.name}!`);
    } else {
      toast.success(`Added more ${product.name} to your box!`);
    }
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== cartItemId));
    toast.success('Treat removed from your box');
  };

  const updateQuantity = (cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === cartItemId ? { ...item, quantity } : item))
    );
  };

  const updateItemDetails = (cartItemId: string, updates: Partial<CartItem>) => {
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === cartItemId ? { ...item, ...updates } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const itemPrice = item.product.price + item.variant.priceModifier;
      const giftWrapFee = item.isGiftWrap ? 100 : 0;
      return total + (itemPrice + giftWrapFee) * item.quantity;
    }, 0);
  }, [cart]);

  const cartCount = useMemo(() => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  }, [cart]);

  const value = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemDetails,
    clearCart,
    cartTotal,
    cartCount
  }), [cart, cartTotal, cartCount]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
