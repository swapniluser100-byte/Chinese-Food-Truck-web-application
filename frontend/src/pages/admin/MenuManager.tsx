import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../api";
import type { MenuItem } from "../../types";
import { MenuImage } from "../../components/MenuImage";

const ADD_NEW_CATEGORY = "__add_new_category__";

const EMPTY_FORM = {
  name: "",
  category: "",
  rate: 0,
  rate_half: "" as number | "",
  image_ref_id: "",
  availability: 1,
  top_item: 0,
};

export function MenuManager() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category))].sort((a, b) => a.localeCompare(b)),
    [items]
  );

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
    setAddingCategory(false);
    setForm({
      name: item.name,
      category: item.category,
      rate: item.rate,
      rate_half: item.rate_half ?? "",
      image_ref_id: item.image_ref_id,
      availability: item.availability,
      top_item: item.top_item,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setAddingCategory(false);
    setForm(EMPTY_FORM);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleCategorySelect(value: string) {
    if (value === ADD_NEW_CATEGORY) {
      setAddingCategory(true);
      setForm((f) => ({ ...f, category: "" }));
    } else {
      setForm((f) => ({ ...f, category: value }));
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const { key } = await api.adminUploadImage(file);
      setForm((f) => ({ ...f, image_ref_id: key }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form, rate_half: form.rate_half === "" ? null : form.rate_half };
      if (editingId) {
        await api.adminUpdateMenuItem(editingId, payload);
      } else {
        await api.adminCreateMenuItem(payload);
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

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <h2 className="font-bold px-4 py-3 bg-neutral-50 border-b border-neutral-200">{editingId ? `Edit Item #${editingId}` : "Add New Item"}</h2>
        <div className="p-4 space-y-3">

        <div className="flex items-center gap-3">
          <MenuImage
            imageRefId={form.image_ref_id}
            category={form.category}
            name={form.name || "Menu item"}
            className="w-16 h-16 rounded-xl object-cover border border-neutral-200 flex-shrink-0"
          />
          <div className="flex flex-col gap-1">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="text-sm" />
            {uploading && <span className="text-xs text-neutral-500">Uploading…</span>}
            <span className="text-xs text-neutral-400">JPEG, PNG, WEBP, or GIF. Max 5MB.</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="field col-span-2"
          />
          {addingCategory || categories.length === 0 ? (
            <div className="col-span-2 flex gap-2">
              <input
                required
                autoFocus
                placeholder="New category name"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="field flex-1"
              />
              {categories.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setAddingCategory(false);
                    setForm((f) => ({ ...f, category: categories[0] }));
                  }}
                  className="tap-target px-3 py-2 rounded-lg bg-neutral-500 hover:bg-neutral-600 text-white text-sm font-semibold"
                >
                  Cancel
                </button>
              )}
            </div>
          ) : (
            <select
              required
              value={form.category}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="field col-span-2"
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={ADD_NEW_CATEGORY}>+ Add new category</option>
            </select>
          )}
          <input
            required
            type="number"
            min={0}
            placeholder="Full Rate (₹)"
            value={form.rate || ""}
            onChange={(e) => setForm({ ...form, rate: Number(e.target.value) })}
            className="field"
          />
          <input
            type="number"
            min={0}
            placeholder="Half Rate (₹)"
            value={form.rate_half}
            onChange={(e) => setForm({ ...form, rate_half: e.target.value === "" ? "" : Number(e.target.value) })}
            className="field"
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
        </div>
        <div className="flex gap-2 px-4 py-3 bg-neutral-50 border-t border-neutral-200">
          <button
            type="submit"
            disabled={saving || uploading || !form.image_ref_id}
            className="tap-target flex-1 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-semibold disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving…" : editingId ? "Save Changes" : "Add Item"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="tap-target px-4 py-2 rounded-lg bg-neutral-500 hover:bg-neutral-600 text-white font-semibold">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl p-3 shadow-sm border border-neutral-200 flex items-center gap-3">
            <MenuImage
              imageRefId={item.image_ref_id}
              category={item.category}
              name={item.name}
              className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.name}</div>
              <div className="text-xs text-neutral-500">
                {item.category} · Full ₹{item.rate}
                {item.rate_half ? ` · Half ₹${item.rate_half}` : ""}
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => toggleField(item, "availability")}
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.availability ? "bg-green-600 text-white" : "bg-neutral-300 text-neutral-700"}`}
                >
                  {item.availability ? "Available" : "Unavailable"}
                </button>
                <button
                  onClick={() => toggleField(item, "top_item")}
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.top_item ? "bg-blue-600 text-white" : "bg-neutral-300 text-neutral-700"}`}
                >
                  {item.top_item ? "Top 10" : "Not top"}
                </button>
              </div>
            </div>
            <button onClick={() => startEdit(item)} className="tap-target text-sm font-semibold px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white">
              Edit
            </button>
            <button onClick={() => handleDelete(item.id)} className="tap-target text-sm font-semibold px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white">
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
