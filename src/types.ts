// c:\Users\91779\OneDrive\Desktop\JORA-BAKES\jora-bakes\src\types.ts

// Assuming this structure from firebase-blueprint.json

export interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
  isBestSeller?: boolean;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  required: boolean;
  selectionType: 'single' | 'multiple';
  options: CustomizationOption[];
}

export interface SelectedCustomization {
  groupName: string;
  optionName: string;
  price: number;
}

export interface Variant {
  id: string;
  flavor: string;
  priceModifier: number;
  weight: string;
}

export interface Product {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  weight: string;
  isEggless: boolean; // Now always true
  isAvailable: boolean;
  stockQuantity?: number;
  bakeTime?: string;
  allergens?: string[];
  images?: string[];
  ingredients?: string[];
  shelfLife?: string;
  storage?: string;
  pairings?: string[];
  isBestSeller?: boolean;
  isNew?: boolean;
  variants?: Variant[];
  customizationGroups?: CustomizationGroup[];
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
  photoURL?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[]; // Changed to use OrderItem interface
  total: number;
  status: 'received' | 'confirmed' | 'baking' | 'quality_check' | 'out_for_delivery' | 'delivered';
  createdAt: string; // ISO string
  deliveryDate: string; // Date string
  deliverySlot: string;
  customer: { name: string; phone: string; email: string; };
  address: { street: string; instructions?: string; label?: string; };
  paymentMethod: string;
  giftWrap?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  variant: Variant;
  quantity: number;
  customizations?: SelectedCustomization[];
  specialRequest?: string;
  isGiftWrap?: boolean;
  giftMessage?: string;
  deliveryDate?: Date;
  deliverySlot?: string;
}

export interface OrderItem {
  id: string;
  product: Product; // Full product details at the time of order
  variant: Variant;
  quantity: number;
  customizations?: SelectedCustomization[];
  specialRequest?: string;
  isGiftWrap?: boolean;
  giftMessage?: string;
  deliveryDate?: string; // ISO string
  deliverySlot?: string;
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