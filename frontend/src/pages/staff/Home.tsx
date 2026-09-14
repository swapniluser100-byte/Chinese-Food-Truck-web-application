import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import type { MenuItem } from "../../types";
import { MenuButton } from "../../components/MenuButton";
import { MenuCard } from "../../components/MenuCard";
import { TopBar } from "../../components/TopBar";

export function StaffHome() {
  const [topItems, setTopItems] = useState<MenuItem[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getTopMenu()
      .then((r) => setTopItems(r.items))
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

  return (
    <div className="pb-8">
      <TopBar
        title="Order Taking"
        tabs={[
          { to: "/staff", label: "Menu" },
          { to: "/staff/orders", label: "Active Orders", marathi: "ऑर्डर्स" },
        ]}
      />

      <div className="p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search menu (name or category) / मेनू शोधा"
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
        <div className="px-4">
          <h2 className="font-semibold text-neutral-600 mb-2">Top Items / लोकप्रिय पदार्थ</h2>
          {loading && <p className="text-neutral-500 text-sm">Loading…</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            {topItems.map((item) => (
              <MenuButton key={item.id} item={item} />
            ))}
          </div>
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
