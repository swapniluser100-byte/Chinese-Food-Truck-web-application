export type OrderStatus = "pending_payment" | "in_kitchen" | "in_progress" | "ready" | "completed";
export type OrderUnit = "half" | "full" | "gram";
export const ORDER_UNITS: OrderUnit[] = ["half", "full", "gram"];

export interface Env {
  DB: D1Database;
  MENU_IMAGES: R2Bucket;
  ADMIN_PASSWORD: string;
  TOKEN_SECRET: string;
  UPI_ID: string;
  UPI_PAYEE_NAME: string;
  SHEET_ID: string; // public Google Sheet tracking renewal dates per app_id
  RENEWAL_UPI_ID: string;
  RENEWAL_UPI_PAYEE_NAME: string;
}

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  rate: number; // price for a "full" order
  rate_half: number | null; // optional price for a "half" order; falls back to `rate` when unset
  availability: number; // 0 | 1
  top_item: number; // 0 | 1
  image_ref_id: string; // R2 object key, served via GET /api/images/:key
}

export interface Order {
  id: number;
  customer_name: string | null;
  instructions: string | null;
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
  menu_columns: number; // tiles per row on the Staff Home menu grid
  kitchen_columns: number; // tiles per row on the Kitchen board
  app_name: string; // fixed app identity for licensing — not editable via the admin API
  app_id: string; // fixed row key looked up in the renewal-tracking Google Sheet — not editable
}

export interface LicenseStatus {
  active: boolean;
  renewal_date: string | null; // YYYY-MM-DD
  amount: number | null;
  app_name: string;
  app_id: string;
}
