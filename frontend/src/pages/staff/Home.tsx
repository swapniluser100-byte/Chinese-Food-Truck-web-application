import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import type { MenuItem } from "../../types";
import { MenuButton } from "../../components/MenuButton";
import { MenuCard } from "../../components/MenuCard";
import { TopBar } from "../../components/TopBar";
import { useBranding } from "../../BrandingContext";

export function StaffHome() {
  const { settings } = useBranding();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getMenu()
      .then((r) => setMenu(r.items))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      api
        .searchMenu(q)
        .then((r) => setResults(r.items))
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  const byCategory = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    for (const item of menu) {
      const list = groups.get(item.category) ?? [];
      list.push(item);
      groups.set(item.category, list);
    }
    return [...groups.entries()];
  }, [menu]);

  return (
    <div className="pb-8">
      <TopBar
        title="Order Taking"
        tabs={[
          { to: "/staff", label: "Menu" },
          { to: "/staff/orders", label: "Active Orders" },
        ]}
      />

      <div className="p-4 space-y-3">
        <Link
          to="/staff/order"
          className="tap-target block w-full text-center py-3 rounded-xl bg-neutral-900 text-white font-semibold shadow"
        >
          + Start New Order (add multiple items)
        </Link>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menu (name or category)"
          className="w-full px-4 py-3 rounded-xl border border-neutral-300 text-base"
        />
      </div>

      {query.trim() ? (
        <div className="px-4 space-y-2">
          {results.length === 0 && <p className="text-neutral-500 text-sm">No matching items.</p>}
          {results.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="px-4 space-y-5">
          {loading && <p className="text-neutral-500 text-sm">Loading…</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {byCategory.map(([category, items]) => (
            <div key={category}>
              <h2 className="font-semibold text-neutral-600 mb-2">{category}</h2>
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${settings.menu_columns}, minmax(0, 1fr))` }}
              >
                {items.map((item) => (
                  <MenuButton key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="fixed bottom-4 right-4 flex flex-col gap-2 text-xs">
        <Link to="/kitchen" className="bg-neutral-800 text-white px-3 py-2 rounded-full shadow">
          Kitchen View
        </Link>
        <Link to="/admin" className="bg-neutral-800 text-white px-3 py-2 rounded-full shadow">
          Admin
        </Link>
      </div>
    </div>
  );
}
