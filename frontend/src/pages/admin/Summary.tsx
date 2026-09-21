import { useEffect, useState } from "react";
import { api } from "../../api";
import type { OrderStatus } from "../../types";
import { STAGES } from "../../stages";

const todayIso = () => new Date().toISOString().slice(0, 10);

export function AdminSummary() {
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof api.adminSummary>> | null>(null);

  async function load() {
    try {
      const data = await api.adminSummary(date);
      setSummary(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function handleExport() {
    setExporting(true);
    setError("");
    try {
      const blob = await api.adminExportCsv(date);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex gap-2 items-center">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field flex-1" />
        <button onClick={handleExport} disabled={exporting} className="tap-target px-4 py-3 rounded-xl bg-neutral-700 text-white font-semibold disabled:opacity-50">
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {summary && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200 text-center">
              <div className="text-2xl font-bold text-brand-600">₹{summary.totals.total_sales}</div>
              <div className="text-xs text-neutral-500">Total Sales</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200 text-center">
              <div className="text-2xl font-bold">{summary.totals.order_count}</div>
              <div className="text-xs text-neutral-500">Completed Orders</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200 text-center">
              <div className="text-2xl font-bold">{summary.totals.items_sold}</div>
              <div className="text-xs text-neutral-500">Items Sold</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <h3 className="font-semibold mb-2">Orders by Status</h3>
            <div className="flex gap-3 flex-wrap">
              {summary.byStatus.map((s) => (
                <div key={s.status} className="inline-flex rounded-full overflow-hidden text-sm font-bold">
                  <span className={`${STAGES[s.status as OrderStatus]?.pillId ?? "bg-neutral-600 text-white"} px-3 py-1`}>{s.count}</span>
                  <span className={`${STAGES[s.status as OrderStatus]?.pillLabel ?? "bg-neutral-200"} px-3 py-1`}>
                    {STAGES[s.status as OrderStatus]?.label ?? s.status}
                  </span>
                </div>
              ))}
              {summary.byStatus.length === 0 && <p className="text-sm text-neutral-500">No orders yet.</p>}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-200">
            <h3 className="font-semibold mb-2">Sales by Item (completed orders)</h3>
            <div className="space-y-1">
              {summary.byItem.map((row) => (
                <div key={row.item_name} className="flex justify-between text-sm border-b border-neutral-100 py-1 last:border-0">
                  <span>
                    {row.item_name} × {row.quantity}
                  </span>
                  <span className="font-semibold">₹{row.revenue}</span>
                </div>
              ))}
              {summary.byItem.length === 0 && <p className="text-sm text-neutral-500">No completed sales yet.</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
