export type OrderStatus = "pending_payment" | "in_kitchen" | "in_progress" | "ready" | "completed";
export type OrderUnit = "half" | "full" | "gram";

export const ORDER_UNITS: { value: OrderUnit; label: string }[] = [
  { value: "half", label: "Half" },
  { value: "full", label: "Full" },
  { value: "gram", label: "Gram" },
];

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  rate: number;
  rate_half: number | null;
  availability: number;
  top_item: number;
  image_ref_id: string;
}

export interface OrderItemWithMenu {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  rate: number;
  unit: OrderUnit;
  grams: number | null;
  item_name: string;
  item_category: string;
  image_ref_id: string;
}

export interface OrderWithItems {
  id: number;
  customer_name: string | null;
  instructions: string | null;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  items: OrderItemWithMenu[];
}

export interface Settings {
  name: string;
  slogan: string | null;
  logo_data_url: string | null;
  menu_columns: number;
  kitchen_columns: number;
  app_name: string;
  app_id: string;
}

export interface LicenseStatus {
  active: boolean;
  renewal_date: string | null;
  amount: number | null;
  app_name: string;
  app_id: string;
}
