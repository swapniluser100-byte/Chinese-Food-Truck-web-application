import { api } from "./api";
import type { OrderStatus } from "./types";

export type ActiveStatus = Exclude<OrderStatus, "completed" | "cancelled">;

export interface StageTheme {
  label: string;
  chip: string;
  count: string;
  tile: string;
  pillId: string;
  pillLabel: string;
  action?: string;
  actionClass?: string;
  run?: (id: number) => Promise<unknown>;
}

// Single source of truth for how each order status looks and what the
// "next step" button does — shared by Active Orders, Kitchen and Admin Orders.
export const STAGES: Record<OrderStatus, StageTheme> = {
  pending_payment: {
    label: "Payment Pending",
    chip: "bg-red-600",
    count: "bg-red-800/40",
    tile: "from-red-500 to-orange-600",
    pillId: "bg-red-600 text-white",
    pillLabel: "bg-red-500 text-white",
    action: "Confirm Payment",
    actionClass: "bg-green-600",
    run: api.startPreparation,
  },
  in_kitchen: {
    label: "Queued",
    chip: "bg-orange-500",
    count: "bg-orange-700/40",
    tile: "from-amber-300 to-orange-500",
    pillId: "bg-orange-500 text-white",
    pillLabel: "bg-amber-200 text-amber-900",
    action: "Start Cooking",
    actionClass: "bg-blue-600",
    run: api.startInKitchen,
  },
  in_progress: {
    label: "Cooking",
    chip: "bg-blue-600",
    count: "bg-blue-900/40",
    tile: "from-sky-400 to-blue-600",
    pillId: "bg-blue-600 text-white",
    pillLabel: "bg-blue-500 text-white",
    action: "Mark Ready",
    actionClass: "bg-green-600",
    run: api.markReady,
  },
  ready: {
    label: "Ready",
    chip: "bg-green-600",
    count: "bg-green-900/40",
    tile: "from-green-400 to-green-700",
    pillId: "bg-green-600 text-white",
    pillLabel: "bg-green-500 text-white",
    action: "Complete Order",
    actionClass: "bg-blue-600",
    run: api.completeOrder,
  },
  completed: {
    label: "Completed",
    chip: "bg-neutral-600",
    count: "bg-neutral-900/40",
    tile: "from-neutral-400 to-neutral-600",
    pillId: "bg-neutral-600 text-white",
    pillLabel: "bg-neutral-300 text-neutral-800",
  },
  cancelled: {
    label: "Cancelled",
    chip: "bg-neutral-500",
    count: "bg-neutral-800/40",
    tile: "from-neutral-300 to-neutral-500",
    pillId: "bg-neutral-500 text-white",
    pillLabel: "bg-red-100 text-red-800",
  },
};

export const STAGE_ORDER: ActiveStatus[] = ["pending_payment", "in_kitchen", "in_progress", "ready"];
