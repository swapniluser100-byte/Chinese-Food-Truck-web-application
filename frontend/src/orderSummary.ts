import type { OrderWithItems } from "./types";
import { ORDER_UNITS } from "./types";

function unitLabel(unit: string): string {
  return ORDER_UNITS.find((u) => u.value === unit)?.label ?? unit;
}

interface LineLike {
  item_name: string;
  quantity: number;
  unit: string;
  grams?: number | null;
}

// "250g × Chicken Manchurian" for gram lines, "2 × Chicken Manchurian (Full)" otherwise.
export function formatOrderLine(line: LineLike): string {
  if (line.unit === "gram" && line.grams) {
    return `${line.grams}g × ${line.item_name}`;
  }
  return `${line.quantity} × ${line.item_name} (${unitLabel(line.unit)})`;
}

export function summarizeItems(order: OrderWithItems): string {
  return order.items.map((line) => formatOrderLine(line)).join(", ");
}
