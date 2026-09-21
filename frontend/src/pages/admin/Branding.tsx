import { useEffect, useRef, useState } from "react";
import { api } from "../../api";
import { useBranding } from "../../BrandingContext";

const MAX_LOGO_FILE_BYTES = 1_000_000; // 1MB — keep the D1-stored data URL small

export function AdminBranding() {
  const { settings, refresh } = useBranding();
  const [name, setName] = useState(settings.name);
  const [slogan, setSlogan] = useState(settings.slogan ?? "");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(settings.logo_data_url);
  const [menuColumns, setMenuColumns] = useState(settings.menu_columns);
  const [kitchenColumns, setKitchenColumns] = useState(settings.kitchen_columns);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(settings.name);
    setSlogan(settings.slogan ?? "");
    setLogoDataUrl(settings.logo_data_url);
    setMenuColumns(settings.menu_columns);
    setKitchenColumns(settings.kitchen_columns);
  }, [settings]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file");
      return;
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      setError("Logo file is too large — please use an image under 1MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.onerror = () => setError("Could not read that image file");
    reader.readAsDataURL(file);
  }

  function removeLogo() {
    setLogoDataUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      await api.adminUpdateSettings({
        name: name.trim(),
        slogan: slogan.trim() || null,
        logo_data_url: logoDataUrl,
        menu_columns: menuColumns,
        kitchen_columns: kitchenColumns,
      });
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
        <h2 className="font-bold px-4 py-3 bg-neutral-50 border-b border-neutral-200">App Branding</h2>
        <div className="p-4 space-y-4">

        <div>
          <label className="block text-sm font-medium mb-1">Business Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Wok On Wheels"
            className="field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slogan (optional)</label>
          <input
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            placeholder="e.g. Hot noodles, fast wheels"
            className="field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Logo (optional)</label>
          <div className="flex items-center gap-3">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Logo preview" className="w-16 h-16 rounded-xl object-cover border border-neutral-200" />
            ) : (
              <div className="w-16 h-16 rounded-xl border border-dashed border-neutral-300 flex items-center justify-center text-2xl">
                🥡
              </div>
            )}
            <div className="flex flex-col gap-1">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoChange} className="text-sm" />
              {logoDataUrl && (
                <button type="button" onClick={removeLogo} className="text-xs text-red-600 text-left underline">
                  Remove logo
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-neutral-400 mt-1">Square images work best. Max 1MB.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Home tiles per row</label>
            <select
              value={menuColumns}
              onChange={(e) => setMenuColumns(Number(e.target.value))}
              className="field"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Kitchen tiles per row</label>
            <select
              value={kitchenColumns}
              onChange={(e) => setKitchenColumns(Number(e.target.value))}
              className="field"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        {saved && <p className="text-green-600 text-sm">Saved — branding updated everywhere.</p>}

        </div>
        <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200">
          <button
            type="submit"
            disabled={saving}
            className="tap-target w-full py-3 rounded-xl bg-brand-500 text-white font-bold disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Branding"}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden mt-4">
        <h2 className="font-bold px-4 py-3 bg-neutral-50 border-b border-neutral-200">Application Details</h2>
        <div className="p-4 space-y-3">
        <p className="text-xs text-neutral-400">
          Fixed identifiers for this deployment. Not editable here.
        </p>

        <div>
          <label className="block text-sm font-medium mb-1">Application Name</label>
          <input
            value={settings.app_name}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Application Id</label>
          <input
            value={settings.app_id}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500"
          />
        </div>
        </div>
      </div>
    </div>
  );
}
