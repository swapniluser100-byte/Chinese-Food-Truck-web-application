import type { OrderWithItems } from "./types";
import { ORDER_UNITS } from "./types";

function unitLabel(unit: string): string {
  return ORDER_UNITS.find((u) => u.value === unit)?.label ?? unit;
}

export function summarizeItems(order: OrderWithItems): string {
  return order.items.map((line) => `${line.quantity} × ${line.item_name} (${unitLabel(line.unit)})`).join(", ");
}
