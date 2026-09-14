export type OrderStatus = "pending_payment" | "in_kitchen" | "ready" | "completed";

export interface MenuItem {
  id: number;
  name: string;
  category: string;
  rate: number;
  availability: number;
  top_item: number;
  image_ref_id: string;
}

export interface OrderWithItem {
  id: number;
  customer_name: string | null;
  menu_item_id: number;
  quantity: number;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  item_name: string;
  item_category: string;
  image_ref_id: string;
}
