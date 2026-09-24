import type { OrderStatus } from "../types";
import { STAGES } from "../stages";

interface Props {
  stages: OrderStatus[];
  counts: Partial<Record<OrderStatus, number>>;
  filter: OrderStatus | null;
  onChange: (next: OrderStatus | null) => void;
}

// Status filter tabs: a calm tinted surface at rest, filled solid only when
// selected — keeps the bar readable instead of four loud blocks competing
// for attention. Tap one to filter, tap again to clear.
export function StageChips({ stages, counts, filter, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {stages.map((s) => {
        const t = STAGES[s];
        const active = filter === s;
        return (
          <button
            key={s}
            onClick={() => onChange(active ? null : s)}
            aria-pressed={active}
            className={`tap-target flex-1 min-w-[130px] flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-sm font-semibold leading-tight transition ${
              active
                ? `${t.dot} text-white border-transparent shadow-sm`
                : `bg-white ${t.softText} ${t.softBorder} ${t.hoverSoft}`
            }`}
          >
            {!active && <span className={`w-2 h-2 rounded-full flex-shrink-0 ${t.dot}`} />}
            <span className="text-center">{t.label}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                active ? "bg-white/25 text-white" : `${t.soft} ${t.softText}`
              }`}
            >
              {counts[s] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}
