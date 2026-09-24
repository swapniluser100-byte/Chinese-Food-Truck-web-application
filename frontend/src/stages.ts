import { api } from "./api";
import type { OrderStatus } from "./types";

export type ActiveStatus = Exclude<OrderStatus, "completed" | "cancelled">;

export interface StageTheme {
  label: string;
  /** Solid brand color for the small status dot and the selected-chip fill. */
  dot: string;
  /** Tinted, low-saturation surface for the inactive chip and the order pill. */
  soft: string;
  /** Text color to pair with `soft`. */
  softText: string;
  /** Border color to pair with `soft`. */
  softBorder: string;
  /** Literal hover background class, paired with the soft surface. */
  hoverSoft: string;
  action?: string;
  actionClass?: string;
  run?: (id: number) => Promise<unknown>;
}

// Single source of truth for how each order status looks and what the
// "next step" button does — shared by Active Orders, Kitchen and Admin Orders.
// Tinted surfaces (soft/softText) keep the UI calm at a glance; the solid
// `dot` color is reserved for small accents and the active/selected state.
export const STAGES: Record<OrderStatus, StageTheme> = {
  pending_payment: {
    label: "Payment Pending",
    dot: "bg-amber-500",
    soft: "bg-amber-50",
    softText: "text-amber-800",
    softBorder: "border-amber-200",
    hoverSoft: "hover:bg-amber-50",
    action: "Confirm Payment",
    actionClass: "bg-emerald-600 hover:bg-emerald-700",
    run: api.startPreparation,
  },
  in_kitchen: {
    label: "Queued",
    dot: "bg-slate-500",
    soft: "bg-slate-100",
    softText: "text-slate-700",
    softBorder: "border-slate-200",
    hoverSoft: "hover:bg-slate-50",
    action: "Start Cooking",
    actionClass: "bg-blue-600 hover:bg-blue-700",
    run: api.startInKitchen,
  },
  in_progress: {
    label: "Cooking",
    dot: "bg-blue-500",
    soft: "bg-blue-50",
    softText: "text-blue-800",
    softBorder: "border-blue-200",
    hoverSoft: "hover:bg-blue-50",
    action: "Mark Ready",
    actionClass: "bg-emerald-600 hover:bg-emerald-700",
    run: api.markReady,
  },
  ready: {
    label: "Ready",
    dot: "bg-emerald-500",
    soft: "bg-emerald-50",
    softText: "text-emerald-800",
    softBorder: "border-emerald-200",
    hoverSoft: "hover:bg-emerald-50",
    action: "Complete Order",
    actionClass: "bg-blue-600 hover:bg-blue-700",
    run: api.completeOrder,
  },
  completed: {
    label: "Completed",
    dot: "bg-neutral-400",
    soft: "bg-neutral-100",
    softText: "text-neutral-600",
    softBorder: "border-neutral-200",
    hoverSoft: "hover:bg-neutral-50",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-red-400",
    soft: "bg-red-50",
    softText: "text-red-700",
    softBorder: "border-red-200",
    hoverSoft: "hover:bg-red-50",
  },
};

export const STAGE_ORDER: ActiveStatus[] = ["pending_payment", "in_kitchen", "in_progress", "ready"];
