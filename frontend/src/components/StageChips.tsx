import type { OrderStatus } from "../types";
import { STAGES } from "../stages";

interface Props {
  stages: OrderStatus[];
  counts: Partial<Record<OrderStatus, number>>;
  filter: OrderStatus | null;
  onChange: (next: OrderStatus | null) => void;
}

// Coloured status tabs with live counts; tap one to filter, tap again to clear.
export function StageChips({ stages, counts, filter, onChange }: Props) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
      {stages.map((s) => {
        const t = STAGES[s];
        const active = filter === s;
        return (
          <button
            key={s}
            onClick={() => onChange(active ? null : s)}
            aria-pressed={active}
            className={`tap-target ${t.chip} text-white rounded-xl px-2 py-3 text-sm sm:text-base font-bold shadow flex items-center justify-center gap-2 transition ${
              filter && !active ? "opacity-50" : ""
            } ${active ? "ring-4 ring-neutral-900/20" : ""}`}
          >
            <span className="truncate">{t.label}</span>
            <span className={`${t.count} rounded-full px-2 py-0.5 text-sm`}>{counts[s] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}
