import type { OrderWithItems } from "./types";

export function summarizeItems(order: OrderWithItems): string {
  return order.items.map((line) => `${line.quantity} × ${line.item_name}`).join(", ");
}
