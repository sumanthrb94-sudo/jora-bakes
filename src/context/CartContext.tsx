import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { CartItem, Product, Variant, SelectedCustomization } from '../types';
import toast from 'react-hot-toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    product: Product, 
    quantity: number, 
    variant: Variant, 
    specialRequest?: string,
    customizations?: SelectedCustomization[],
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
    const savedCart = localStorage.getItem('jora_cart');
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        return parsed.map((item: CartItem) => ({
          ...item,
          deliveryDate: new Date(item.deliveryDate)
        }));
      } catch (error) {
        console.error('Corrupted cart data found, resetting to empty array', error);
        return [];
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('jora_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (
    product: Product, 
    quantity: number, 
    variant: Variant, 
    specialRequest?: string,
    customizations?: SelectedCustomization[]
  ) => {
    const isExisting = cart.some(
      (item) => 
        item.product.id === product.id && 
        item.variant.id === variant.id &&
        (item.specialRequest || '').trim().toLowerCase() === (specialRequest || '').trim().toLowerCase() &&
        JSON.stringify(item.customizations || []) === JSON.stringify(customizations || [])
    );

    if (isExisting) {
      toast.success(`Updated quantity for ${product.name}!`);
    } else {
      toast.success(`${product.name} added to your box!`);
    }

    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex(
        (item) => 
          item.product.id === product.id && 
          item.variant.id === variant.id &&
          (item.specialRequest || '').trim().toLowerCase() === (specialRequest || '').trim().toLowerCase() &&
          JSON.stringify(item.customizations || []) === JSON.stringify(customizations || [])
      );

      if (existingItemIndex >= 0) {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      }

      return [
        ...prevCart,
        {
          id: `${product.id}-${variant.id}-${Date.now()}`, // More robust unique ID
          product,
          variant,
          quantity,
          customizations: customizations || [],
          specialRequest: (specialRequest || '').trim(),
          isGiftWrap: false,
          giftMessage: '',
          deliveryDate: new Date(),
          deliverySlot: '',
        },
      ];
    });
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
      const customPrice = (item.customizations || []).reduce((sum, c) => sum + c.price, 0);
      const giftWrapFee = item.isGiftWrap ? 100 : 0;
      return total + (itemPrice + customPrice + giftWrapFee) * item.quantity;
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
