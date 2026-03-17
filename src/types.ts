// c:\Users\91779\OneDrive\Desktop\JORA-BAKES\jora-bakes\src\types.ts

// Assuming this structure from firebase-blueprint.json
export interface Product {
  id: string;
  category: 'cakes' | 'brownies' | 'cookies' | 'bread' | 'loaves' | 'custom';
  name: string;
  description: string;
  price: number;
  weight?: string;
  isEggless?: boolean;
  isAvailable: boolean;
  bakeTime?: string;
  allergens?: string[];
  images?: string[];
  ingredients?: string[];
  shelfLife?: string;
  storage?: string;
  pairings?: string[];
  isBestSeller?: boolean;
  isNew?: boolean;
}

export interface Address {
  id: string;
  label: 'Home' | 'Office' | 'Gift' | 'Other';
  street: string;
  city: string;
  pincode: string;
  instructions?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  points: number;
  createdAt: string; // ISO string
  addresses?: Address[];
  phone?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: any[]; // You might want to define a more specific type for order items
  total: number;
  status: 'received' | 'confirmed' | 'baking' | 'quality_check' | 'out_for_delivery' | 'delivered';
  createdAt: string; // ISO string
  deliveryDate: string; // Date string
  deliverySlot: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_status' | 'promotion' | 'system';
  read: boolean;
  createdAt: string; // ISO string
  orderId?: string;
}