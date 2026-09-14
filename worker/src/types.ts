export type OrderStatus = "pending_payment" | "in_kitchen" | "ready" | "completed";
export type OrderUnit = "half" | "full" | "gram";
export const ORDER_UNITS: OrderUnit[] = ["half", "full", "gram"];

export interface Env {
  DB: D1Database;
  ADMIN_PASSWORD: string;
  TOKEN_SECRET: string;
  UPI_ID: string;
  UPI_PAYEE_NAME: string;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  rate: number;
  availability: number; // 0 | 1
  top_item: number; // 0 | 1
  image_ref_id: string;
}

export interface Order {
  id: number;
  customer_name: string | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  rate: number; // auto-filled from the menu item, editable by staff per line
  unit: OrderUnit;
  grams: number | null; // set when unit === 'gram'
}

export interface OrderItemWithMenu extends OrderItem {
  item_name: string;
  item_category: string;
  image_ref_id: string;
}

export interface OrderWithItems extends Order {
  items: OrderItemWithMenu[];
}

export interface NewOrderItemInput {
  menu_item_id: number;
  quantity: number;
  rate: number;
  unit: OrderUnit;
  grams?: number;
}

export interface Settings {
  id: 1;
  name: string;
  slogan: string | null;
  logo_data_url: string | null;
}
