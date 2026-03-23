export type ProductionStatus = 
  | 'pending' 
  | 'proving' 
  | 'oven' 
  | 'cooling' 
  | 'ready_for_collection' 
  | 'out_for_delivery' 
  | 'awaiting_pickup' 
  | 'delivered' 
  | 'cancelled'
  | 'cancelled_and_refunded';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  fromStatus: ProductionStatus;
  toStatus: ProductionStatus;
  action: string;
}

export interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  unit: string;
  threshold: number;
  isCustomSource?: boolean;
}

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

export interface IngredientRequirement {
  ingredientId: string;
  quantity: number;
}

export interface Product {
  id: string;
  category: string;
  name: string;
  description: string;
  price: number;
  mrp?: number;
  discountPercentage?: number;
  weight: string;
  isEggless: boolean; 
  isAvailable: boolean;
  stockQuantity?: number;
  bakeTime?: string;
  allergens?: string[];
  images?: string[];
  ingredients?: string[]; // Names for display
  ingredientRequirements?: IngredientRequirement[]; // For inventory tracking
  shelfLife?: string;
  storage?: string;
  pairings?: string[];
  isBestSeller?: boolean;
  isNew?: boolean;
  variants?: Variant[];
  customizationGroups?: CustomizationGroup[];
  isSeasonal?: boolean;
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
  role: 'admin' | 'customer' | 'baker';
  points: number;
  createdAt: string; 
  addresses?: Address[];
  phone?: string;
  photoURL?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[]; 
  total: number;
  status: ProductionStatus;
  auditTrail?: AuditLog[];
  createdAt: string; 
  deliveryDate: string; 
  deliverySlot: string;
  customer: { name: string; phone: string; email: string; };
  address: { street: string; instructions?: string; label?: string; };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed';
  giftWrap?: boolean;
  riderName?: string;
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
  product: Product; 
  variant: Variant;
  quantity: number;
  customizations?: SelectedCustomization[];
  specialRequest?: string;
  isGiftWrap?: boolean;
  giftMessage?: string;
  deliveryDate?: string; 
  deliverySlot?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order_status' | 'promotion' | 'system' | 'inventory_alert';
  read: boolean;
  createdAt: string; 
  orderId?: string;
}