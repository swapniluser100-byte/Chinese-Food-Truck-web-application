import { useEffect, useState } from "react";
import { api } from "../../api";
import type { MenuItem } from "../../types";

const EMPTY_FORM = { name: "", category: "", rate: 0, image_ref_id: "", availability: 1, top_item: 0 };

export function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      const { items } = await api.adminGetMenu();
      setItems(items);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      rate: item.rate,
      image_ref_id: item.image_ref_id,
      availability: item.availability,
      top_item: item.top_item,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.adminUpdateMenuItem(editingId, form);
      } else {
        await api.adminCreateMenuItem(form);
      }
      resetForm();
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    try {
      await api.adminDeleteMenuItem(id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function toggleField(item: MenuItem, field: "availability" | "top_item") {
    try {
      await api.adminUpdateMenuItem(item.id, { [field]: item[field] ? 0 : 1 });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto">
      {error && <p className="text-red-600 text-sm">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200 space-y-3">
        <h2 className="font-semibold">{editingId ? `Edit Item #${editingId}` : "Add New Item"}</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="col-span-2 px-3 py-2 rounded-lg border border-neutral-300"
          />
          <input
            required
            placeholder="Category (e.g. Rice)"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="px-3 py-2 rounded-lg border border-neutral-300"
          />
          <input
            required
            type="number"
            min={0}
            placeholder="Rate (₹)"
            value={form.rate || ""}
            onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
            className="px-3 py-2 rounded-lg border border-neutral-300"
          />
          <input
            required
            placeholder="Image ref id"
            value={form.image_ref_id}
            onChange={(e) => setForm({ ...form, image_ref_id: e.target.value })}
            className="col-span-2 px-3 py-2 rounded-lg border border-neutral-300"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.availability}
              onChange={(e) => setForm({ ...form, availability: e.target.checked ? 1 : 0 })}
            />
            Available
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!form.top_item}
              onChange={(e) => setForm({ ...form, top_item: e.target.checked ? 1 : 0 })}
            />
            Top 10 item
          </label>
        </div>
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="flex-1 py-2 rounded-lg bg-brand-500 text-white font-semibold disabled:opacity-50">
            {saving ? "Saving…" : editingId ? "Save Changes" : "Add Item"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg bg-neutral-200">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-3 shadow-sm border border-neutral-200 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.name}</div>
              <div className="text-xs text-neutral-500">
                {item.category} · ₹{item.rate}
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => toggleField(item, "availability")}
                  className={`text-xs px-2 py-0.5 rounded-full ${item.availability ? "bg-green-100 text-green-700" : "bg-neutral-200 text-neutral-500"}`}
                >
                  {item.availability ? "Available" : "Unavailable"}
                </button>
                <button
                  onClick={() => toggleField(item, "top_item")}
                  className={`text-xs px-2 py-0.5 rounded-full ${item.top_item ? "bg-blue-100 text-blue-700" : "bg-neutral-200 text-neutral-500"}`}
                >
                  {item.top_item ? "Top 10" : "Not top"}
                </button>
              </div>
            </div>
            <button onClick={() => startEdit(item)} className="text-sm px-3 py-1.5 rounded-lg bg-neutral-200">
              Edit
            </button>
            <button onClick={() => handleDelete(item.id)} className="text-sm px-3 py-1.5 rounded-lg bg-red-100 text-red-700">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
