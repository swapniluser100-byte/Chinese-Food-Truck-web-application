import type { OrderStatus } from "../types";

const LABELS: Record<OrderStatus, { text: string; className: string }> = {
  pending_payment: { text: "Payment Pending", className: "bg-yellow-100 text-yellow-800" },
  in_kitchen: { text: "Queued", className: "bg-amber-100 text-amber-800" },
  in_progress: { text: "In Progress", className: "bg-blue-100 text-blue-800" },
  ready: { text: "Ready", className: "bg-green-100 text-green-800" },
  completed: { text: "Completed", className: "bg-neutral-200 text-neutral-600" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { text, className } = LABELS[status];
  return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${className}`}>{text}</span>;
}
