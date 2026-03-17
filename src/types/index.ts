export interface Variant {
  id: string;
  flavor: string;
  priceModifier: number;
  weight: string;
}

export interface Product {
  id: string;
  category: 'cakes' | 'brownies' | 'cookies' | 'bread' | 'loaves' | 'custom';
  name: string;
  description: string;
  price: number;
  weight: string;
  variants: Variant[];
  isEggless: boolean;
  isAvailable: boolean;
  bakeTime: string;
  allergens: string[];
  images: string[];
  ingredients: string[];
  shelfLife: string;
  storage: string;
  pairings: string[];
  isBestSeller: boolean;
  isNew: boolean;
}

export interface Customer {
  name: string;
  phone: string;
  email: string;
}

export interface CartItem {
  id: string;
  product: Product;
  variant: Variant;
  quantity: number;
  specialRequest?: string;
  isGiftWrap: boolean;
  giftMessage?: string;
  deliveryDate: Date;
  deliverySlot: string;
}

export interface User {
  name: string;
  phone: string;
  email: string;
  birthday?: string;
  addresses: Address[];
  points: number;
  preferences: {
    dietaryRestrictions: string[];
  };
}

export interface Address {
  id: string;
  label: 'Home' | 'Office' | 'Gift' | 'Other';
  street: string;
  city: string;
  pincode: string;
  instructions?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  customer: Customer;
  address: Address;
  status: 'received' | 'confirmed' | 'baking' | 'quality_check' | 'out_for_delivery' | 'delivered';
  deliveryDate: Date;
  deliverySlot: string;
  total: number;
  paymentMethod: 'cod' | 'online';
  loyaltyPointsEarned: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_status' | 'promotion' | 'system';
  read: boolean;
  createdAt: string;
  orderId?: string;
}
