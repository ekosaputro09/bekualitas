
export interface MenuItem {
  id: string;
  name: string;
  price: number;
  stock: number;
  description?: string;
  isActive: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  yieldInfo: string; // e.g. "7.8 kg / 50 pack"
  ingredients: string; // Multi-line text for flexibility
  lastUpdated: number;
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string; // e.g., 'kg', 'gr', 'pcs', 'ml'
  lastUpdated: number;
}

export interface POSession {
  id: string;
  name: string; // e.g., "PO Batch 1 - Jan 2024"
  startDate: number;
  endDate?: number;
  status: 'OPEN' | 'CLOSED';
}

export interface OrderItem {
  menuId: string;
  menuName: string;
  quantity: number;
  priceAtOrder: number;
}

export interface Order {
  id: string;
  sessionId: string; // Link to POSession
  customerName: string;
  source?: string;
  items: OrderItem[];
  totalPrice: number;
  timestamp: number;
  note?: string;
  adjustmentAmount?: number;
  isPaid: boolean;
  paymentMethod?: string;
  paymentDate?: number;
}

export interface AppState {
  menu: MenuItem[];
  orders: Order[];
  sessions: POSession[];
  recipes: Recipe[];
  ingredients: Ingredient[];
}

export enum Tab {
  DASHBOARD = 'DASHBOARD',
  MENU = 'MENU',
  RECIPES = 'RECIPES',
  INGREDIENTS = 'INGREDIENTS',
  ORDER_ENTRY = 'ORDER_ENTRY',
  ORDER_LIST = 'ORDER_LIST',
  BALANCE = 'BALANCE',
  MARKETING = 'MARKETING',
}
