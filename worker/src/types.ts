export type OrderStatus = "pending_payment" | "in_kitchen" | "ready" | "completed";

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
  rate: number; // price per unit, snapshotted at order time
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
}
