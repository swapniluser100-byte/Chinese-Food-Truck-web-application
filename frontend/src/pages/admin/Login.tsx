import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAdminToken } from "../../api";
import { useBranding } from "../../BrandingContext";

export function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { settings } = useBranding();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token } = await api.adminLogin(password);
      setAdminToken(token);
      navigate("/admin/menu");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md border border-neutral-200 p-6 w-full max-w-sm space-y-4">
        <div className="flex flex-col items-center gap-1 mb-1">
          {settings.logo_data_url ? (
            <img src={settings.logo_data_url} alt={settings.name} className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <span className="text-4xl">🥡</span>
          )}
          <h1 className="text-xl font-bold text-center mt-1">{settings.name}</h1>
          {settings.slogan && <p className="text-xs text-neutral-500 italic text-center">{settings.slogan}</p>}
          <p className="text-sm text-neutral-400 mt-1">Admin Portal</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="w-full px-4 py-3 rounded-xl border border-neutral-300"
          autoFocus
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-brand-500 text-white font-bold disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
