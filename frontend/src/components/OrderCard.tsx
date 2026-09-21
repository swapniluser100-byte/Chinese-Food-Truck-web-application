import type { OrderWithItems } from "../types";
import { formatOrderLine } from "../orderSummary";
import { STAGES } from "../stages";
import { MenuImage } from "./MenuImage";

interface Props {
  order: OrderWithItems;
  busy?: boolean;
  /** Runs the "next step" for this order's stage (Confirm Payment, Start Cooking, ...). */
  onAdvance?: () => void;
  onCancel?: () => void;
  showPrice?: boolean;
  showTime?: boolean;
  compact?: boolean;
}

export function OrderCard({ order, busy, onAdvance, onCancel, showPrice = true, showTime, compact }: Props) {
  const t = STAGES[order.status];
  const first = order.items[0];
  const hasFooter = showPrice || onAdvance || onCancel;
  const pill = compact ? (
    <div className="flex flex-col items-start gap-1 text-xs font-bold flex-1 min-w-0">
      <span className={`${t.pillId} rounded-full px-2.5 py-0.5 max-w-full truncate`}>#{order.id}</span>
      <span className={`${t.pillLabel} rounded-full px-2.5 py-0.5 max-w-full truncate`}>{t.label}</span>
    </div>
  ) : (
    <div className="inline-flex rounded-full overflow-hidden text-sm font-bold max-w-full">
      <span className={`${t.pillId} px-3 py-1`}>#{order.id}</span>
      <span className={`${t.pillLabel} px-3 py-1 whitespace-nowrap`}>{t.label}</span>
    </div>
  );
  const btn = compact ? "px-3 py-2 text-sm" : "px-4 py-2.5";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
      <div className={compact ? "p-3" : "flex gap-4 p-4"}>
        <div className={compact ? "flex items-center gap-2.5 mb-2" : "flex-shrink-0"}>
          <div
            className={`${compact ? "w-14 h-14" : "w-24 h-24"} flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br ${t.tile} p-1.5`}
          >
            {first && (
              <MenuImage
                imageRefId={first.image_ref_id}
                category={first.item_category}
                name={first.item_name}
                className="w-full h-full object-cover rounded-lg"
              />
            )}
          </div>
          {compact && pill}
        </div>

        <div className="flex-1 min-w-0 break-words">
          {!compact && pill}
          <ul className={`${compact ? "" : "mt-2 "}space-y-0.5`}>
            {order.items.map((line) => (
              <li key={line.id} className="text-neutral-800 leading-tight">
                {formatOrderLine(line)}
              </li>
            ))}
          </ul>
          {order.customer_name && <div className="text-sm text-neutral-500">{order.customer_name}</div>}
          {order.instructions && <div className="text-xs text-amber-700">Note: {order.instructions}</div>}
          {showTime && <div className="text-xs text-neutral-400 mt-0.5">{new Date(order.created_at).toLocaleString()}</div>}
        </div>
      </div>

      {hasFooter && (
        <div className="flex items-center flex-wrap gap-2 px-4 py-3 mt-auto bg-neutral-50 border-t border-neutral-200">
          {showPrice && <span className="text-xl font-semibold text-neutral-700 mr-auto">₹{order.total_amount}</span>}
          {onAdvance && t.action && (
            <button
              onClick={onAdvance}
              disabled={busy}
              className={`tap-target ${t.actionClass} text-white ${btn} rounded-lg font-semibold disabled:opacity-50 ${
                showPrice ? "" : "flex-1"
              }`}
            >
              {busy ? "…" : t.action}
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={busy}
              className={`tap-target bg-neutral-600 text-white ${btn} rounded-lg font-semibold disabled:opacity-50`}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
